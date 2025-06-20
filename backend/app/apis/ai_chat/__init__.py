from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from typing import List

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

# --- Pydantic Models ---
class ChatMessageInput(BaseModel):
    role: str # "user" or "assistant"
    content: str

class AiChatRequest(BaseModel):
    message: str
    history: List[ChatMessageInput] # To maintain conversation context
    outfit_stage_index: int | None = None # 0-5, influences personality
    # dealer_id: str | None = None # For fetching dealer personality later
    # game_state: dict | None = None # For game context later

class AiChatResponse(BaseModel):
    reply: str

# --- OpenAI Client ---
def get_openai_client():
    """Get OpenAI client with API key from environment"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    return OpenAI(api_key=api_key)

# --- Routes ---

@router.post("/send-message", response_model=AiChatResponse)
async def send_chat_message(
    message: str,
    history: List[ChatMessageInput],
    outfit_stage_index: int = None
):
    """Send a chat message to AI and get response"""
    try:
        client = get_openai_client()
        
        # Build messages for OpenAI
        messages = []
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Get AI response
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content
        return AiChatResponse(reply=reply)
        
    except ValueError as e:
        # Return helpful message when OpenAI is not configured
        return AiChatResponse(
            reply="AI chat is niet geconfigureerd. Voeg OPENAI_API_KEY toe aan je environment variables."
        )
    except Exception as e:
        return AiChatResponse(
            reply="Er is een fout opgetreden bij het verwerken van je bericht."
        )
