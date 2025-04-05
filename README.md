## 📚 PDF QA Chatbot
# A robust Python-based PDF Question-Answering Chatbot that processes PDF documents and delivers intelligent, context-aware responses using the Google Gemini API, LangChain, and FAISS. 🚀

## 🌟 Overview
This project is a backend-focused AI-powered chatbot designed to extract text from PDF files, convert it into searchable embeddings, and answer natural language questions with detailed responses. Perfect for developers and researchers needing an efficient way to interact with PDF content! 📖

## ✨ Features
Upload and process PDF documents seamlessly. 📤
Ask natural language questions and receive detailed, source-cited answers. ❓
Real-time interaction via a simple web interface. 💬
Efficient storage and retrieval of document embeddings using FAISS. 🗂️

## 💻 Technologies Used
# Backend:
  Python
  LangChain (for QA pipeline)
  FAISS (for vector storage)
  SentenceTransformers (for text embeddings)
  PyPDF2 (for PDF parsing)
  Uvicorn (for API server)
# AI Model: 
  Google Gemini API (via google-generative-ai)
# Frontend: 
  Basic HTML, CSS, JavaScript

## ✅ Prerequisites
  Python 3.9+: Verify with python --version or python3 --version. 🐍
  Git (optional): If cloning the repository, ensure Git is installed (git --version). 🌐
  Internet Connection: Required to install packages and access the Gemini API. 📡
  Google Gemini API Key: Obtain from Google AI Studio. 🔑

## 🚀 Installation & Running
# 1. Configure the Gemini API Key
Open backend/qa_system.py and replace the placeholder:
# api_key = "your-actual-gemini-api-key-here"  # Replace with your key

# 2. Run the Backend
  cd backend
  python main.py --api

# 3. Run the Frontend
  cd frontend
  python -m http.server 3000

# 4. Access the Application
  #Open http://localhost:3000 in your browser to use the chat interface. 🌐
