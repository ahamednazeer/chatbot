"""
File parsing utilities for the chatbot.
Extracts text content from various file types.
"""
import os
import logging
import mimetypes
from pathlib import Path

logger = logging.getLogger(__name__)

# Maximum file size for text extraction (5MB)
MAX_TEXT_SIZE = 5 * 1024 * 1024

def get_file_type(file_path):
    """
    Determine the file type based on extension and content.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Tuple of (file_type, mime_type)
    """
    file_ext = Path(file_path).suffix.lower()
    mime_type, _ = mimetypes.guess_type(file_path)
    
    # Default file type based on extension
    if file_ext in ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.js', '.py', '.java', '.c', '.cpp', '.h', '.css', '.yml', '.yaml']:
        return 'text', mime_type
    elif file_ext in ['.pdf']:
        return 'pdf', mime_type
    elif file_ext in ['.png', '.jpg', '.jpeg', '.gif']:
        return 'image', mime_type
    elif file_ext in ['.docx', '.doc']:
        return 'document', mime_type
    elif file_ext in ['.xlsx', '.xls']:
        return 'spreadsheet', mime_type
    elif file_ext in ['.pptx', '.ppt']:
        return 'presentation', mime_type
    elif file_ext in ['.zip', '.tar', '.gz']:
        return 'archive', mime_type
    else:
        return 'unknown', mime_type

def extract_text_from_file(file_path):
    """
    Extract text content from a file based on its type.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Tuple of (success, content, error_message)
    """
    try:
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size > MAX_TEXT_SIZE:
            return False, "", f"File too large for text extraction ({file_size / 1024 / 1024:.1f} MB)"
        
        file_type, mime_type = get_file_type(file_path)
        
        # Handle different file types
        if file_type == 'text':
            return extract_from_text_file(file_path)
        elif file_type == 'pdf':
            return extract_from_pdf(file_path)
        elif file_type == 'document':
            return extract_from_docx(file_path)
        elif file_type == 'spreadsheet':
            return extract_from_xlsx(file_path)
        elif file_type == 'image':
            # For images, we just return a placeholder
            return True, "[Image file - content cannot be displayed as text]", ""
        else:
            return False, "", f"Text extraction not supported for this file type: {file_type}"
            
    except Exception as e:
        logger.error(f"Error extracting text from file {file_path}: {str(e)}")
        return False, "", f"Error extracting text: {str(e)}"

def extract_from_text_file(file_path):
    """Extract text from plain text files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return True, content, ""
    except UnicodeDecodeError:
        # Try with a different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
            return True, content, ""
        except Exception as e:
            return False, "", f"Error reading text file: {str(e)}"
    except Exception as e:
        return False, "", f"Error reading text file: {str(e)}"

def extract_from_pdf(file_path):
    """Extract text from PDF files."""
    try:
        # This requires PyPDF2 or a similar library
        # For now, return a message about installation
        return False, "", "PDF text extraction requires additional libraries. Install PyPDF2 with: pip install PyPDF2"
    except Exception as e:
        return False, "", f"Error extracting text from PDF: {str(e)}"

def extract_from_docx(file_path):
    """Extract text from DOCX files."""
    try:
        # This requires python-docx
        # For now, return a message about installation
        return False, "", "DOCX text extraction requires additional libraries. Install python-docx with: pip install python-docx"
    except Exception as e:
        return False, "", f"Error extracting text from DOCX: {str(e)}"

def extract_from_xlsx(file_path):
    """Extract text from XLSX files."""
    try:
        # This requires openpyxl or pandas
        # For now, return a message about installation
        return False, "", "XLSX text extraction requires additional libraries. Install openpyxl with: pip install openpyxl"
    except Exception as e:
        return False, "", f"Error extracting text from XLSX: {str(e)}"

def get_file_summary(file_path):
    """
    Get a summary of the file including type, size, and a preview of content if available.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Dictionary with file information
    """
    try:
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_type, mime_type = get_file_type(file_path)
        
        # Get content preview for text files
        content_preview = ""
        error_message = ""
        
        if file_type == 'text':
            success, content, error = extract_from_text_file(file_path)
            if success:
                # Limit preview to first 1000 characters
                content_preview = content[:1000]
                if len(content) > 1000:
                    content_preview += "... [content truncated]"
            else:
                error_message = error
        
        return {
            'name': file_name,
            'path': file_path,
            'size': file_size,
            'size_formatted': f"{file_size / 1024:.1f} KB",
            'type': file_type,
            'mime_type': mime_type,
            'content_preview': content_preview,
            'error': error_message
        }
        
    except Exception as e:
        logger.error(f"Error getting file summary for {file_path}: {str(e)}")
        return {
            'name': os.path.basename(file_path),
            'path': file_path,
            'error': f"Error analyzing file: {str(e)}"
        }