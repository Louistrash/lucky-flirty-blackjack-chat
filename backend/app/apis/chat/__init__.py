from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])

class Message(BaseModel):
    content: str
    role: str = "user"

class ChatResponse(BaseModel):
    response: str

@router.post("/send", response_model=ChatResponse)
async def send_message(message: Message):
    try:
        # Hier komt later de echte chat logica
        # Voor nu sturen we een eenvoudige response terug
        return ChatResponse(
            response=f"Je bericht was: {message.content}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 