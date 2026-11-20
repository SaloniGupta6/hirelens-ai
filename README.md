# HireLens AI — Intelligent Resume Screening & Candidate Ranking Platform

**HireLens AI** is a web-based resume screening and candidate ranking platform designed to help recruiters streamline the initial hiring process. It analyzes candidate resumes against job descriptions, extracts relevant information, evaluates skills and experience, and generates comparative candidate rankings.

The platform combines a React-based recruiter dashboard with a Python FastAPI backend to provide a centralized environment for managing job openings, screening resumes, comparing candidates, and analyzing recruitment results.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Application Workflow](#application-workflow)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Data Storage and Limitations](#data-storage-and-limitations)
- [Future Enhancements](#future-enhancements)
- [Author](#author)

---

## Overview

Recruitment teams often receive a large number of resumes for a single job opening. Manually reviewing every application, identifying relevant skills, evaluating experience, and comparing candidates can be time-consuming.

HireLens AI addresses this challenge by providing an organized resume-screening workflow.

Recruiters can:

1. Manage job openings and their requirements.
2. Upload candidate resumes in PDF and DOCX formats.
3. provide a job description for screening.
4. Extract candidate information from uploaded resumes.
5. Analyze skills, education, and professional experience.
6. Calculate candidate-job matching scores.
7. Rank candidates based on their screening results.
8. Compare candidates and review their strengths and missing skills.
9. Explore recruitment analytics and screening history.

The goal is to make the initial recruitment process more efficient, structured, and transparent while keeping final hiring decisions under human control.

## Problem Statement

Traditional resume screening presents several challenges:

- Manual resume review consumes significant recruiter time.
- Candidate information is scattered across different documents.
- Comparing skills against job requirements can be inconsistent.
- Identifying missing qualifications requires repetitive manual effort.
- Ranking multiple candidates objectively is difficult.
- Recruitment performance and screening trends are not always easy to track.

**Proposed Solution:** HireLens AI provides a centralized platform that parses resumes, evaluates candidate profiles against job requirements, calculates matching scores, and presents structured screening results through an interactive dashboard.

---

## Key Features

### 1. Recruiter Dashboard

A centralized overview of recruitment activity.

- Recruitment overview and key statistics.
- Screening activity summaries.
- Candidate and job-related information.
- Navigation across all major application modules.

### 2. Job Openings Management

Manage job opportunities directly through the application.

- Create new job openings.
- Edit existing job details.
- Delete job openings.
- Search and filter available positions.
- Manage job status.
- Store job-opening information locally.

### 3. Resume Parsing and Upload

Upload candidate resumes for automated information extraction.

**Supported formats:**
- PDF
- DOCX

The backend processes uploaded documents and extracts relevant candidate information, including:

- Candidate name and contact information where available.
- Technical and professional skills.
- Educational qualifications.
- Employment and experience details.
- Relevant resume content.

### 4. Intelligent Candidate Screening

Evaluate resumes against a provided job description.

The screening workflow includes:

- Resume text extraction.
- Job-description analysis.
- Relevant skill identification.
- Skill matching and missing-skill identification.
- Experience analysis.
- Education analysis.
- Candidate matching-score calculation.

The platform generates structured results to help recruiters understand how closely a candidate's profile aligns with a job's requirements.

### 5. Candidate Ranking

Compare multiple candidates using their screening results.

- Calculate candidate matching percentages.
- Rank candidates based on screening scores.
- Identify stronger matches.
- Display matched and missing skills.
- Review candidate-specific screening information.

### 6. Candidate Comparison

Compare candidates side by side to support recruitment decisions.

- Compare candidate matching scores.
- Review skill alignment.
- Identify differences in candidate qualifications.
- Examine comparative screening information.
- View graphical and tabular comparisons.

### 7. Recruitment Analytics

Visualize recruitment activity and screening performance.

- Total screening sessions.
- Number of candidates screened.
- Average matching score.
- Strong-match statistics.
- Candidate score distribution.
- Commonly matched skills.
- Top-performing candidate rankings.

Analytics are generated from available screening history.

### 8. AI Copilot

An integrated recruitment assistant that helps interpret existing screening results.

It provides rule-based, context-aware responses using locally available screening history.

Examples of supported insights include:

- Identifying the highest-scoring candidate.
- Summarizing candidate matching results.
- Highlighting relevant skills.
- Answering questions about recorded screening activity.

**Implementation note:** The current Copilot uses application screening data and rule-based analysis. It does not currently connect to a live large language model or external generative AI API.

### 9. Recruiter Settings

A dedicated settings module for managing recruiter preferences.

- Edit recruiter profile information.
- Update recruiter name, email, role, and company.
- Configure notification preferences.
- Set the strong-match threshold.
- Save settings.
- Restore default settings.

Profile preferences are persisted using browser local storage.

### 10. Responsive User Interface

- Modern recruiter-focused dashboard.
- Organized sidebar navigation.
- Responsive layouts.
- Interactive data visualizations.
- Reusable React components.
- Separate application modules for easier maintenance.

---

## Application Workflow

The typical HireLens AI screening process follows these steps:

1. **Create a job opening:** Add a position and define its requirements.
2. **Upload resumes:** Select candidate resumes in PDF or DOCX format.
3. **Provide job requirements:** Enter or select the job description.
4. **Parse resumes:** The backend extracts relevant information from uploaded documents.
5. **Analyze candidates:** Extracted information is evaluated against the job requirements.
6. **Calculate matching scores:** The scoring service evaluates candidate-job alignment.
7. **Rank candidates:** Candidates are organized according to their screening scores.
8. **Review results:** Examine matched skills, missing skills, experience, and education.
9. **Compare candidates:** Use comparative tables and visualizations.
10. **Explore analytics:** Review recruitment statistics and screening history.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js |
| Frontend Build Tool | Vite |
| Styling | CSS, Tailwind CSS |
| Backend | Python, FastAPI |
| API Server | Uvicorn |
| Resume Processing | PyPDF, python-docx |
| File Upload | Python Multipart |
| HTTP Communication | Axios |
| Data Visualization | React-based charts and visualizations |
| Local Preferences | Browser Local Storage |
| Version Control | Git and GitHub |

### Frontend

The frontend provides the recruiter interface and manages user interactions.

- React.js for component-based development.
- Vite for development and production builds.
- CSS and Tailwind CSS for styling.
- Axios for communication with backend APIs.
- Browser local storage for locally persisted application preferences.

### Backend

The backend handles resume processing, candidate analysis, and ranking operations.

- FastAPI for REST API development.
- Uvicorn for running the backend server.
- PyPDF for extracting text from PDF documents.
- python-docx for processing DOCX documents.
- Python-based services for parsing and candidate scoring.

---

## System Architecture

HireLens AI follows a modular frontend-backend architecture.

```text
                 HIRELENS AI
                      |
          +-----------+-----------+
          |                       |
     FRONTEND                  BACKEND
    React + Vite              FastAPI
          |                       |
          |                  API Routes
          |                       |
          |          +------------+------------+
          |          |                         |
          |     Resume API                Ranking API
          |          |                         |
          |          v                         v
          |    Resume Service           Scoring Service
          |          |                         |
          |          v                         v
          |    Candidate Parser        Candidate Analysis
          |          |                         |
          +----------+-------------------------+
                      |
              Screening Results
                      |
          +-----------+-----------+
          |           |           |
       Ranking    Comparison   Analytics
```

### Backend Service Responsibilities

| Module | Responsibility |
|---|---|
| `main.py` | FastAPI application initialization, middleware, and router registration |
| `api/resume.py` | Resume upload endpoints |
| `api/ranking.py` | Candidate screening and ranking endpoints |
| `services/resume_service.py` | Resume-processing operations |
| `services/candidate_parser.py` | Extracting structured information from resumes |
| `services/scoring_service.py` | Candidate-job matching and scoring |
| `tests/test_scoring.py` | Automated scoring-service tests |

---

## Project Structure

```text
hirelens-ai/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── ranking.py
│   │   │   └── resume.py
│   │   │
│   │   ├── services/
│   │   │   ├── candidate_parser.py
│   │   │   ├── resume_service.py
│   │   │   └── scoring_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   │   └── test_scoring.py
│   │
│   ├── uploads/
│   │
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── Copilot.jsx
│   │   │   ├── JobOpenings.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Getting Started

Follow these instructions to run HireLens AI locally.

### Prerequisites

Install the following software before starting:

| Requirement | Version |
|---|---|
| Python | 3.12 or compatible |
| Node.js | 20 or compatible |
| npm | Compatible with installed Node.js |
| Git | Latest stable version |

Verify the installations:

```bash
python3 --version
node --version
npm --version
git --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/SaloniGupta6/hirelens-ai.git
```

Navigate into the project:

```bash
cd hirelens-ai
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python3 -m venv venv
```

Activate the environment on macOS/Linux:

```bash
source venv/bin/activate
```

On Windows:

```bash
venv\Scripts\activate
```

Upgrade pip:

```bash
python -m pip install --upgrade pip
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Frontend Setup

Open another terminal window and navigate to the frontend directory:

```bash
cd hirelens-ai/frontend
```

Install frontend dependencies:

```bash
npm install
```

---

## Environment Configuration

HireLens AI supports environment-based configuration for local development and deployment.

### Frontend Configuration

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The frontend uses this variable to communicate with the backend API.

### Backend Configuration

The backend supports a `FRONTEND_URL` environment variable for configuring allowed frontend origins.

For local development, the application already includes:

```text
http://localhost:5173
http://127.0.0.1:5173
```

For deployment, configure:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

Multiple frontend origins can be separated by commas.

**Important:** Never commit real API keys, passwords, private credentials, or production secrets to GitHub.

---

## Running the Application

HireLens AI requires the frontend and backend servers to run separately.

### Start the Backend

From the `backend` directory, with the virtual environment activated:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

The Vite development server will normally be available at:

```text
http://localhost:5173
```

Open the frontend URL in your browser to access HireLens AI.

---

## API Endpoints

The backend exposes REST API endpoints for resume processing and candidate screening.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Backend health check |
| `/api/resumes/upload` | POST | Upload resume documents |
| `/api/ranking/rank` | POST | Process candidate-ranking requests |
| `/api/ranking/rank-uploaded` | POST | Rank candidates using uploaded resumes |

The exact request and response schemas are available through FastAPI's interactive documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

This interface can be used to inspect endpoint parameters, submit test requests, and review API responses.

---

## Testing

HireLens AI includes automated tests for the backend candidate-scoring functionality.

### Run Backend Tests

From the backend directory, activate the virtual environment and execute:

```bash
python -m unittest tests/test_scoring.py -v
```

The tests cover scoring-related functionality, including experience-duration parsing and date handling.

### Build the Frontend

From the frontend directory:

```bash
npm run build
```

This generates the optimized production build inside:

```text
frontend/dist/
```

---

## Deployment

The recommended deployment architecture separates the frontend and backend.

| Component | Hosting Platform |
|---|---|
| React Frontend | Vercel |
| FastAPI Backend | Render |
| Source Code | GitHub |

### Backend Deployment — Render

1. Push the project to GitHub.
2. Create a new Web Service in Render.
3. Connect the HireLens AI GitHub repository.
4. Set the root directory to:

```text
backend
```

5. Configure the build command:

```bash
pip install -r requirements.txt
```

6. Configure the start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

7. Add the environment variable:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

8. Deploy the backend and copy its public service URL.

### Frontend Deployment — Vercel

1. Create a new Vercel project.
2. Import the HireLens AI GitHub repository.
3. Set the root directory to:

```text
frontend
```

4. Select Vite as the framework preset.
5. Configure the build command:

```bash
npm run build
```

6. Set the output directory:

```text
dist
```

7. Add the environment variable:

```env
VITE_API_URL=https://your-backend-service.onrender.com
```

8. Deploy the frontend.

After deployment, verify that the frontend can communicate with the backend and that the backend's `FRONTEND_URL` matches the deployed frontend origin.

---

## Data Storage and Limitations

The current version is designed as a functional project and demonstration platform.

- Recruiter profile preferences and settings are stored in browser local storage.
- Job-opening information is stored locally in the browser.
- Resume uploads are handled by the backend.
- Screening history and analytics depend on the application's available screening data.
- The current Copilot uses rule-based analysis rather than a live LLM integration.
- The application does not currently provide a full persistent production database or a dedicated cloud document-storage service.

**Deployment consideration:** Files stored on a hosting provider's temporary filesystem may be lost when the service restarts or is redeployed. A persistent disk or external object-storage solution should be configured before relying on uploaded resumes in production.

**Security and responsible hiring:** Candidate matching scores are intended to assist recruiters, not make final employment decisions. Resume parsing and automated scoring can be imperfect. Recruiters should review original documents, validate extracted information, and independently assess candidates.

---

## Future Enhancements

Potential improvements for future versions include:

- Integration with large language models for advanced resume understanding.
- Semantic matching between resumes and job descriptions.
- Persistent database integration using PostgreSQL.
- Secure recruiter authentication and role-based access control.
- Cloud-based resume storage.
- Advanced filtering and candidate search.
- Exportable candidate reports in PDF and Excel formats.
- Email notifications and recruitment workflow automation.
- Advanced analytics and recruitment performance tracking.
- Improved accessibility and multilingual support.
- Bias monitoring and explainable candidate-scoring mechanisms.

---



## License

This project is currently available as a public GitHub repository. No separate open-source license has been added yet. All rights remain with the author unless a license is subsequently included.

---

**HireLens AI — Making Resume Screening More Structured, Efficient, and Insightful.**
