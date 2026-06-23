
# SlideSync AI ⚡

SlideSync AI is an advanced, full-stack multi-modal educational platform designed to automate the generation of high-quality study materials. By concurrently ingesting and parsing unstructured lecture audio recordings and multi-format slide presentations (PDF/PPTX), the platform uses state-of-the-art Large Language Models (LLMs) to synthesize unified, structured study workspaces tailored to individual student needs.

---

## 🚀 Key Features

- **Multi-Modal Intake Pipeline:** Upload lecture audio clips, presentation slides, or both simultaneously to construct a comprehensive knowledge base.
- **Layout-Aware Slide Scraper:** Structural slide-by-slide parsing built on top of `python-pptx` and `pdfplumber` to extract table data rows, maintain nested indentation lists, and preserve semantic title structures.
- **Staggered AI Coprocessor Engines:** Leverages the high-capacity **Groq API (`llama-3.3-70b-versatile`)** to dynamically build:
  - 🗂️ **Interactive Flashcards:** Up to 10 concept-driven study question/answer pairs forced into clean JSON structures.
  - 🕸️ **Concept Map Graphing:** Visual representations mapping the structural layout architecture of lecture content.
  - 🎧 **Synthetic Podcast Recaps:** Conversational dialogue scripts translated directly into accessible audio summaries.
  - 👨‍🏫 **Mock Oral Viva Simulator:** Live interactive quiz systems supporting text and automated whisper-based speech grading.
- **Isolated Multi-Tenant Security:** A non-blocking asynchronous data tier utilizing **MongoDB** and the **Motor** driver, implementing native **Bcrypt** cryptographic authentication and strict scope queries (`user_email`) to guarantee private session histories and study guides.
- **Token-Ceiling Guard Rails:** Defensive length truncation filters and precise intervals (`asyncio.sleep`) to shield downstream workflows from free-tier Token-Per-Minute (TPM) API limitations.

---

## 🛠️ Tech Stack Matrix

- **Frontend Framework:** React.js (Vite), HTML5, Vanilla CSS3 (Custom Glassmorphism & Fluid Floating Animation Engines).
- **Backend API Layer:** Python 3.10+, FastAPI Framework, Uvicorn Asynchronous Server.
- **Database Vault Layer:** MongoDB Cloud Cluster / Local Community Database Server.
- **Core Orchestration Processing Libraries:** OpenAI SDK, Bcrypt, Motor, Pydantic (v2 Email Validation Tracking), PDFPlumber, Python-PPTX.
- **Inference Hardware Provider:** Groq Cloud Infrastructure Cloud Nodes.

---

## 📂 System Directory Structure

```text
SlideSync/
├── backend/
│   ├── app/
│   │   ├── features/
│   │   │   ├── bookmarks/          # Study Guide parsing pipelines
│   │   │   ├── extraction/         # PPTX/PDF slide structural extractors
│   │   │   ├── flashcards/         # LLM flashcard generation controllers
│   │   │   ├── mindmap/            # Structural mapping engines
│   │   │   ├── podcast/            # Dialogue recap synthesis scripts
│   │   │   ├── transcription/      # Audio Whisper transcript pipelines
│   │   │   └── viva/               # Oral test speech processors
│   │   ├── database.py             # MongoDB connection pooling & setup
│   │   └── main.py                 # Core FastAPI routing & endpoint maps
│   ├── uploads/                    # Local temporary directory file buffer
│   ├── .env                        # Private environment variables configuration
│   └── requirements.txt            # Python production dependencies manifest
└── frontend/
    ├── public/
    │   └── logo.jpeg               # Root brand asset image file
    ├── src/
    │   ├── features/               # Tab modules (Flashcards, StudyGuide, Viva)
    │   ├── App.jsx                 # Master layout UI orchestrator
    │   ├── App.css                 # Premium dark sidebar and animation typography
    │   └── main.jsx                # Web application baseline mounting
    └── package.json                # Node environment dependency list

```

---

## ⚙️ Local Configuration & Deployment

### 1. Prerequisites

Ensure you have the following environments available locally:

* **Node.js** (v18+ LTS recommended)
* **Python** (v3.10 or higher)
* **MongoDB Server** (Running locally on default port `27017` or an Atlas URI cloud cluster string)

---

### 2. Backend Environment Setup

1. Open a clean command prompt and navigate to the `backend` project directory:

```bash
   cd backend

```

2. Set up and activate an isolated Python Virtual Environment:

```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

```

3. Install the compilation requirements:

```bash
   pip install -r requirements.txt

```

4. Create a `.env` configuration template file inside the `backend/` directory root level:

```env
   GROQ_API_KEY=your_secret_groq_api_credential_key_here
   MONGO_URI=mongodb://localhost:27017

```

5. Trigger the live development environment compilation mapping using Uvicorn:

```bash
   uvicorn app.main:app --reload

```

The backend API documentation dashboard will instantly mount at: `http://127.0.0.1:8000/docs`

---

### 3. Frontend App Component Setup

1. Open a separate terminal window and target the `frontend` workspace folder:

```bash
   cd frontend

```

2. Build local module mappings and standard node package assets:

```bash
   npm install

```

3. Establish the runtime parameters:

```bash
   npm run dev

```

Your browser will open up the desktop client mapping environment directly at: `http://localhost:5173/`

---

## 🛡️ Exception Handling & Stability Optimization

SlideSync AI is hardened against unexpected input shapes, missing data, and external rate limit walls:

* **Empty Array Render Guard:** Frontend layouts safely read item indicators using length state parameters (`flashcards && flashcards.length > 0`), ensuring descriptive UI states instead of blank screen browser collapses during underlying processing failures.
* **API Rate Control:** Automated staggering loops separate successive cloud operations via timed delay boundaries, protecting token parameters against server drops.
* **Cryptographic Bounds Checking:** All sensitive user authentication fields safely execute string encodes (`.encode('utf-8')`) before mapping through standard encryption engines, ensuring accurate multi-tenant database lookups.

```

```
