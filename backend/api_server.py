import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pdf_processor import PDFProcessor
from vector_store import VectorStore
from qa_system import QuestionAnsweringSystem

app = FastAPI(title="PDF Question Answering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_processor = PDFProcessor()
vector_store = VectorStore()
qa_system = None
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QuestionRequest(BaseModel):
    question: str

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global qa_system, vector_store
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        logger.info(f"Processing PDF: {file_path}")
        documents = pdf_processor.process_pdf(file_path)
        vector_store.create_vector_store(documents)
        vector_store.save_vector_store()
        qa_system = QuestionAnsweringSystem(vector_store)
        logger.info("PDF processing completed successfully")
        return {"message": "PDF processed successfully", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error in upload_pdf: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/ask/")
async def ask_question(request: QuestionRequest):
    global qa_system
    if qa_system is None:
        raise HTTPException(status_code=400, detail="Please upload a PDF first")
    
    try:
        result = qa_system.answer_question(request.question)
        return result
    except Exception as e:
        logger.error(f"Error in ask_question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

@app.get("/health/")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)