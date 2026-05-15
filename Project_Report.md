# PROJECT INTERNSHIP REPORT: CRM DATA CLEANING & ENRICHMENT AUTOMATION

## 1. INTRODUCTION

In the digital age, businesses handle an increasingly vast amount of customer data. Managing this data efficiently, ensuring its accuracy, and enriching it with actionable insights are critical tasks for modern enterprises. Traditional Customer Relationship Management (<span style="color:lightred">CRM</span>) systems often struggle with raw data that contains duplicates, formatting errors, and missing fields. The manual process of cleaning and verifying this data is not only time-consuming but also prone to human error, leading to inefficiencies in marketing, sales, and customer support. 

This project aims to build an automated **CRM Data Cleaning & Enrichment Automation** system. The objective is to provide a platform where users can upload raw contact data (such as CSV or Excel files), and the system will automatically process, clean, deduplicate, and enrich the data using external sources. The project leverages modern web technologies, a robust backend architecture, and a powerful workflow automation engine to achieve these goals.

The research and development process involves designing a microservice-oriented architecture, integrating frontend interfaces with backend services, and orchestrating complex data workflows. The scope includes file parsing, real-time progress tracking, email verification, company data enrichment, and an interactive **CRM Chat Assistant** that allows users to query and update contact information using natural language.

## 2. COMPANY INTRODUCTION

### 2.1. Internship Organization
**Company Name:** Viet Tri Dao Digital Technology Co., Ltd.  
**Address:** 27 Xuan Hoa 2, Thanh Khe Dong, Thanh Khe, Da Nang  
**Email:** viettridao@gmail.com  
**Website:** https://sites.google.com/view/viettridao-ittrainingcenter/  

### 2.2. General Introduction
Viet Tri Dao is an IT training center with the slogan "Choose Viet Tri Dao - Proficient Skills". The center offers a variety of training programs for numerous roles: Developer, Tester, Business Analyst (BA), Project Manager (PM), etc., featuring experienced instructors and cost-effective tuition fees.

### 2.3. Operational Goals
Viet Tri Dao aims to become the most reputable IT training institution, based on the commitment to the most economical tuition fees and the shortest possible learning time tailored to each student. The success of the center is measured by the employment success of each individual student. To achieve this goal, the center organizes large-scale internship programs to provide students with real-world project experience, bridging the gap between academic knowledge and industry requirements.

### 2.4. Organization of Activities
The company organizes flexible training models focusing on personalized curricula. Courses are primarily conducted 1-on-1. The center closely monitors progress, supports students in their studies and career orientation, and continuously adapts to the evolving technology landscape. The internship program simulated a real-world software development project, requiring interns to collaborate across different roles including Frontend, Backend, QA, and DevOps.

## 3. SYSTEM DESIGN

### 3.1. Architectural Reasoning
The architecture of the CRM Data Cleaning & Enrichment Automation system was selected to prioritize scalability, maintainability, and rapid iteration. A monolithic approach was discarded in favor of a service-oriented architecture (SOA) that distinctly separates the frontend presentation layer, backend orchestration layer, and workflow automation layer. By isolating the complex data enrichment logic into a dedicated workflow engine (n8n), the backend remains lightweight, solely responsible for API management and data persistence. This modularity ensures that new enrichment integrations can be introduced without deploying new backend code.

### 3.2. Technology Stack
The technology stack was carefully curated to utilize modern, robust, and industry-standard tools.

#### 3.2.1. Next.js (Frontend)
**Introduction:** Next.js is a React framework that enables server-side rendering and static website generation. 
**Reasoning:** It was chosen for the frontend to provide a highly responsive, Single-Page Application (SPA) experience while offering excellent developer ergonomics through its App Router and built-in API routes. It integrates seamlessly with React and allows for the rapid development of interactive data mapping interfaces.

#### 3.2.2. Spring Boot (Backend)
**Introduction:** Spring Boot is a Java-based open-source framework used to create microservices and standalone, production-grade Spring-based applications.
**Reasoning:** Serving as the core backend, Spring Boot offers unparalleled robustness, security, and transaction management. It safely orchestrates database updates using Spring Data JPA and handles asynchronous communications with the workflow engine, ensuring data integrity is maintained at all times.

#### 3.2.3. n8n (Automation Engine)
**Introduction:** n8n is an extendable workflow automation tool with a fair-code distribution model that allows users to connect various apps and APIs.
**Reasoning:** Instead of writing complex, hard-coded data cleaning logic inside the backend, n8n was employed to build visual, node-based workflows. This significantly accelerates development and simplifies the integration of third-party APIs (like Clearbit and Hunter.io) for data enrichment.

