# CRM Data Cleaning & Enrichment Automation

A proof-of-concept application for automated CRM data cleaning and enrichment using Next.js, Spring Boot, n8n, and Supabase.

## Features

- 📤 **File Upload**: Support for CSV and Excel (XLSX) files via drag-and-drop
- 🔍 **Data Preview**: View first 50 rows before processing
- 🗺️ **Column Mapping**: Auto-detect and manually adjust column mappings
- ✨ **Data Cleaning**: Automatic trimming, deduplication, and validation
- 🚀 **Data Enrichment**: 
  - Email verification
  - Company data enrichment
  - Phone number validation
  - Duplicate removal
- 📊 **Real-time Progress**: Live updates using Supabase Realtime
- 💾 **Download Results**: Export cleaned data as CSV
- 💬 **CRM Chat Assistant**: Ask for customer contacts and request contact updates via chat (powered by n8n + Supabase)
- 📧 **Email Sending**: Dispatch emails to processed contacts using customizable templates
- 🌙 **Dark Mode**: Full dark mode support
- 📱 **Responsive Design**: Mobile-friendly layout

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────┐
│   Next.js   │─────▶│  Spring Boot  │─────▶│ Supabase │
│  (Frontend) │      │ (REST API)    │      │ (DB)     │
└─────────────┘      └──────┬───────┘      └──────────┘
            │
            ▼
              ┌─────┐
              │ n8n │
              │(Biz)│
              └─────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------| 
| Frontend | Next.js 16 + React 19 + TypeScript | React framework |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Backend | Spring Boot (Java 17) | REST API, orchestration, DB writes |
| Database | Supabase (PostgreSQL) | Data storage + realtime |
| Automation | n8n | Workflow orchestration |
| Parsing | PapaParser + XLSX | CSV/Excel handling |

---

## Prerequisites

- Node.js 18+ installed
- Java 17+ installed
- A Postgres database (Supabase Postgres recommended)
- Basic understanding of Next.js and n8n

## 🚀 Quick Start

### Step 1: Database Setup (Supabase) — 2 minutes

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
4. Enable Realtime for the `processing_jobs` table:
   - Go to Database → Replication
   - Find `processing_jobs` and enable it

### Step 2: Backend Setup (Spring Boot) — 2 minutes

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

### Step 3: Frontend Setup — 2 minutes

