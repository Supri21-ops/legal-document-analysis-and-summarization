import os

def extract_text_from_pdf(file_path: str) -> str:
    try:
        import fitz
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        if len(text.strip()) < 50:
            return extract_text_with_ocr_pdf(file_path)
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {str(e)}")

def extract_text_with_ocr_pdf(file_path: str) -> str:
    try:
        import fitz, pytesseract
        from PIL import Image
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text += pytesseract.image_to_string(img) + "\n"
        doc.close()
        return text
    except Exception as e:
        return f"OCR failed: {str(e)}"

def extract_text_from_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += " " + cell.text
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract DOCX text: {str(e)}")

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