#### 3.2.4. Supabase PostgreSQL (Database)
**Introduction:** Supabase is an open-source Firebase alternative that provides a dedicated PostgreSQL database along with real-time subscriptions and authentication.
**Reasoning:** PostgreSQL ensures ACID compliance for reliable data storage. Supabase's Realtime feature was specifically chosen to instantly broadcast job progress updates back to the frontend without relying on resource-intensive long-polling techniques.

#### 3.2.5. Tailwind CSS
**Introduction:** Tailwind CSS is a utility-first CSS framework packed with classes that can be composed to build any design directly in the markup.
**Reasoning:** It was utilized to build a clean, consistent, and highly responsive user interface without the overhead of writing custom CSS files, enabling rapid prototyping and adherence to modern design aesthetics.

## 4. SYSTEM CONSTRUCTION

### 4.1. System Actors
The system is designed to serve various user roles, each with specific interactions and privileges:

| Actor | Description | Privileges |
|-------|-------------|------------|
| **Data Analyst / User** | The primary actor who interacts with the frontend application. | Uploads raw CSV/Excel files, configures column mappings, selects enrichment options, downloads finalized data, interacts with the Chat Assistant, and sends emails. |
| **System Administrator** | Responsible for managing system configurations and monitoring health. | Reviews processing jobs, monitors enrichment logs, manages error rates, and ensures system stability. |
| **CRM Chat Assistant (AI)** | An automated actor powered by n8n that processes natural language. | Retrieves specific contacts, summarizes data, and performs updates based on user prompts. |
| **External API Providers** | Third-party services (e.g., Hunter.io, Clearbit) that provide data. | Acts as external actors supplying validation and enrichment data to the automation engine. |

### 4.1.1. System Use Cases
The following table outlines the core use cases for the CRM Data Cleaning & Enrichment Automation system:

| Use Case ID | Use Case Name | Primary Actor | Description |
|-------------|---------------|---------------|-------------|
| UC-01 | Upload Contact Data | Data Analyst / User | Upload raw CSV or Excel files containing customer contacts. |
| UC-02 | Map Data Columns | Data Analyst / User | Map uploaded file columns to the system's expected schema. |
| UC-03 | Configure Enrichment | Data Analyst / User | Select specific cleaning and enrichment operations (e.g., Deduplication). |
| UC-04 | Monitor Processing | Data Analyst / User | View real-time progress of the data processing job. |
| UC-05 | Download Cleaned Data | Data Analyst / User | Export the finalized, enriched dataset as a CSV file. |
| UC-06 | Send Emails | Data Analyst / User | Dispatch emails to processed contacts using customizable templates. |
| UC-07 | Query Contacts via Chat | Data Analyst / User | Use natural language to ask the AI assistant for specific contact details. |
| UC-08 | Answer User Queries | CRM Chat Assistant | Process user chat input and return relevant contact information. |
| UC-09 | Provide Validation Data | External API Providers| Supply data to verify emails, format phone numbers, and enrich company details. |
| UC-10 | Monitor System Health | System Administrator | Review job statuses, error logs, and overall system performance. |

### 4.2. Preliminary Flow Model
The application workflow is divided into three primary real-time sequences: Data Processing, Chat Interaction, and Email Dispatching.

#### 4.2.1. Data Processing & Enrichment Flow
1. **File Upload & Parsing:** The user uploads a file via the Next.js frontend. The file is parsed in the browser (using PapaParse/XLSX), and a preview of the first 50 rows is displayed.
2. **Configuration:** The user maps the CSV columns to the system's expected fields (Name, Email, Phone, etc.) and selects the desired enrichment operations (e.g., Remove Duplicates, Verify Emails).
3. **Job Initiation:** The frontend sends a request to the Spring Boot backend, which creates a `ProcessingJob` in the Supabase database.
4. **Workflow Orchestration:** The backend triggers the **n8n Workflow Engine** via a webhook, passing the raw data and configuration.
5. **Data Processing:** n8n processes the data in stages: formatting, deduplication, email verification, company enrichment, and phone validation.
6. **Data Storage & Real-time Updates:** n8n returns the processed data to the Spring Boot backend, which saves it to the `processed_contacts` table. Supabase Realtime broadcasts these database changes back to the frontend, updating the progress bar dynamically.
7. **Completion & Export:** Once the job is marked as completed, the user can view the statistics and download the enriched CSV file.

