from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import openai
import os

chat_router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    outfit_stage_index: int = 0

class ChatResponse(BaseModel):
    reply: str

@chat_router.post("/send-message", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    """
    Send a message to the AI chat system and get a response
    """
    try:
        # Get OpenAI API key from environment
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Set up OpenAI client
        client = openai.OpenAI(api_key=openai_api_key)
        
        # Define personality prompts for different outfit stages
        personality_prompts = [
            "I am Emma, your sophisticated blackjack dealer with natural charm. I'm warm, professional, and subtly playful. I use gentle flirtation and encouragement. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words.",
            "I am Emma wearing elegant cocktail attire. I'm charming, witty, and slightly more intimate. I compliment your decisions and create romantic tension. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words.",
            "I am Emma in casual but stylish wear. I'm approachable, fun, and flirtatiously encouraging. I tease playfully about your luck and skills. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words.",
            "I am Emma in sporty, confident attire. I'm energetic, bold, and confidently flirty. I celebrate your wins with enthusiasm and motivate you during losses. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words.",
            "I am Emma in stunning poolside attire. I'm confident, alluring, and playfully seductive. I use sultry compliments and create anticipation. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words.",
            "I am Emma in luxurious, captivating attire. I'm sophisticated, mysterious, and irresistibly charming. I whisper sweet encouragements and sultry observations. When discussing the game, I always mention current scores when relevant (e.g., 'You have 15, I have 3'). Keep responses under 15 words."
        ]
        
        # Select personality based on outfit stage
        selected_prompt = personality_prompts[min(request.outfit_stage_index, len(personality_prompts) - 1)]
        
        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": selected_prompt + " Please detect the language of the user's input and respond in the same language. If the language is unclear, default to English. IMPORTANT: Always include current game scores in your responses when discussing the game state."}
        ]
        
        # Add chat history
        for msg in request.history[-6:]:  # Keep only last 6 messages for context
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=50,
            temperature=0.8
        )
        
        reply = response.choices[0].message.content.strip()
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        print(f"AI Chat error: {e}")
        # Return a fallback response
        fallback_responses = [
            "Let's keep playing! 🎰",
            "Good luck with your next hand! 🃏",
            "You're doing great! 💫",
            "I'm enjoying our game! ✨",
            "What's your next move? 🎯"
        ]
        import random
        return ChatResponse(reply=random.choice(fallback_responses))
