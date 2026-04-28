# CRM Data Cleaning & Enrichment Automation

A proof-of-concept application for automated CRM data cleaning and enrichment using Next.js, n8n, and Supabase.

## Features

- 📤 **File Upload**: Support for CSV and Excel (XLSX) files
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

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. In the Supabase SQL Editor, run the schema from `supabase-schema.sql`
4. Enable Realtime for the `processing_jobs` table:
   - Go to Database → Replication
   - Find `processing_jobs` and enable it

### 2. Environment Variables

1. Copy the environment template:
   ```bash
   cd nextjs-app
   cp .env.local.example .env.local
   ```

2. Point the frontend at the Spring backend:
   ```env
   NEXT_PUBLIC_SPRING_API_URL=http://localhost:8080
   ```

### 3. Install Dependencies

```bash
cd nextjs-app
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. n8n Setup

1. Install n8n (if not already installed):
   ```bash
   npm install -g n8n
   ```

2. Run n8n:
   ```bash
   n8n start
   ```

3. Create workflows in n8n with:
   - **Webhook trigger** at `/webhook/process-crm`
   - **Data cleaning nodes** (see `n8n-workflow-guide.md` for details)
   - Return processed records to Spring (Spring saves to DB)

4. (Optional) Create a second workflow for the **CRM Chat Assistant**:
   - **Webhook trigger** at `/webhook/chat` (or set `NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL` to your n8n webhook URL)
   - Read chat input + session context
   - Return JSON in the shape: `{ "output": "...assistant reply..." }`

## Project Structure

```
nextjs-app/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   └── fileParser.ts     # CSV/Excel parsing utilities
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   └── supabase/         # Supabase client configuration
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── .env.local.example    # Environment variables template
└── package.json
```

## Usage

1. **Upload File**: Click or drag-and-drop a CSV or Excel file
2. **Preview Data**: Review the first 50 rows
3. **Map Columns**: Verify or adjust column mappings
4. **Select Enrichment**: Choose which enrichment operations to apply
5. **Start Processing**: Click "Start Processing" to begin
6. **Monitor Progress**: Watch real-time updates as n8n processes your data
7. **Download Results**: Get your cleaned CSV file
8. **Chat With CRM Assistant**: Use the bottom-right chat widget to retrieve customer contacts and request updates (the chat workflow runs in n8n)

## Chat Assistant (Contacts)

The app includes a persistent chat widget (bottom-right) that calls Spring endpoints; Spring stores messages in the database and calls n8n to generate assistant responses.

Typical chat requests you can support in n8n:

- “Show me the latest 10 processed contacts”
- “Find contact by email john@acme.com”
- “Update John’s phone to +1 555-123-4567”
- “Mark this contact as duplicate”

Note: The exact behavior depends on how you implement the n8n chat workflow (the frontend posts `sessionId`, `chatInput`, and recent messages for context).

## Data Processing Flow

1. **Upload**: File is parsed in the browser
2. **Validation**: Check for required columns and data format
3. **Cleaning**: 
   - Trim whitespace
   - Standardize formatting
   - Remove invalid characters
4. **Deduplication**: Find and merge duplicate records
5. **Enrichment**: 
   - Verify emails
   - Lookup company data
   - Validate phone numbers
6. **Results**: Store in Supabase and notify frontend

## Technologies

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Automation**: n8n
- **File Parsing**: PapaParser (CSV) + XLSX
- **Real-time**: Supabase Realtime

## Future Enhancements

- [ ] User authentication
- [ ] Multiple file upload
- [ ] Advanced deduplication settings
- [ ] More enrichment sources
- [ ] Data quality analytics dashboard
- [ ] Export to multiple formats
- [ ] Scheduled processing
- [ ] API access

## Notes

- This is a **proof of concept** - not production-ready
- Authentication is not implemented (placeholder exists)
- File size limit: 10MB (can be adjusted)
- Preview shows first 50 rows only
- Chat tables use permissive RLS policies for the POC (tighten for production)

## License

MIT
