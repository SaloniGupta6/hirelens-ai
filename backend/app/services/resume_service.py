
import hashlib
import os
import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document


# --------------------------------------------------
# PROJECT CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 1024 * 1024  # 1 MB


# --------------------------------------------------
# PDF COORDINATE HELPER
# --------------------------------------------------

def matrix_multiply(m1, m2):
    """Combine PDF text and transformation matrices."""
    return [
        m1[0] * m2[0] + m1[1] * m2[2],
        m1[0] * m2[1] + m1[1] * m2[3],
        m1[2] * m2[0] + m1[3] * m2[2],
        m1[2] * m2[1] + m1[3] * m2[3],
        m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
        m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
    ]


# --------------------------------------------------
# SAVE AND VALIDATE RESUME
# --------------------------------------------------

async def save_resume(upload_file: UploadFile):
    """Validate and securely save a candidate resume."""

    original_filename = Path(
        upload_file.filename or ""
    ).name

    if not original_filename:
        raise ValueError("Filename is missing.")

    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Unsupported file format. Only PDF and DOCX are allowed."
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    temp_path = UPLOAD_DIR / f".{uuid4().hex}.tmp"

    file_hash = hashlib.sha256()
    file_size = 0
    file_signature = b""

    try:
        with open(temp_path, "wb") as destination:

            while True:
                chunk = await upload_file.read(CHUNK_SIZE)

                if not chunk:
                    break

                if not file_signature:
                    file_signature = chunk[:8]

                file_size += len(chunk)

                if file_size > MAX_FILE_SIZE:
                    raise ValueError(
                        "File exceeds the maximum allowed size of 10 MB."
                    )

                file_hash.update(chunk)
                destination.write(chunk)

        if file_size == 0:
            raise ValueError("Uploaded file is empty.")

        if extension == ".pdf":
            if not file_signature.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF file.")

        elif extension == ".docx":
            if not file_signature.startswith(b"PK"):
                raise ValueError("Invalid DOCX file.")

        content_hash = file_hash.hexdigest()
        stored_filename = f"{content_hash}{extension}"
        final_path = UPLOAD_DIR / stored_filename

        if final_path.exists():
            temp_path.unlink(missing_ok=True)

            return {
                "success": True,
                "message": "Duplicate resume detected.",
                "duplicate": True,
                "original_filename": original_filename,
                "stored_filename": stored_filename,
                "file_hash": content_hash,
                "file_size": file_size,
            }

        os.replace(temp_path, final_path)

        return {
            "success": True,
            "message": "Resume uploaded successfully.",
            "duplicate": False,
            "original_filename": original_filename,
            "stored_filename": stored_filename,
            "file_hash": content_hash,
            "file_size": file_size,
        }

    except Exception:
        temp_path.unlink(missing_ok=True)
        raise

    finally:
        await upload_file.close()


# --------------------------------------------------
# GENERAL PDF TEXT EXTRACTION
# --------------------------------------------------

def extract_resume_text(file_path: str) -> str:
    file_extension = Path(file_path).suffix.lower()

    try:
        if file_extension == ".pdf":
            reader = PdfReader(file_path)
            extracted_text = []

            for page in reader.pages:
                # First attempt: layout-preserving extraction
                page_text = page.extract_text(extraction_mode="layout")

                # Fallback: standard extraction if layout is empty
                if not page_text or not page_text.strip():
                    page_text = page.extract_text()

                if page_text and page_text.strip():
                    extracted_text.append(page_text)

            return "\n".join(extracted_text).strip()

        elif file_extension == ".docx":
            document = Document(file_path)

            extracted_text = [
                paragraph.text
                for paragraph in document.paragraphs
                if paragraph.text.strip()
            ]

            return "\n".join(extracted_text).strip()

        else:
            raise ValueError("Unsupported file format.")

    except Exception as error:
        raise ValueError(f"Could not extract resume text: {str(error)}")


# --------------------------------------------------
# COLUMN-AWARE PDF EXTRACTION
# --------------------------------------------------

def extract_pdf_column_text(
    file_path: str,
    column: str = "left"
) -> str:
    """
    Extract text from a selected PDF column using actual text coordinates.

    Supports left and right column extraction across all PDF pages.
    """

    if column not in {"left", "right"}:
        raise ValueError("Column must be 'left' or 'right'.")

    reader = PdfReader(file_path)
    extracted_pages = []

    for page in reader.pages:
        page_width = float(page.mediabox.width)

        # Verified boundary for the provided resume layout.
        x_threshold = page_width * 0.40

        fragments = []

        def visitor_text(text, cm, tm, font_dict, font_size):
            if not text or not text.strip():
                return

            position = matrix_multiply(tm, cm)
            x = position[4]
            y = position[5]

            if column == "left" and x < x_threshold:
                fragments.append((y, x, text, font_size))

            elif column == "right" and x >= x_threshold:
                fragments.append((y, x, text, font_size))

        page.extract_text(visitor_text=visitor_text)

        # Group fragments belonging to the same visual line.
        fragments.sort(key=lambda item: (-item[0], item[1]))

        lines = []

        for y, x, text, font_size in fragments:
            matched_line = None

            for line in lines:
                if abs(line["y"] - y) <= 2.5:
                    matched_line = line
                    break

            if matched_line is None:
                lines.append({
                    "y": y,
                    "fragments": [(x, text, font_size)]
                })
            else:
                matched_line["fragments"].append(
                    (x, text, font_size)
                )

        lines.sort(key=lambda line: -line["y"])

        page_lines = []

        for line in lines:
            line_fragments = sorted(
                line["fragments"],
                key=lambda item: item[0]
            )

            reconstructed = ""

            for index, (x, text, font_size) in enumerate(line_fragments):
                text = text.strip()

                if not text:
                    continue

                if not reconstructed:
                    reconstructed = text
                    continue

                previous_x, previous_text, previous_font_size = (
                    line_fragments[index - 1]
                )

                # Merge split single-letter word fragments such as:
                # "T" + "roubleshot" -> "Troubleshot"
                is_split_word = (
                    len(previous_text.strip()) == 1
                    and previous_text.strip().isalpha()
                    and previous_text.strip().isupper()
                    and text[:1].islower()
                    and (x - previous_x) <= 10
                )

                if is_split_word:
                    reconstructed += text
                else:
                    reconstructed += " " + text

            reconstructed = re.sub(
                r"\s+",
                " ",
                reconstructed
            ).strip()

            if reconstructed:
                page_lines.append(reconstructed)

        extracted_pages.append("\n".join(page_lines))

    return "\n".join(extracted_pages).strip()


# --------------------------------------------------
# LEFT COLUMN
# --------------------------------------------------

def extract_left_column_text(file_path: str) -> str:
    """Extract the left column from a PDF resume."""
    return extract_pdf_column_text(
        file_path,
        column="left"
    )


# --------------------------------------------------
# RIGHT COLUMN
# --------------------------------------------------

def extract_right_column_text(file_path: str)    -> str:
    """Extract the right column from a PDF resume."""
    return extract_pdf_column_text(
        file_path,
        column="right"
    )
