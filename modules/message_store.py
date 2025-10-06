"""
Message store module for managing conversation history.
"""
from typing import List, Dict
from collections import deque


class MessageStore:
    """Manages conversation history with a maximum size limit."""
    
    def __init__(self, max_history: int = 10):
        """
        Initialize the message store.
        
        Args:
            max_history: Maximum number of message pairs to keep in history
        """
        self.max_history = max_history
        self.messages = deque(maxlen=max_history * 2)  # *2 for user + assistant pairs
        self.system_message = None
    
    def set_system_message(self, content: str):
        """
        Set the system message for the conversation.
        
        Args:
            content: System message content
        """
        self.system_message = {"role": "system", "content": content}
        
    def add_system_message(self, content: str):
        """
        Add an additional system message to the conversation.
        This is useful for adding context about uploaded files or other information.
        
        Args:
            content: System message content
        """
        # Add as a regular message with role "system"
        self.messages.append({"role": "system", "content": content})
    
    def add_message(self, role: str, content: str):
        """
        Add a message to the conversation history.
        
        Args:
            role: Message role (user, assistant, or system)
            content: Message content
        """
        if role == "system":
            self.set_system_message(content)
        else:
            self.messages.append({"role": role, "content": content})
    
    def get_messages(self) -> List[Dict[str, str]]:
        """
        Get all messages including system message.
        
        Returns:
            List of message dictionaries
        """
        messages = []
        if self.system_message:
            messages.append(self.system_message)
        messages.extend(list(self.messages))
        return messages
    
    def clear(self):
        """Clear all messages except system message."""
        self.messages.clear()
    
    def get_conversation_count(self) -> int:
        """
        Get the number of conversation pairs.
        
        Returns:
            Number of user-assistant message pairs
        """
        return len(self.messages) // 2