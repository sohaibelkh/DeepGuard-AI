"""
Chatbot Route
================
Provides an interface to interact with the LLM (Groq) using RAG (ChromaDB)
based on the DeepGuard-AI platform knowledge base documentation.
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
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

# ── RAG Setup ───────────────────────────────────────────────────────────

# Lazy-initialized to avoid downloading the model on every startup
_embeddingModel = None

def get_embedding_model():
    global _embeddingModel
    if _embeddingModel is None:
        _embeddingModel = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddingModel

# Global variable to store vector DB instance
_db_vector = None

def get_vector_db():
    global _db_vector
    if _db_vector is None:
        db_dir = Path(settings.VECTOR_DB_DIR)
        knowledge_base_path = Path("data/deepguard_chatbot_knowledge.md")
        print(f"Initializing Vector DB at {db_dir}...")

        # Always rebuild if knowledge base exists and DB is missing or empty
        should_build = not db_dir.exists()

        if should_build:
            if not knowledge_base_path.exists():
                print(f"Warning: Knowledge base not found at {knowledge_base_path}. Creating empty DB.")
                os.makedirs(db_dir, exist_ok=True)
                _db_vector = Chroma(persist_directory=str(db_dir), embedding_function=get_embedding_model())
                return _db_vector

            print(f"Loading DeepGuard knowledge base from {knowledge_base_path}...")
            # Load as plain text (markdown)
            loader = TextLoader(str(knowledge_base_path), encoding="utf-8")
            docs = loader.load()

            print(f"Splitting {len(docs)} documents into chunks...")
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n## ", "\n### ", "\n#### ", "\n", " "]
            )
            chunks = text_splitter.split_documents(docs)

            print(f"Embedding {len(chunks)} chunks into vector DB...")
            _db_vector = Chroma.from_documents(
                documents=chunks,
                embedding=get_embedding_model(),
                persist_directory=str(db_dir)
            )
            print("Vector DB created successfully from DeepGuard knowledge base.")
        else:
            print("Loading existing Vector DB...")
            _db_vector = Chroma(persist_directory=str(db_dir), embedding_function=get_embedding_model())
            
    return _db_vector

# Lazy-initialized to avoid crashing on startup when GROQ_API_KEY is not set
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        if not settings.GROQ_API_KEY:
            raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured. Set it in backend/.env")
        _llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL
        )
    return _llm

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
        
        response = get_llm().invoke(prompt)
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
