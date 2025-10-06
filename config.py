"""
Configuration module for the chatbot application.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration class."""
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # AI Provider configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')
    
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile')
    
    # Provider priority (will try in order)
    AI_PROVIDER = os.environ.get('AI_PROVIDER', 'auto')  # auto, openai, groq
    
    # Chat configuration
    MAX_CONVERSATION_HISTORY = int(os.environ.get('MAX_CONVERSATION_HISTORY', '10'))
    SYSTEM_MESSAGE = os.environ.get(
        'SYSTEM_MESSAGE',
        'You are a helpful, friendly, and knowledgeable AI assistant.'
    )
    
    @staticmethod
    def validate():
        """Validate required configuration."""
        if not Config.OPENAI_API_KEY and not Config.GROQ_API_KEY:
            raise ValueError(
                "No AI provider API key found. Please set OPENAI_API_KEY or GROQ_API_KEY in your .env file."
            )