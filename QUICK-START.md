# Quick Setup Guide

This is a step-by-step guide to get your CRM Data Cleaning & Enrichment project up and running quickly.

## Prerequisites

- Node.js 18+ installed
- Java 17+ installed
- A Postgres database (Supabase Postgres recommended)
- Basic understanding of Next.js and n8n

## 🚀 Quick Start (5 minutes)

### Step 1: Database Setup (Supabase Postgres) (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **SQL Editor** and run the contents of `supabase-schema.sql`

### Step 2: Backend Setup (Spring Boot) (2 minutes)

Set env vars for the backend (PowerShell example):

```powershell
$env:SUPABASE_DB_JDBC_URL="jdbc:postgresql://<host>:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USER="postgres"
$env:SUPABASE_DB_PASSWORD="<password>"

$env:N8N_CRM_WEBHOOK_URL="http://localhost:5678/webhook/process-crm"
$env:N8N_CHAT_WEBHOOK_URL="http://localhost:5678/webhook/chat"
```

Run the backend:

```powershell
cd n8ncrmbackend
./gradlew bootRun
```

Backend will run at http://localhost:8080

### Step 3: Frontend Setup (2 minutes)

```bash
# Navigate to the Next.js app
cd nextjs-app

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and point to Spring
# NEXT_PUBLIC_SPRING_API_URL=http://localhost:8080

# Install dependencies (already done if you followed previous steps)
npm install

# Start the development server
npm run dev
```

Open http://localhost:3000 - you should see the CRM Data Cleaner!

### Step 4: Test Without n8n (1 minute)

You can test the file upload and preview features right now without n8n:

1. Go to http://localhost:3000
2. Click **Upload CSV/Excel**
3. Select `sample-data.csv` from the project root
4. You'll see:
   - ✓ File preview
   - ✓ Column mapping
   - ✓ Enrichment options

**Note**: The "Start Processing" button triggers n8n via Spring, so you still need n8n for the full pipeline.

---

## 🔧 Full Setup with n8n (Optional)

If you want the complete workflow with actual data processing:

### Step 5: Install n8n

```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start
```

n8n will start at http://localhost:5678

### Step 6: Create the n8n Workflow

1. Open http://localhost:5678
2. Create a new workflow
3. Follow the detailed instructions in `n8n-workflow-guide.md`
4. Or import a pre-built workflow (if provided)

In the new architecture, n8n does not write to the database directly; it returns processed records to Spring.

### Step 7: Test End-to-End

1. Make sure n8n workflow is **Active**
2. Go to http://localhost:3000
3. Upload `sample-data.csv`
4. Select enrichment options
5. Click **Start Processing**
6. Watch the real-time progress!
7. Download your cleaned data

---

## 📊 What Data Gets Cleaned?

Using the sample data, you'll see:

- **Trimmed whitespace**: "  Jane Doe  " → "Jane Doe"
- **Lowercase emails**: "JANE.DOE@EXAMPLE.COM" → "jane.doe@example.com"
- **Duplicates removed**: John Smith appears twice, only one kept
- **Invalid emails flagged**: "bob@company" marked as invalid
- **Phone formatting**: Various formats → standardized format
- **Missing data**: Empty fields handled gracefully

---

## 🎯 Testing Checklist

- [ ] Frontend loads at localhost:3000
- [ ] Can upload CSV file
- [ ] Preview shows data correctly
- [ ] Column mappings are detected
- [ ] Can toggle enrichment options
- [ ] (With n8n) Processing starts
- [ ] (With n8n) Real-time progress updates
- [ ] (With n8n) Can download results

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Make sure you're in the right directory
cd nextjs-app

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try again
npm run dev
```

### Supabase connection error
- Check your `.env.local` file
- Make sure URL and key are correct
- No trailing slashes in URL
- Restart the dev server after changing .env

### n8n webhook not working
- Check the webhook URL in `.env.local`
- Make sure n8n is running
- Verify the workflow is **Active**
- Check browser console for errors

### Preview not showing
- Check browser console (F12)
- Verify the CSV file has headers
- Try the sample-data.csv first

---

## 📝 Sample Data Issues

The `sample-data.csv` intentionally includes:
- Duplicate entries (John Smith x2)
- Invalid emails (bob@company, sarah@invalid-email)
- Various phone formats
- Extra whitespace
- Mixed casing
- Missing fields

This helps demonstrate the cleaning capabilities!

---

## 🎓 Next Steps

1. **Try with your own data**: Upload a real CRM export
2. **Customize enrichment**: Modify n8n workflow for your needs
3. **Add API integrations**: Connect Hunter.io, Clearbit, etc.
4. **Extend the schema**: Add custom fields in Supabase
5. **Build analytics**: Create dashboards for data quality

---

## 💡 Tips

- Start with small files (<100 rows) for testing
- Check Supabase Table Editor to see processed data
- Monitor n8n execution logs for debugging
- Use the browser console to see real-time updates
- Keep sample-data.csv as a reference

---

## 📚 Documentation

- [README.md](README.md) - Full project overview
- [n8n-workflow-guide.md](n8n-workflow-guide.md) - Detailed workflow setup
- [supabase-schema.sql](supabase-schema.sql) - Database schema

---

## ✅ Project Status

After completing this setup, you should have:
- ✓ Modern React frontend with file upload
- ✓ CSV/Excel parsing with preview
- ✓ Column mapping interface
- ✓ Enrichment options selection
- ✓ Supabase database configured
- ✓ Real-time progress tracking (with n8n)
- ✓ Download cleaned data (with n8n)

**Estimated setup time**: 5 minutes (frontend only) or 30 minutes (with n8n)

---

Need help? Check the troubleshooting section or review the full README.md!
