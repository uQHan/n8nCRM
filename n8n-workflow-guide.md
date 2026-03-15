# n8n Workflow Guide

This guide explains how to create the n8n workflows for CRM data cleaning and enrichment.

## Overview

The n8n workflow receives data from the Next.js frontend, processes it through multiple stages, and updates Supabase with progress and results.

## Workflow Architecture

```
Webhook Trigger
     ↓
Parse & Validate Data
     ↓
Create Job Records → Update Supabase (job created)
     ↓
Stage 1: Data Cleaning
     ├── Trim whitespace
     ├── Standardize formats
     └── Update progress (25%)
     ↓
Stage 2: Deduplication (if enabled)
     ├── Find duplicates
     ├── Merge records
     └── Update progress (50%)
     ↓
Stage 3: Email Verification (if enabled)
     ├── Validate format
     ├── Check deliverability
     └── Update progress (65%)
     ↓
Stage 4: Company Enrichment (if enabled)
     ├── Extract domain from email
     ├── Lookup company data
     └── Update progress (80%)
     ↓
Stage 5: Phone Validation (if enabled)
     ├── Format phone numbers
     ├── Validate numbers
     └── Update progress (95%)
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

### Step 2: Initialize Variables

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

Add **IF** node to check if deduplication is enabled:
- **Condition**: `{{ $node["Initialize"].json.options.removeDuplicates }} === true`

**True Branch** - Add **Code** node:
```javascript
const data = $input.all().map(item => item.json);

// Simple deduplication by email
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
    const id = `${Date.now()}-${Math.random()}`;
    seen.set(email, id);
    unique.push({
      ...row,
      id,
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

Add **IF** node: `{{ $node["Initialize"].json.options.verifyEmails }} === true`

**True Branch** - Add **HTTP Request** node for each record:

For a free solution, add **Code** node for basic validation:
```javascript
const data = $input.all().map(item => item.json);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const verified = data.map(row => {
  const email = row.email;
  const isValid = email && emailRegex.test(email);
  
  return {
    ...row,
    email_verified: isValid,
    email_deliverable: isValid // Basic check only
  };
});

return verified.map(item => ({ json: item }));
```

For production, use **Hunter.io** or **Abstract API**:
```javascript
// HTTP Request node setup
{
  "method": "GET",
  "url": "https://api.hunter.io/v2/email-verifier",
  "options": {
    "qs": {
      "email": "={{ $json.email }}",
      "api_key": "YOUR_API_KEY"
    }
  }
}
```

Update progress:
```json
{
  "current_stage": "enriching_emails",
  "progress": 65
}
```

### Step 8: Company Enrichment (Conditional)

Add **IF** node: `{{ $node["Initialize"].json.options.enrichCompanyData }} === true`

**True Branch** - Add **Code** node to extract domains:
```javascript
const data = $input.all().map(item => item.json);

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

Then add **HTTP Request** for Clearbit or similar:
```javascript
{
  "method": "GET",
  "url": "https://company.clearbit.com/v2/companies/find",
  "options": {
    "qs": {
      "domain": "={{ $json.company_domain }}"
    },
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}
```

Update progress:
```json
{
  "current_stage": "enriching_companies",
  "progress": 80
}
```

### Step 9: Phone Validation (Conditional)

Add **IF** node: `{{ $node["Initialize"].json.options.validatePhoneNumbers }} === true`

**True Branch** - Add **Code** node:
```javascript
const data = $input.all().map(item => item.json);

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

### Step 10: Save to Supabase

Add **Supabase** node:
- **Operation**: Insert
- **Table**: `processed_contacts`
- **Fields**: Map all fields from the processed data
- **Additional Fields**:
  ```json
  {
    "job_id": "{{ $node['Initialize'].json.jobId }}",
    "enriched": true,
    "data_quality_score": 85
  }
  ```

### Step 11: Mark Job Complete

Add **Supabase** node:
```json
{
  "status": "completed",
  "current_stage": "completed",
  "progress": 100,
  "processed_rows": "={{ $json.length }}"
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
