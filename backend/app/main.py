
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.resume import router as resume_router
from app.api.ranking import router as ranking_router
from fastapi.openapi.utils import get_openapi
app = FastAPI(
    title="HireLens AI",
    description="AI-Based Resume Screening and Candidate Ranking System",
    version="1.0.0"
)
app.include_router(resume_router)
app.include_router(ranking_router)

# Allow communication with React frontend
frontend_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

configured_frontend = os.getenv("FRONTEND_URL", "")
frontend_origins.extend(
    origin.strip().rstrip("/")
    for origin in configured_frontend.split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to HireLens AI",
        "status": "Backend is running successfully",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "HireLens AI",
        "services": {
            "api": "running",
            "resume_parser": "under development",
            "ai_engine": "under development",
            "candidate_ranking": "under development"
        }
    }


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Use OpenAPI 3.0 binary file representation
    openapi_schema["openapi"] = "3.0.3"

    # Locate the resume upload request schema
    upload_request = (
        openapi_schema["paths"]
        ["/api/resumes/upload"]
        ["post"]
        ["requestBody"]
        ["content"]
        ["multipart/form-data"]
        ["schema"]
    )

    schema_name = upload_request["$ref"].split("/")[-1]

    # Change the file field to binary format
    openapi_schema["components"]["schemas"][schema_name][
        "properties"
    ]["files"]["items"] = {
        "type": "string",
        "format": "binary"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

