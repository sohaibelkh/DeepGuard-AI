"""
Chatbot Route
================
Provides an interface to interact with the LLM (Groq) using RAG (ChromaDB)
based on a PDF guide for business creation.
"""

from __future__ import annotations

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from config import settings
from auth import get_current_user
from models.user import User

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

# ── RAG Setup ───────────────────────────────────────────────────────────

# Switching to local HuggingFace embeddings to avoid Ollama dependency
embeddingModel = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

# Global variable to store vector DB instance
_db_vector = None

def get_vector_db():
    global _db_vector
    if _db_vector is None:
        db_dir = Path(settings.VECTOR_DB_DIR)
        print(f"Initializing Vector DB at {db_dir}...")
        
        # If DB doesn't exist, create it from the PDF
        if not db_dir.exists():
            pdf_path = Path("data/Bpifrance Creation_GUIDE PRATIQUE DU CREATEUR_2019.pdf")
            if not pdf_path.exists():
                print(f"Warning: PDF not found at {pdf_path}. Creating empty DB.")
                os.makedirs(db_dir, exist_ok=True)
                _db_vector = Chroma(persist_directory=str(db_dir), embedding_function=embeddingModel)
                return _db_vector
            
            print(f"Loading PDF from {pdf_path}...")
            loader = PyPDFLoader(str(pdf_path))
            docs = loader.load()
            
            print(f"Splitting {len(docs)} pages...")
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_documents(docs)
            
            print(f"Embedding {len(chunks)} chunks (this may take a while)...")
            _db_vector = Chroma.from_documents(
                documents=chunks,
                embedding=embeddingModel,
                persist_directory=str(db_dir)
            )
            print("Vector DB created successfully.")
        else:
            print("Loading existing Vector DB...")
            _db_vector = Chroma(persist_directory=str(db_dir), embedding_function=embeddingModel)
            
    return _db_vector

llm = ChatGroq(
    groq_api_key=settings.GROQ_API_KEY,
    model_name=settings.GROQ_MODEL
)

# ── Endpoints ───────────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, user: User = Depends(get_current_user)):
    """Interact with the chatbot."""
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Veuillez entrer une question.")
    
    try:
        db = get_vector_db()
        
        # Search for relevant context
        docs = db.similarity_search(question, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Prompt construction
        prompt = (
            f"Repondez à cette question : {question}\n\n"
            f"En se basant sur le contexte suivant issu du guide de création d'entreprise :\n"
            f"{context}\n\n"
            f"Si la réponse n'est pas dans le contexte, dites-le poliment."
        )
        
        response = llm.invoke(prompt)
        return ChatResponse(answer=response.content)
        
    except Exception as e:
        # Detailed and user-friendly error handling
        error_msg = str(e)
        print(f"Chatbot Error: {error_msg}")
        
        if "invalid_api_key" in error_msg.lower() or "401" in error_msg:
            return ChatResponse(answer=(
                "Erreur d'authentification : Votre clé API Groq est invalide أو انتهت صلاحيتها.\n\n"
                "Pour corriger cela :\n"
                "1. Obtenez une nouvelle clé sur https://console.groq.com\n"
                "2. Mettez-la à jour dans le fichier backend/config.py (ligne 51) أو في ملف .env"
            ))
            
        return ChatResponse(answer=f"Désolé, une erreur est survenue lors de la génération de la réponse. Erreur : {error_msg}")
