
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.resume_service import (
    save_resume,
    extract_resume_text,
    extract_left_column_text,
    extract_right_column_text,
    UPLOAD_DIR,
)

from app.services.candidate_parser import (
    parse_resume,
    extract_education,
    extract_experience,
)

router = APIRouter(
    prefix="/api/resumes",
    tags=["Resume Management"],
)


@router.post("/upload")
async def upload_resumes(files: list[UploadFile] = File(...)):
    """
    Upload multiple resumes and extract structured candidate information.
    Supports PDF and DOCX formats.
    """

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one resume.",
        )

    results = []

    for file in files:
        try:
            result = await save_resume(file)

            if result["success"]:
                file_path = UPLOAD_DIR / result["stored_filename"]

                try:
                    # ------------------------------------------
                    # 1. Extract general resume text
                    # ------------------------------------------
                    extracted_text = extract_resume_text(str(file_path))

                    result["extracted_text"] = extracted_text
                    result["extracted_characters"] = len(extracted_text)

                    result["extraction_status"] = (
                        "completed" if extracted_text else "no_text_found"
                    )

                    # ------------------------------------------
                    # 2. General candidate information
                    # ------------------------------------------
                    parsed_result = parse_resume(extracted_text)

                    result["candidate_name"] = parsed_result.get(
                        "candidate_name"
                    )

                    result["contact_details"] = parsed_result.get(
                        "contact_details", {}
                    )

                    result["skills"] = parsed_result.get("skills", [])

                    result["total_skills_found"] = parsed_result.get(
                        "total_skills_found", 0
                    )

                    # ------------------------------------------
                    # 3. Education extraction
                    # ------------------------------------------
                    if file_path.suffix.lower() == ".pdf":
                        education_source_text = extract_left_column_text(
                            str(file_path)
                        )
                    else:
                        education_source_text = extracted_text

                    education = extract_education(
                        education_source_text
                    )

                    result["education"] = education
                    result["education_found"] = bool(education)

                    # ------------------------------------------
                    # 4. Experience extraction
                    # ------------------------------------------
                    if file_path.suffix.lower() == ".pdf":
                        experience_source_text = extract_right_column_text(
                            str(file_path)
                        )
                    else:
                        experience_source_text = extracted_text

                    experience_result = extract_experience(
                        experience_source_text
                    )

                    result["experience"] = experience_result["experience"]

                    result["experience_found"] = experience_result[
                        "experience_found"
                    ]

                    # ------------------------------------------
                    # 5. Structured extraction status
                    # ------------------------------------------
                    result["parsing_status"] = "completed"

                except ValueError as error:
                    result["extraction_status"] = "failed"
                    result["parsing_status"] = "failed"
                    result["extraction_message"] = str(error)

            results.append({
                "filename": file.filename,
                **result,
            })

        except ValueError as error:
            results.append({
                "filename": file.filename,
                "success": False,
                "message": str(error),
            })

    successful = sum(
        1 for item in results if item.get("success")
    )

    failed = len(results) - successful

    return {
        "message": "Resume upload and parsing completed.",
        "total_files": len(files),
        "successful_uploads": successful,
        "failed_uploads": failed,
        "results": results,
    }
