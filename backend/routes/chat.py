"""
Chatbot Route
================
Provides an interface to interact with the LLM (Groq) using RAG (ChromaDB)
based on the CardioAI platform knowledge base documentation.
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
    language: str = "auto"  # "en" | "fr" | "ar" | "auto"

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
        knowledge_base_path = Path("data/cardioai_chatbot_knowledge.md")
        print(f"Initializing Vector DB at {db_dir}...")

        # Always rebuild if knowledge base exists and DB is missing or empty
        should_build = not db_dir.exists()

        if should_build:
            if not knowledge_base_path.exists():
                print(f"Warning: Knowledge base not found at {knowledge_base_path}. Creating empty DB.")
                os.makedirs(db_dir, exist_ok=True)
                _db_vector = Chroma(persist_directory=str(db_dir), embedding_function=get_embedding_model())
                return _db_vector

            print(f"Loading CardioAI knowledge base from {knowledge_base_path}...")
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
            print("Vector DB created successfully from CardioAI knowledge base.")
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
    language = request.language.strip().lower() if request.language else "auto"
    if not question:
        raise HTTPException(status_code=400, detail="Please enter a question.")
    
    # Build language instruction
    lang_map = {
        "en": "You MUST respond in English only, regardless of the language of the context.",
        "fr": "Tu DOIS répondre en français uniquement, quelle que soit la langue du contexte.",
        "ar": "يجب أن تجيب باللغة العربية فقط، بغض النظر عن لغة السياق. استخدم اتجاه النص من اليمين لليسار.",
        "auto": "Detect the language of the user's question and respond in THAT SAME language. If the question is in French, respond in French. If in Arabic, respond in Arabic. If in English, respond in English.",
    }
    language_instruction = lang_map.get(language, lang_map["auto"])
    
    try:
        db = get_vector_db()
        
        # Search for relevant context from DeepGuard knowledge base
        docs = db.similarity_search(question, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Multilingual prompt
        prompt = (
            f"You are CardioAI Assistant, a specialized medical AI assistant for the CardioAI cardiac ECG analysis platform.\n"
            f"Your role is to help users understand their ECG results, cardiac conditions, and how to use the platform.\n\n"
            f"LANGUAGE RULE: {language_instruction}\n\n"
            f"Use the following context from the CardioAI platform knowledge base to answer the question:\n"
            f"---\n{context}\n---\n\n"
            f"User question: {question}\n\n"
            f"Instructions:\n"
            f"- Answer based on the context provided above.\n"
            f"- If the answer is not in the context, say so politely and suggest consulting a cardiologist.\n"
            f"- Never provide a final medical diagnosis. Always recommend professional consultation for serious conditions.\n"
            f"- Be concise, clear, and professional."
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
