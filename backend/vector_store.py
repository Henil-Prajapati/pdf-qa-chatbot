from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import os

class VectorStore:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.vector_store = None
    
    def create_vector_store(self, documents):
        self.vector_store = FAISS.from_documents(documents, self.embeddings)
        return self.vector_store
    
    def save_vector_store(self, path="faiss_index"):
        if self.vector_store is None:
            raise ValueError("Vector store has not been created yet")
        os.makedirs(path, exist_ok=True)
        self.vector_store.save_local(path)
        print(f"Vector store saved to {path}")
    
    def load_vector_store(self, path="faiss_index"):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Vector store not found at {path}")
        self.vector_store = FAISS.load_local(path, self.embeddings, allow_dangerous_deserialization=True)  # Updated for newer FAISS
        print(f"Vector store loaded from {path}")
        return self.vector_store