#### 4.2.2. CRM Chat Assistant Flow
1. **Session Initialization:** The user opens the Chat Widget, creating a unique `ChatSession` in the backend.
2. **User Query:** The user inputs a natural language query (e.g., "Find contact details for John").
3. **Context Aggregation:** The Next.js frontend sends the query to the Spring Boot backend, which retrieves recent message history to build context.
4. **AI Processing:** The backend forwards the query and context to the n8n Chat Webhook.
5. **Data Retrieval & Response:** The n8n engine interprets the prompt, interacts with the database or external APIs if necessary, and returns a natural language response back to the backend.
6. **Delivery:** The backend saves the `ChatMessage` and delivers the AI's response to the frontend widget.

#### 4.2.3. Email Sending Flow
1. **Template Selection:** The user selects target contacts and drafts an email subject and body using dynamic placeholders (e.g., `[cname]`, `[ccompany]`).
2. **Preview Generation:** The user can request a live preview where the Spring Boot backend replaces placeholders with actual contact data.
3. **Dispatch Request:** The user confirms sending and selects a delivery mode (SMTP or n8n Webhook).
4. **Delivery Execution:** 
   - *If SMTP:* Spring Boot processes the templates and sends the emails directly via standard SMTP protocols.
   - *If n8n:* Spring Boot passes the rendered content to an n8n webhook, which orchestrates sending the emails through third-party services.
5. **Status Logging:** The backend records the success or failure of each email and presents a summary report to the user.

### 4.3. System Microservices / Components
To ensure scalability and maintainability, the system is built using a service-oriented architecture comprising the following main components:

* **Frontend Application (Next.js):** 
  Built with React 19, TypeScript, and Tailwind CSS. It handles client-side parsing, column mapping, real-time UI updates, and provides the Chat Widget interface.
* **Backend Service (Spring Boot):** 
  A Java 17 REST API that acts as the core orchestrator. It handles HTTP requests from the frontend, manages database transactions using Spring Data JPA, and communicates with n8n via REST clients. Key services include `CrmJobService`, `ChatService`, and `EmailService`.
* **Automation Engine (n8n):** 
  A node-based workflow automation tool. It executes the complex business logic for data cleaning and enrichment. Separating this logic into n8n allows for rapid iteration and easy integration with external APIs without modifying the core backend code.
* **Database (Supabase PostgreSQL):** 
  A relational database storing jobs, raw contacts, processed contacts, and chat sessions. It utilizes Row-Level Security (<span style="color:lightred">RLS</span>) and provides WebSockets capabilities for real-time client updates.

### 4.4. List of Screens
The application features a streamlined, Single-Page Application (<span style="color:lightred">SPA</span>) experience with the following primary views:
* **Upload Screen:** Drag-and-drop interface for file selection.
* **Data Preview & Mapping Screen:** Displays a tabular preview of the uploaded data and dropdowns for mapping columns.
* **Enrichment Configuration Panel:** Toggle switches for selecting specific cleaning and enrichment tasks.
* **Processing Progress Screen:** A real-time progress bar with status indicators for ongoing jobs.
* **Results & Dashboard Screen:** Displays processing statistics (total rows, duplicates found, errors) and a download button for the final dataset.
* **Email Sending Interface:** A specialized screen for dispatching emails to processed contacts using customizable templates.
* **CRM Chat Assistant Widget:** A persistent, floating chat interface available across all screens for querying data.

### 4.5. Screen Drafts
The UI adheres to modern design principles, utilizing a clean layout with Indigo and Gray color palettes. 
* The **Upload Section** uses dashed borders with intuitive iconography to encourage drag-and-drop actions.
* The **Progress Section** utilizes smooth CSS transitions to visually represent data processing stages.
* The **Chat Widget** is styled with a glassmorphism effect, featuring a scrollable message history and a responsive input area.

### 4.6. Database Design
The database is structured to maintain data integrity and track the complete lifecycle of a processing job.
* `processing_jobs`: Tracks job status, progress percentage, and row counts.
* `raw_contacts`: Stores the initial, unmodified JSON data for auditing.
* `processed_contacts`: The core table containing standard fields (name, email, phone) and enriched metadata (email_verified, company_domain, is_duplicate, data_quality_score).
* `enrichment_logs`: Records the specific operations applied to each contact.
* `chat_sessions` & `chat_messages`: Stores the conversational history between the user and the CRM Chat Assistant.


