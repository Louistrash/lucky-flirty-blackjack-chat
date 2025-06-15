from fastapi import APIRouter
from .endpoints import chat_router

router = APIRouter(tags=["AI Chat"])
router.include_router(chat_router, prefix="/chat")
