"""
resume_parser.py — PDF Text Extraction
Uses PyPDF2 with fallback handling for encrypted or complex PDFs.
"""

import PyPDF2
import io


def extract_text(file) -> str:
    """
    Extract all text from a PDF file object (Streamlit UploadedFile or file path).
    Handles multi-page PDFs and gracefully skips unreadable pages.
    Returns concatenated text string.
    """
    try:
        # Streamlit file objects need to be read as bytes
        if hasattr(file, "read"):
            content = file.read()
            file.seek(0)  # Reset pointer for potential re-use
            reader = PyPDF2.PdfReader(io.BytesIO(content))
        else:
            reader = PyPDF2.PdfReader(file)

        # Handle encrypted PDFs
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                return ""  # Can't read encrypted PDF without password

        text_parts = []
        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(page_text)
            except Exception:
                continue  # Skip unreadable pages

        return "\n".join(text_parts).strip()

    except Exception as e:
        return f"[Error reading PDF: {str(e)}]"


def get_page_count(file) -> int:
    """Return number of pages in a PDF."""
    try:
        if hasattr(file, "read"):
            content = file.read()
            file.seek(0)
            reader = PyPDF2.PdfReader(io.BytesIO(content))
        else:
            reader = PyPDF2.PdfReader(file)
        return len(reader.pages)
    except Exception:
        return 0
