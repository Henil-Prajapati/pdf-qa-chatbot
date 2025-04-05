import os
import argparse
from pdf_processor import PDFProcessor
from vector_store import VectorStore
from qa_system import QuestionAnsweringSystem

def main():
    parser = argparse.ArgumentParser(description="PDF Question Answering System")
    parser.add_argument("--pdf", type=str, help="Path to the PDF file")
    parser.add_argument("--question", type=str, help="Question to ask")
    parser.add_argument("--api", action="store_true", help="Start the API server")
    
    args = parser.parse_args()
    
    if args.api:
        import uvicorn
        print("Starting API server at http://localhost:8000")
        uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
        return
    
    if not args.pdf:
        print("Please provide a PDF file path using --pdf")
        return
    
    pdf_processor = PDFProcessor()
    vector_store = VectorStore()
    documents = pdf_processor.process_pdf(args.pdf)
    vector_store.create_vector_store(documents)
    vector_store.save_vector_store()
    qa_system = QuestionAnsweringSystem(vector_store)
    
    print(f"I've processed {args.pdf}. Ask me anything about this document!")
    if args.question:
        result = qa_system.answer_question(args.question)
        print(f"Answer: {result['answer']}")
        print("Sources:")
        for i, source in enumerate(result['sources'], 1):
            print(f"{i}. Page {source['page']}: {source['text']}")
    else:
        while True:
            question = input("Question: ")
            if question.lower() == "exit":
                break
            try:
                result = qa_system.answer_question(question)
                print(f"Answer: {result['answer']}")
                print("Sources:")
                for i, source in enumerate(result['sources'], 1):
                    print(f"{i}. Page {source['page']}: {source['text']}")
            except Exception as e:
                print(f"Sorry, I encountered an error: {str(e)}")

if __name__ == "__main__":
    main()