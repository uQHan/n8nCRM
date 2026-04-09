# n8n Workflow Guide

This guide explains how to create the n8n workflows for CRM data cleaning and enrichment.

## Overview

The n8n workflow receives data from the Next.js frontend, processes it through multiple stages, and updates Supabase with progress and results.


## File Upload, cleaning, enrichment Workflow

## Workflow Architecture

```
Webhook Trigger
     ↓
Parse & Validate Data
     ↓
Create Job Records → Update Supabase (job created)
     ↓
Data Cleaning (Code)
     ↓
Update Progress (25%)
     ↓
Deduplication (Code - conditional inside)
     ↓
Update Progress (50%)
     ↓
Email Verification (Code - conditional inside)
     ↓
Update Progress (65%)
     ↓
Company Enrichment (Code - conditional inside)
     ↓
Update Progress (80%)
     ↓
Phone Validation (Code - conditional inside)
     ↓
Update Progress (95%)
     ↓
Save Results → Supabase
     ↓
Update Job Status → Completed (100%)
```

## Creating the Workflow

### Step 1: Webhook Trigger

1. Add **Webhook** node
2. Configure:
   - **Webhook Name**: `process-crm`
   - **HTTP Method**: POST
   - **Path**: `/webhook/process-crm`
   - **Response Mode**: Immediately

This receives data from Next.js in this format:
```json
{
  "jobId": "uuid",
  "data": [{ "name": "John", "email": "john@example.com", ... }],
  "columnMappings": { "Full Name": "name", "Email": "email" },
  "enrichmentOptions": {
    "verifyEmails": true,
    "enrichCompanyData": false,
    "validatePhoneNumbers": false,
    "removeDuplicates": true
  },
  "totalRows": 1000
}
```

### Step 2: Extract Variables

Add **Set** node to extract variables:
```javascript
{
  "jobId": "{{ $json.jobId }}",
  "data": "{{ $json.data }}",
  "mappings": "{{ $json.columnMappings }}",
  "options": "{{ $json.enrichmentOptions }}",
  "totalRows": "{{ $json.totalRows }}",
  "processedRows": 0
}
```

### Step 3: Update Job Status - Validating

Add **Supabase** node:
- **Operation**: Update
- **Table**: `processing_jobs`
- **Update Key**: `id`
- **Update Value**: `{{ $json.jobId }}`
- **Fields**:
  ```json
  {
    "status": "cleaning",
    "current_stage": "validating",
    "progress": 10
  }
  ```

### Step 4: Data Cleaning

Add **Code** node (JavaScript):
```javascript
// Get input data
const inputData = $input.all();
const data = inputData[0].json.data;
const mappings = inputData[0].json.mappings;

// Clean each record
const cleanedData = data.map(row => {
  const cleaned = {};
  
  // Apply column mappings and clean data
  for (const [csvCol, crmField] of Object.entries(mappings)) {
    let value = row[csvCol];
    
    if (value && typeof value === 'string') {
      // Trim whitespace
      value = value.trim();
      
      // Remove extra spaces
      value = value.replace(/\s+/g, ' ');
      
      // Email: lowercase
      if (crmField === 'email') {
        value = value.toLowerCase();
      }
      
      // Phone: remove non-digits (basic)
      if (crmField === 'phone') {
        value = value.replace(/[^\d+\-() ]/g, '');
      }
    }
    
    cleaned[crmField] = value || null;
  }
  
  // Add unique ID during cleaning
  cleaned.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return cleaned;
});

return cleanedData.map(item => ({ json: item }));
```

### Step 5: Update Progress - Cleaning Complete

Add **Supabase** node:
```json
{
  "status": "cleaning",
  "current_stage": "cleaning",
  "progress": 25,
  "processed_rows": "{{ $json.length }}"
}
```

### Step 6: Deduplication (Conditional)

Add **Code** node with conditional logic inside:
```javascript
const data = $input.all().map(item => item.json);
const shouldDeduplicate = $('Extract').first().json.options.removeDuplicates;

// If deduplication is disabled, return data as-is
if (!shouldDeduplicate) {
  return data.map(item => ({ json: item }));
}

// Deduplication logic only runs if enabled
const seen = new Map();
const unique = [];
const duplicates = [];

data.forEach(row => {
  const email = row.email?.toLowerCase();
  
  if (!email) {
    unique.push(row);
    return;
  }
  
  if (seen.has(email)) {
    duplicates.push({
      ...row,
      is_duplicate: true,
      duplicate_of: seen.get(email)
    });
  } else {
    seen.set(email, row.id);
    unique.push({
      ...row,
      is_duplicate: false
    });
  }
});

return unique.map(item => ({ json: item }));
```

Update Supabase progress:
```json
{
  "current_stage": "deduplicating",
  "progress": 50
}
```

### Step 7: Email Verification (Conditional)