```bash
cd nextjs-app

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and point to Spring
# NEXT_PUBLIC_SPRING_API_URL=http://localhost:8080

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:3000 — you should see the CRM Data Cleaner!

### Step 4: Test Without n8n — 1 minute

You can test the file upload and preview features right now without n8n:

1. Go to http://localhost:3000
2. Click **Upload CSV/Excel**
3. Select `sample-data.csv` from the project root
4. You'll see: file preview ✓, column mapping ✓, enrichment options ✓

**Note**: The "Start Processing" button triggers n8n via Spring, so you still need n8n for the full pipeline.

---

## 🔧 Full Setup with n8n (Optional)

### Step 5: Install & Run n8n

```bash
npm install -g n8n
n8n start
```

n8n will start at http://localhost:5678

### Step 6: Create/Import the n8n Workflow

**Recommended**: Import the provided workflow exports:

1. In n8n, go to **Workflows** → **Import from File**
2. Import [CRM Upload.json](CRM%20Upload.json) and/or [CRM Chat.json](CRM%20Chat.json) and/or [Send Email.json](Send%20Email.json)
3. Ensure the **Webhook** node path is `/webhook/process-crm`
4. Ensure the workflow responds **When Last Node Finishes**
5. Click **Active** to activate the workflow

Or build manually — see [n8n-workflow-guide.md](n8n-workflow-guide.md) for detailed instructions.

**Docker note**: The compose stack persists n8n state in the `n8n_storage` volume. Updating the JSON file in this repo does not automatically update the workflow inside the running n8n container.

### Step 7: Test End-to-End

1. Make sure n8n workflow is **Active**
2. Go to http://localhost:3000
3. Upload `sample-data.csv`
4. Select enrichment options
5. Click **Start Processing**
6. Watch the real-time progress!
7. Download your cleaned data

---

## Codespaces Notes

If you run this stack in GitHub Codespaces:

- Expose/forward port `3000` to open the Next.js UI
- Also forward port `5678` if you want to manage n8n in the browser
- Import workflows from the forwarded n8n URL (port `5678`)

---

## Usage

1. **Upload File**: Click or drag-and-drop a CSV or Excel file
2. **Preview Data**: Review the first 50 rows
3. **Map Columns**: Verify or adjust column mappings
4. **Select Enrichment**: Choose which enrichment operations to apply
5. **Start Processing**: Click "Start Processing" to begin
6. **Monitor Progress**: Watch real-time updates as n8n processes your data
7. **Download Results**: Get your cleaned CSV file
8. **Chat With CRM Assistant**: Use the bottom-right chat widget to retrieve customer contacts and request updates

## Chat Assistant

The app includes a persistent chat widget (bottom-right) that calls Spring endpoints; Spring stores messages in the database and calls n8n to generate assistant responses.

Typical chat requests:
- "Show me the latest 10 processed contacts"
- "Find contact by email john@acme.com"
- "Update John's phone to +1 555-123-4567"
- "Mark this contact as duplicate"

## Data Processing Flow

1. **Upload**: File is parsed in the browser
2. **Validation**: Check for required columns and data format
3. **Cleaning**: Trim whitespace, standardize formatting, remove invalid characters
4. **Deduplication**: Find and merge duplicate records by email
5. **Enrichment**: Verify emails, lookup company data, validate phone numbers
6. **Results**: Store in Supabase and notify frontend via Realtime

### What Gets Cleaned (Sample Data)

- **Trimmed whitespace**: "  Jane Doe  " → "Jane Doe"
- **Lowercase emails**: "JANE.DOE@EXAMPLE.COM" → "jane.doe@example.com"
- **Duplicates removed**: John Smith appears twice, only one kept
- **Invalid emails flagged**: "bob@company" marked as invalid
- **Phone formatting**: Various formats → standardized format
- **Missing data**: Empty fields handled gracefully

---

## Project Structure

```
n8nCRM/
├── nextjs-app/                  # Frontend (Next.js + React + TypeScript)
│   ├── app/
│   │   ├── page.tsx             # Main application page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   ├── lib/
│   │   └── fileParser.ts        # CSV/Excel parsing utilities
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── .env.local.example       # Environment variables template
│   └── package.json
├── n8ncrmbackend/               # Backend (Spring Boot + Java 17)
│   └── src/main/java/...        # REST API, services, JPA entities
├── supabase-schema.sql          # Database schema
├── sample-data.csv              # Test dataset with common issues
├── CRM Upload.json              # n8n workflow export (data processing)
├── CRM Chat.json                # n8n workflow export (chat assistant)
├── Send Email.json              # n8n workflow export (email sending)
├── docker-compose.yml           # Full-stack containerized deployment
├── n8n-workflow-guide.md        # Detailed n8n workflow building guide
├── Project_Report.md            # Formal internship report
└── README.md                    # This file
```

### Database Schema (6 tables)

| Table | Purpose |
|-------|---------|
| `processing_jobs` | Track workflow status and progress |
| `raw_contacts` | Original uploaded data (audit trail) |
| `processed_contacts` | Cleaned/enriched data with metadata |
| `enrichment_logs` | Audit trail of operations applied |
| `chat_sessions` | Chat session metadata |
| `chat_messages` | Individual chat messages |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Column Mapping | Different CSVs use different headers ("Email" vs "Email Address"). Auto-detection + manual override. |
| CSV Conversion in Browser | Simpler architecture, no server-side storage. XLSX → CSV using xlsx library. |
| Supabase Realtime | Live progress updates without polling via postgres_changes channels. |
| Simple HTML Tables | Lightweight, no heavy dependencies. Could upgrade to TanStack Table later. |
| 50-Row Preview Limit | Prevent browser freeze on large files. Virtual scrolling possible later. |
| n8n for Business Logic | Visual workflows allow rapid iteration and easy API integration without backend code changes. |

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
cd nextjs-app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Supabase connection error
- Check your `.env.local` file — no trailing slashes in URL
- Restart the dev server after changing .env

### n8n webhook not working
- Verify the workflow is **Active** in n8n
- Check the webhook URL in env vars
- Check browser console for errors

---

## 🎯 Testing Checklist

- [ ] Frontend loads at localhost:3000
- [ ] Can upload CSV file
- [ ] Preview shows data correctly
- [ ] Column mappings are detected
- [ ] Can toggle enrichment options
- [ ] (With n8n) Processing starts and shows real-time progress
- [ ] (With n8n) Can download results

---

## Future Enhancements

- [ ] User authentication (Supabase Auth / Spring Security)
- [ ] Multiple file upload
- [ ] Advanced deduplication settings
- [ ] More enrichment sources (Clearbit, LinkedIn)
- [ ] Data quality analytics dashboard
- [ ] Export to multiple formats
- [ ] Scheduled processing
- [ ] API access (REST endpoints)
- [ ] Queue-based processing (RabbitMQ/Kafka)

## Notes

- This is a **proof of concept** — not production-ready
- Authentication is not implemented (placeholder exists)
- File size limit: 10MB (can be adjusted)
- Preview shows first 50 rows only
- Chat tables use permissive RLS policies for the POC (tighten for production)

## License

MIT
