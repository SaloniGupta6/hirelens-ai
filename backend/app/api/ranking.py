from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.scoring_service import rank_candidates
from app.services.resume_service import (
    UPLOAD_DIR,
    extract_resume_text,
    extract_left_column_text,
    extract_right_column_text,
)
from app.services.candidate_parser import (
    parse_resume,
    extract_education,
    extract_experience,
)

router = APIRouter(
    prefix="/api/ranking",
    tags=["Candidate Ranking"]
)


class RankingRequest(BaseModel):
    job_description: str = Field(..., min_length=20)
    candidates: list[dict[str, Any]] = Field(..., min_length=1)


class UploadedRankingRequest(BaseModel):
    job_description: str = Field(..., min_length=20)
    filenames: list[str] | None = None


@router.post("/rank")
def rank_resumes(request: RankingRequest):
    try:
        results = rank_candidates(
            request.job_description,
            request.candidates
        )
        return {
            "success": True,
            "total_candidates": len(results),
            "ranked_candidates": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rank-uploaded")
def rank_uploaded_resumes(request: UploadedRankingRequest):
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        if request.filenames:
            selected_files = []
            for filename in request.filenames:
                if Path(filename).name != filename:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid filename: {filename}"
                    )

                file_path = UPLOAD_DIR / filename

                if not file_path.is_file() or file_path.suffix.lower() not in [".pdf", ".docx"]:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Uploaded resume not found: {filename}"
                    )

                selected_files.append(file_path)
        else:
            selected_files = sorted(
                [
                    path for path in UPLOAD_DIR.iterdir()
                    if path.is_file()
                    and path.suffix.lower() in [".pdf", ".docx"]
                ],
                key=lambda path: path.name
            )

        if not selected_files:
            raise HTTPException(
                status_code=404,
                detail="No uploaded PDF or DOCX resumes found."
            )

        candidates = []
        failed_files = []

        for file_path in selected_files:
            try:
                text = extract_resume_text(str(file_path))

                if not text.strip():
                    failed_files.append({
                        "filename": file_path.name,
                        "reason": "No readable text found."
                    })
                    continue

                parsed = parse_resume(text)

                education_text = (
                    extract_left_column_text(str(file_path))
                    if file_path.suffix.lower() == ".pdf"
                    else text
                )

                experience_text = (
                    extract_right_column_text(str(file_path))
                    if file_path.suffix.lower() == ".pdf"
                    else text
                )

                education = extract_education(education_text)
                experience = extract_experience(experience_text)

                candidates.append({
                    "candidate_name": parsed.get(
                        "candidate_name", "Unknown Candidate"
                    ),
                    "filename": file_path.name,
                    "original_filename": file_path.name,
                    "skills": parsed.get("skills", []),
                    "education": education,
                    "experience": experience.get("experience", [])
                })

            except Exception as error:
                failed_files.append({
                    "filename": file_path.name,
                    "reason": str(error)
                })

        if not candidates:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "No resumes could be parsed.",
                    "failed_files": failed_files
                }
            )

        results = rank_candidates(
            request.job_description,
            candidates
        )

        return {
            "success": True,
            "total_files": len(selected_files),
            "successfully_parsed": len(candidates),
            "failed_files": failed_files,
            "ranked_candidates": results
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume ranking failed: {str(error)}"
        )