Add **Code** node with conditional logic inside:
```javascript
const data = $input.all().map(item => item.json);
const shouldVerify = $('Extract').first().json.options.verifyEmails;

// If email verification is disabled, return data as-is
if (!shouldVerify) {
  return data.map(item => ({ json: item }));
}

// Email verification logic only runs if enabled
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const verified = data.map(row => ({
  ...row,
  email_verified: row.email ? emailRegex.test(row.email) : false,
  email_deliverable: row.email ? emailRegex.test(row.email) : false // Basic check only
}));

return verified.map(item => ({ json: item }));
```

**Note**: For production with external APIs like **Hunter.io** or **Abstract API**, you can integrate HTTP request nodes after this code node to enrich with more detailed verification results.

Update progress:
```json
{
  "current_stage": "enriching_emails",
  "progress": 65
}
```

### Step 8: Company Enrichment (Conditional)

Add **Code** node with conditional logic inside:
```javascript
const data = $input.all().map(item => item.json);
const shouldEnrich = $('Extract').first().json.options.enrichCompanyData;

// If company enrichment is disabled, return data as-is
if (!shouldEnrich) {
  return data.map(item => ({ json: item }));
}

// Company enrichment logic only runs if enabled
const enriched = data.map(row => {
  let domain = null;
  
  // Extract domain from email
  if (row.email) {
    const match = row.email.match(/@(.+)$/);
    domain = match ? match[1] : null;
  }
  
  return {
    ...row,
    company_domain: domain
  };
});

return enriched.map(item => ({ json: item }));
```

**Note**: For production, integrate HTTP request nodes (e.g., Clearbit API) after this code node to fetch actual company data using the extracted domain.

Update progress:
```json
{
  "current_stage": "enriching_companies",
  "progress": 80
}
```

### Step 9: Phone Validation (Conditional)

Add **Code** node with conditional logic inside:
```javascript
const data = $input.all().map(item => item.json);
const shouldValidate = $('Extract').first().json.options.validatePhoneNumbers;

// If phone validation is disabled, return data as-is
if (!shouldValidate) {
  return data.map(item => ({ json: item }));
}

// Phone validation logic only runs if enabled
const validated = data.map(row => {
  let phone = row.phone;
  let isValid = false;
  
  if (phone) {
    // Basic formatting (US numbers)
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      phone = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      isValid = true;
    } else if (digits.length === 11 && digits[0] === '1') {
      phone = `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
      isValid = true;
    }
  }
  
  return {
    ...row,
    phone_formatted: phone,
    phone_valid: isValid
  };
});

return validated.map(item => ({ json: item }));
```

Update progress:
```json
{
  "current_stage": "validating_phones",
  "progress": 95
}
```

### Step 10: Prepare Data for Insert

Add **Code** node to construct final records with all required fields:
```javascript
const data = $input.all().map(item => item.json);
const jobId = $('Extract').first().json.jobId;

// Build final records with only schema-matching fields
const finalRecords = data.map(row => {
  return {
    // Cleaned fields
    name: row.name || null,
    email: row.email || null,
    phone: row.phone || null,
    company: row.company || null,
    title: row.title || null,
    address: row.address || null,
    city: row.city || null,
    state: row.state || null,
    country: row.country || null,
    zip: row.zip || null,
    website: row.website || null,
    
    // Enriched fields
    email_verified: row.email_verified || false,
    email_deliverable: row.email_deliverable || false,
    company_domain: row.company_domain || null,
    phone_formatted: row.phone_formatted || null,
    phone_valid: row.phone_valid || false,
    
    // Metadata
    job_id: jobId,
    enriched: true,
    is_duplicate: row.is_duplicate || false,
    duplicate_of: row.duplicate_of || null,
    data_quality_score: 85
  };
});

return finalRecords.map(item => ({ json: item }));
```

### Step 11: Save to Supabase

Add **Supabase** node:
- **Operation**: Insert
- **Table**: `processed_contacts`
- **Mapping**: Auto map (automatically maps all returned fields from the Code node)

### Step 12: Mark Job Complete

Add **Supabase** node:
- **Operation**: Update
- **Table**: `processing_jobs`
- **Update Key**: `id`
- **Update Value**: `{{ $node['Extract'].json.jobId }}`
- **Fields**:
  ```json
  {
    "status": "completed",
    "current_stage": "completed",
    "progress": 100
  }
  ```

## Error Handling

Add **Error Trigger** node and connect to all main nodes:

1. Catch errors
2. Update Supabase:
```json
{
  "status": "failed",
  "current_stage": "failed",
  "error_count": "={{ $json.error_count + 1 }}"
}
```

## Testing the Workflow

1. Save and activate the workflow
2. Note the webhook URL (e.g., `http://localhost:5678/webhook/process-crm`)
3. Update your Next.js `.env.local` with this URL
4. Upload a test CSV file in the frontend
5. Monitor the workflow execution in n8n

## Tips

- Use **Sticky Notes** in n8n to document each stage
- Add **Function** nodes for custom logic
- Use **Split In Batches** for large datasets
- Enable workflow execution data retention for debugging
- Test with small datasets first

## Production Considerations

- Add proper error handling and retries
- Implement rate limiting for API calls
- Use environment variables for API keys
- Add logging nodes
- Consider queue-based processing for large files
- Implement webhook authentication
