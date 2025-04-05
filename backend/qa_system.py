import google.generativeai as genai
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_core.runnables import Runnable
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiLLM(Runnable):
    def __init__(self, model):
        self.model = model
    
    def invoke(self, input, config=None, **kwargs):
        # Handle LangChain's tuple input: ('text', <prompt>)
        if isinstance(input, tuple) and len(input) == 2 and input[0] == 'text':
            prompt = input[1]  # Extract the prompt string
        else:
            prompt = str(input)  # Fallback to string conversion
        
        # Pass the plain string to Gemini
        response = self.model.generate_content(prompt)
        return response.text
    
    def _invoke(self, input, config=None, **kwargs):
        return self.invoke(input, config, **kwargs)

class QuestionAnsweringSystem:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        
        # Hardcode Gemini API key (replace with your actual key)
        api_key = "AIzaSyDf-9GZETsQjjPKJz3Jkvw6SPV6FWSjmws"  # Replace this!
        genai.configure(api_key=api_key)
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel("gemini-1.5-pro")  # or "gemini-1.5-flash"
        self.qa_chain = self._create_qa_chain()
    
    def _create_qa_chain(self):
        prompt_template = """
        You are an expert assistant tasked with providing detailed, engaging, and essay-like responses based on a document. Your goal is to answer the question thoroughly, using the retrieved context to craft a comprehensive explanation. Begin with an introduction that frames the question and its relevance to the document. Then, elaborate on the answer with specific details, examples, or insights from the context, ensuring the response is directly tied to the document's content. Conclude with a summary that reinforces the key points. Aim for a response that is at least 200 words, written in a conversational yet informative tone.

        Question: {question}

        Context:
        {context}

        Answer (in detailed essay format):
        """
        qa_prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["question", "context"]
        )
        
        gemini_llm = GeminiLLM(self.model)
        
        retriever = self.vector_store.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4}
        )
        
        return RetrievalQA.from_chain_type(
            llm=gemini_llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": qa_prompt}
        )
    
    def answer_question(self, question):
        logger.info(f"Processing question: {question}")
        try:
            result = self.qa_chain.invoke({"query": question})
            answer = result.get("result", "No answer generated")
            source_documents = result.get("source_documents", [])
            
            sources = []
            for doc in source_documents:
                source_info = {
                    "page": doc.metadata.get("page", "Unknown"),
                    "text": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
                }
                sources.append(source_info)
            
            return {
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Error in answer_question: {str(e)}", exc_info=True)
            raise Exception(f"Failed to get answer: {str(e)}")