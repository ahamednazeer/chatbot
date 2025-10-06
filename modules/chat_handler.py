"""
Chat handler module for AI API integration with multiple provider support.
"""
from openai import OpenAI
from groq import Groq
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class ChatHandler:
    """Handles communication with multiple AI providers (OpenAI, Groq) with automatic fallback."""
    
    def __init__(self, openai_key: Optional[str] = None, openai_model: str = "gpt-3.5-turbo",
                 groq_key: Optional[str] = None, groq_model: str = "llama-3.1-70b-versatile",
                 provider: str = "auto"):
        """
        Initialize the chat handler with multiple AI providers.
        
        Args:
            openai_key: OpenAI API key
            openai_model: OpenAI model to use
            groq_key: Groq API key
            groq_model: Groq model to use
            provider: Preferred provider ('auto', 'openai', 'groq')
        """
        self.providers = []
        self.provider_preference = provider.lower()
        self.current_provider = None
        self.current_model = None
        
        # Initialize OpenAI if key is provided
        if openai_key:
            try:
                self.openai_client = OpenAI(api_key=openai_key)
                self.openai_model = openai_model
                self.providers.append('openai')
                logger.info("OpenAI provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
                self.openai_client = None
        else:
            self.openai_client = None
        
        # Initialize Groq if key is provided
        if groq_key:
            try:
                self.groq_client = Groq(api_key=groq_key)
                self.groq_model = groq_model
                self.providers.append('groq')
                logger.info("Groq provider initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq: {e}")
                self.groq_client = None
        else:
            self.groq_client = None
        
        if not self.providers:
            raise ValueError("No AI providers available. Please provide at least one API key.")
        
        logger.info(f"Available providers: {', '.join(self.providers)}")
    
    def _get_provider_order(self) -> List[str]:
        """Determine the order to try providers based on preference."""
        if self.provider_preference == 'openai' and 'openai' in self.providers:
            return ['openai'] + [p for p in self.providers if p != 'openai']
        elif self.provider_preference == 'groq' and 'groq' in self.providers:
            return ['groq'] + [p for p in self.providers if p != 'groq']
        else:
            # Auto mode: try Groq first (faster and cheaper), then OpenAI
            return sorted(self.providers, key=lambda x: 0 if x == 'groq' else 1)
    
    def _try_groq(self, messages: list, temperature: float) -> Dict[str, any]:
        """Try to get response from Groq."""
        try:
            response = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=messages,
                temperature=temperature,
                max_tokens=1000
            )
            
            assistant_message = response.choices[0].message.content
            
            return {
                "success": True,
                "message": assistant_message,
                "provider": "groq",
                "model": self.groq_model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.warning(f"Groq API error: {str(e)}")
            raise
    
    def _try_openai(self, messages: list, temperature: float) -> Dict[str, any]:
        """Try to get response from OpenAI."""
        try:
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                temperature=temperature,
                max_tokens=1000
            )
            
            assistant_message = response.choices[0].message.content
            
            return {
                "success": True,
                "message": assistant_message,
                "provider": "openai",
                "model": self.openai_model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.warning(f"OpenAI API error: {str(e)}")
            raise
    
    def get_response(self, messages: list, temperature: float = 0.7) -> Dict[str, any]:
        """
        Get a response from available AI providers with automatic fallback.
        
        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature (0-2)
        
        Returns:
            Dictionary containing response or error information
        """
        provider_order = self._get_provider_order()
        errors = []
        
        for provider in provider_order:
            try:
                if provider == 'groq' and self.groq_client:
                    logger.info(f"Trying Groq API with model {self.groq_model}")
                    return self._try_groq(messages, temperature)
                elif provider == 'openai' and self.openai_client:
                    logger.info(f"Trying OpenAI API with model {self.openai_model}")
                    return self._try_openai(messages, temperature)
            except Exception as e:
                error_msg = f"{provider}: {str(e)}"
                errors.append(error_msg)
                logger.error(f"Failed with {provider}: {str(e)}")
                continue
        
        # All providers failed
        logger.error(f"All providers failed. Errors: {errors}")
        return {
            "success": False,
            "error": " | ".join(errors),
            "message": "Sorry, all AI services are currently unavailable. Please try again later."
        }
    
    def stream_response(self, messages: list, temperature: float = 0.7):
        """
        Stream a response from available AI providers with automatic fallback.
        
        Args:
            messages: List of message dictionaries
            temperature: Sampling temperature (0-2)
        
        Yields:
            Response chunks
        """
        provider_order = self._get_provider_order()
        
        for provider in provider_order:
            try:
                if provider == 'groq' and self.groq_client:
                    logger.info(f"Streaming from Groq with model {self.groq_model}")
                    self.current_provider = 'groq'
                    self.current_model = self.groq_model
                    
                    stream = self.groq_client.chat.completions.create(
                        model=self.groq_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=1000,
                        stream=True
                    )
                    
                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            yield chunk.choices[0].delta.content
                    return
                    
                elif provider == 'openai' and self.openai_client:
                    logger.info(f"Streaming from OpenAI with model {self.openai_model}")
                    self.current_provider = 'openai'
                    self.current_model = self.openai_model
                    
                    stream = self.openai_client.chat.completions.create(
                        model=self.openai_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=1000,
                        stream=True
                    )
                    
                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            yield chunk.choices[0].delta.content
                    return
                    
            except Exception as e:
                logger.error(f"Error streaming from {provider}: {str(e)}")
                self.current_provider = None
                self.current_model = None
                continue
        
        # All providers failed
        self.current_provider = 'error'
        self.current_model = 'none'
        yield "Error: All AI services are currently unavailable."