## 5. SYSTEM DEVELOPMENT RESULTS

### 5.1. Project Deployment
The project was successfully developed and can be deployed using containerization technologies. A `docker-compose.yml` file is configured to spin up the entire stack, including PostgreSQL, n8n, Spring Boot Backend, and the Next.js Frontend. 
* The **Backend** utilizes Flyway for automated database migrations (`V1__init_schema.sql` to `V4__ensure_processing_and_contacts.sql`).
* The **Frontend** connects to the backend via standard HTTP and directly to Supabase for real-time WebSocket subscriptions.
* The **n8n Workflows** are configured to receive webhooks from the Spring backend, process data in memory, and return JSON responses synchronously.

### 5.2. Test Report
Comprehensive testing was conducted across different layers:
* **Frontend Testing:** Verified file parsing logic (CSV/Excel conversion), state management, and real-time UI responsiveness.
* **Backend Testing:** Implemented integration tests using **Testcontainers** (PostgreSQL) to validate repository logic, asynchronous job processing (`@Async`), and REST API endpoints.
* **Workflow Validation:** Simulated various dirty datasets (e.g., malformed emails, inconsistent phone formats, duplicate entries) to ensure the n8n logic correctly standardizes and flags the data.
* **Overall Result:** The system successfully handles datasets of up to several thousand rows, accurately mapping columns and applying deduplication algorithms without significant latency.

### 5.3. Completed Functions and Screens
All core functional requirements have been successfully implemented:
* **Frontend:** Fully responsive Next.js application with file upload, interactive column mapping, real-time progress indicators, and a floating chat widget.
* **Backend:** Robust Spring Boot REST API that orchestrates the entire flow, manages database transactions, handles email template rendering, and integrates with the n8n workflow engine.
* **Automation:** Configured n8n workflows for data cleaning (whitespace trimming, formatting), deduplication (fuzzy matching by email), email verification, and company enrichment.
* **Database:** Supabase PostgreSQL schema with automatic timestamp triggers and real-time broadcasting enabled for `processing_jobs`.

## 6. CONCLUSION

### 6.1. Achieved Results
During the development of this project, numerous technical milestones were achieved. The implementation of a microservice-like architecture separating the frontend, backend, and workflow automation engine proved highly effective. The system successfully demonstrates the capability to ingest raw data, process it intelligently, and provide a polished, enriched dataset ready for enterprise use. 

Furthermore, the integration of **Supabase Realtime** provided a modern, engaging user experience without the need for manual page refreshes. The addition of the **CRM Chat Assistant** highlights the system's extensibility and the power of integrating natural language processing into traditional data management tools.

### 6.2. Limitations
Despite the successful implementation, several limitations remain:
* **Authentication & Authorization:** The current proof-of-concept lacks a robust user authentication system (e.g., JWT, OAuth2). The database Row-Level Security policies are currently set to permissive mode for development purposes.
* **File Size Handling:** Client-side parsing and synchronous webhook processing limit the maximum file size that can be handled efficiently. Extremely large datasets might cause browser memory issues or webhook timeouts.
* **External API Reliance:** Advanced enrichment features depend on external APIs (e.g., Clearbit, Hunter.io), which may introduce rate limits or latency into the processing pipeline.

### 6.3. Development Directions
To elevate the system to a production-ready state, the following enhancements are planned:
* **Implement Security:** Integrate Supabase Auth or Spring Security OAuth2 to secure endpoints and restrict data access based on user roles.
* **Batch Processing & Queues:** Refactor the n8n integration to use asynchronous message queues (e.g., RabbitMQ, Kafka) instead of synchronous webhooks to support massive datasets and background processing.
* **Enhanced AI Capabilities:** Upgrade the CRM Chat Assistant to utilize advanced Large Language Models (<span style="color:lightred">LLMs</span>) for more complex data analysis and predictive insights.
* **Expanded Integrations:** Add direct integrations with popular CRM platforms (Salesforce, HubSpot) to automatically push enriched data without requiring CSV downloads.

## 7. REFERENCES
* Spring Boot Documentation: https://spring.io/projects/spring-boot
* Next.js Documentation: https://nextjs.org/docs
* n8n Workflow Automation: https://docs.n8n.io/
* Supabase Database & Realtime: https://supabase.com/docs
* PapaParse Library: https://www.papaparse.com/
* GitHub Source Code Repository: https://github.com/uQHan/n8nCRM
