"""
Main Flask application for the chatbot.
"""
from flask import Flask, render_template, request, jsonify, session, Response, send_from_directory
from werkzeug.utils import secure_filename
from config import Config
from modules import ChatHandler, MessageStore
from modules.file_parser import get_file_summary, extract_text_from_file
import logging
import uuid
import json
import os
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Configure file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'csv', 'json', 'md', 'docx', 'xlsx', 'pptx', 'html', 'xml', 'js', 'py', 'java', 'c', 'cpp', 'h', 'css', 'zip', 'tar', 'gz', "yml", "yaml"}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB limit

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Validate configuration
try:
    Config.validate()
except ValueError as e:
    logger.error(f"Configuration error: {e}")
    raise

# Initialize chat handler with multiple providers
chat_handler = ChatHandler(
    openai_key=Config.OPENAI_API_KEY,
    openai_model=Config.OPENAI_MODEL,
    groq_key=Config.GROQ_API_KEY,
    groq_model=Config.GROQ_MODEL,
    provider=Config.AI_PROVIDER
)

# Store for conversation sessions
conversation_sessions = {}


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_or_create_session():
    """Get or create a conversation session."""
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    if session_id not in conversation_sessions:
        message_store = MessageStore(max_history=Config.MAX_CONVERSATION_HISTORY)
        message_store.set_system_message(Config.SYSTEM_MESSAGE)
        conversation_sessions[session_id] = message_store
    
    return conversation_sessions[session_id]


@app.route('/')
def index():
    """Render the main chat interface."""
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Handle chat messages.
    
    Expected JSON payload:
    {
        "message": "user message text",
        "temperature": 0.7  (optional),
        "stream": false  (optional, default: false)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400
        
        user_message = data['message'].strip()
        temperature = data.get('temperature', 0.7)
        stream = data.get('stream', False)
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Empty message'
            }), 400
        
        # Get or create conversation session
        message_store = get_or_create_session()
        
        # Check if this is a message about an uploaded file
        is_file_message = user_message.startswith("I've uploaded a file named")
        
        # If it's not a file message, add it to history
        if not is_file_message:
            message_store.add_message("user", user_message)
        
        # Get messages for context
        messages = message_store.get_messages()
        
        # If this is a file message, add context about file handling capabilities
        if is_file_message:
            # Add a system message with file handling instructions
            file_context = {
                "role": "system", 
                "content": "The user has uploaded a file. You can analyze text files, images, and other documents. " +
                           "For text files, you can discuss the content. For images, you can describe what you see. " +
                           "For other files, you can discuss the file type and potential uses."
            }
            messages.append(file_context)
        
        # If streaming is requested, use the streaming endpoint
        if stream:
            return stream_chat_response(messages, temperature, message_store)
        
        # Otherwise, use the regular response
        response = chat_handler.get_response(messages, temperature)
        
        if response['success']:
            # Add assistant response to history
            message_store.add_message("assistant", response['message'])
            
            return jsonify({
                'success': True,
                'message': response['message'],
                'provider': response.get('provider', 'unknown'),
                'model': response.get('model', 'unknown'),
                'usage': response.get('usage', {})
            })
        else:
            return jsonify({
                'success': False,
                'error': response.get('error', 'Unknown error'),
                'message': response['message']
            }), 500
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'An unexpected error occurred'
        }), 500


def stream_chat_response(messages, temperature, message_store):
    """Stream the chat response using server-sent events."""
    def generate():
        full_response = ""
        provider = "unknown"
        model = "unknown"
        
        try:
            # Start with a message indicating the stream is starting
            yield f"data: {json.dumps({'type': 'start'})}\n\n"
            
            # Stream the response
            for chunk in chat_handler.stream_response(messages, temperature):
                full_response += chunk
                data = {
                    'type': 'chunk',
                    'content': chunk
                }
                yield f"data: {json.dumps(data)}\n\n"
            
            # Get provider and model info
            if hasattr(chat_handler, 'current_provider'):
                provider = chat_handler.current_provider
            if hasattr(chat_handler, 'current_model'):
                model = chat_handler.current_model
            
            # Add the complete response to the message store
            message_store.add_message("assistant", full_response)
            
            # Send a completion message
            yield f"data: {json.dumps({'type': 'end', 'provider': provider, 'model': model})}\n\n"
        
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            error_data = {
                'type': 'error',
                'error': str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/clear', methods=['POST'])
def clear_conversation():
    """Clear the conversation history."""
    try:
        message_store = get_or_create_session()
        message_store.clear()
        
        return jsonify({
            'success': True,
            'message': 'Conversation cleared'
        })
    
    except Exception as e:
        logger.error(f"Error clearing conversation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get the conversation history."""
    try:
        message_store = get_or_create_session()
        messages = message_store.get_messages()
        
        # Filter out system messages for display
        display_messages = [
            msg for msg in messages if msg['role'] != 'system'
        ]
        
        return jsonify({
            'success': True,
            'messages': display_messages,
            'count': message_store.get_conversation_count()
        })
    
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file uploads."""
    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file part'
            }), 400
        
        file = request.files['file']
        message = request.form.get('message', '')
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No selected file'
            }), 400
        
        if file and allowed_file(file.filename):
            # Create a unique filename to prevent collisions
            filename = secure_filename(file.filename)
            unique_filename = f"{int(time.time())}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save the file
            file.save(file_path)
            
            # Get file summary and extract text if possible
            file_summary = get_file_summary(file_path)
            success, content, error = extract_text_from_file(file_path)
            
            # Get file extension
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            # Get session and add file info to message history
            message_store = get_or_create_session()
            
            # Create a detailed file info message
            file_info = f"[Uploaded file: {filename} ({file_extension.upper()}, {file_summary['size_formatted']})]"
            message_store.add_message("user", file_info)
            
            # Add file content as system message if available
            if success and content:
                # Limit content to 4000 characters to avoid context length issues
                if len(content) > 4000:
                    content = content[:4000] + "... [content truncated]"
                
                file_content_msg = {
                    "role": "system",
                    "content": f"Content of the uploaded file '{filename}':\n\n{content}"
                }
                message_store.add_system_message(file_content_msg["content"])
            
            # Return success with file info
            return jsonify({
                'success': True,
                'filename': filename,
                'unique_filename': unique_filename,
                'file_path': f"/uploads/{unique_filename}",
                'file_size': file_summary['size'],
                'file_type': file_extension,
                'content_extracted': success,
                'content_preview': file_summary.get('content_preview', '')[:100] + '...' if file_summary.get('content_preview') else ''
            })
        else:
            return jsonify({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
    
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/file-content/<filename>')
def get_file_content(filename):
    """Get the content of an uploaded file."""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'File not found'
            }), 404
        
        # Get file summary and extract text
        file_summary = get_file_summary(file_path)
        success, content, error = extract_text_from_file(file_path)
        
        if success:
            return jsonify({
                'success': True,
                'filename': filename,
                'file_info': file_summary,
                'content': content
            })
        else:
            return jsonify({
                'success': False,
                'filename': filename,
                'file_info': file_summary,
                'error': error or 'Could not extract content from this file type'
            }), 400
    
    except Exception as e:
        logger.error(f"Error getting file content: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health')
def health():
    """Health check endpoint."""
    available_providers = []
    if Config.OPENAI_API_KEY:
        available_providers.append(f"openai ({Config.OPENAI_MODEL})")
    if Config.GROQ_API_KEY:
        available_providers.append(f"groq ({Config.GROQ_MODEL})")
    
    return jsonify({
        'status': 'healthy',
        'providers': available_providers,
        'preference': Config.AI_PROVIDER
    })


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )