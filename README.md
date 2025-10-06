# AI Chatbot - Modern Web Interface

A sleek, modern web chatbot built with Flask backend and vanilla JavaScript frontend, powered by multiple AI providers (OpenAI, Groq) with automatic fallback.

## Features

- 🎨 **Modern UI/UX**: Sleek dark theme with smooth animations
- 💬 **Real-time Chat**: Instant responses from AI providers
- 🔄 **Multi-Provider Support**: OpenAI and Groq with automatic fallback
- ⚡ **Fast & Free**: Groq provides lightning-fast responses
- 📝 **Conversation History**: Maintains context across messages
- 🔄 **Session Management**: Persistent conversations per user session
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🧩 **Modular Architecture**: Clean, maintainable code structure
- 🚀 **Zero Frontend Dependencies**: Pure HTML/CSS/JS, no frameworks

## Project Structure

```
chatbot/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
├── static/
│   ├── css/
│   │   └── style.css    # Styles
│   └── js/
│       └── chat.js      # Frontend logic
├── templates/
│   └── index.html       # Main HTML template
└── modules/
    ├── __init__.py
    ├── chat_handler.py  # OpenAI API integration
    └── message_store.py # Message management
```

## Installation

### Prerequisites

- Python 3.8 or higher
- At least one AI provider API key:
  - **Groq API key** ([Get free key here](https://console.groq.com/)) - Recommended, fast and free!
  - **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd /path/to/chatbot
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key(s):
   ```
   # Groq (Recommended - Fast and Free!)
   GROQ_API_KEY=gsk-your-groq-api-key-here
   GROQ_MODEL=llama-3.3-70b-versatile
   
   # OpenAI (Optional)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-3.5-turbo
   
   # Provider preference: 'auto', 'groq', or 'openai'
   AI_PROVIDER=auto
   
   SECRET_KEY=your-secret-key-here
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## Configuration

Edit the `.env` file to customize:

### AI Provider Settings
- `GROQ_API_KEY`: Your Groq API key (recommended - fast and free!)
- `GROQ_MODEL`: Groq model to use (default: llama-3.3-70b-versatile)
- `OPENAI_API_KEY`: Your OpenAI API key (optional)
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-3.5-turbo)
- `AI_PROVIDER`: Provider preference - 'auto' (tries Groq first), 'groq', or 'openai'

### Available Groq Models
- `llama-3.3-70b-versatile` - Best for general chat (recommended)
- `llama-3.1-8b-instant` - Faster, smaller model
- `openai/gpt-oss-120b` - OpenAI's open-source model on Groq

### Flask Settings
- `SECRET_KEY`: Flask secret key for sessions
- `FLASK_DEBUG`: Enable debug mode (True/False)

### Chat Settings
- `MAX_CONVERSATION_HISTORY`: Number of message pairs to keep (default: 10)
- `SYSTEM_MESSAGE`: System prompt for the AI assistant

## API Endpoints

### POST `/api/chat`
Send a message to the chatbot.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "message": "I'm doing well, thank you! How can I help you today?",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 12,
    "total_tokens": 27
  }
}
```

### POST `/api/clear`
Clear the conversation history.

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

### GET `/api/history`
Get the conversation history.

**Response:**
```json
{
  "success": true,
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ],
  "count": 1
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model": "gpt-3.5-turbo"
}
```

## Modules

### `chat_handler.py`
Handles communication with OpenAI API:
- `get_response()`: Get a single response
- `stream_response()`: Stream responses (for future implementation)

### `message_store.py`
Manages conversation history:
- `add_message()`: Add a message to history
- `get_messages()`: Retrieve all messages
- `clear()`: Clear conversation history
- Automatic history size management

### `config.py`
Centralized configuration management:
- Environment variable loading
- Configuration validation
- Default values

## Customization

### Changing the Theme

Edit `static/css/style.css` and modify the CSS variables:

```css
:root {
    --primary-color: #6366f1;
    --background: #0f172a;
    --surface: #1e293b;
    /* ... more variables */
}
```

### Modifying the AI Behavior

Edit the `SYSTEM_MESSAGE` in your `.env` file:

```
SYSTEM_MESSAGE=You are a helpful coding assistant specialized in Python.
```

### Adjusting Conversation History

Change `MAX_CONVERSATION_HISTORY` in `.env`:

```
MAX_CONVERSATION_HISTORY=20
```

## Development

### Running in Debug Mode

Set in `.env`:
```
FLASK_DEBUG=True
```

### Adding New Features

The modular structure makes it easy to extend:

1. **New API endpoints**: Add routes in `app.py`
2. **New AI features**: Extend `ChatHandler` in `modules/chat_handler.py`
3. **UI changes**: Modify `templates/index.html` and `static/css/style.css`
4. **Frontend logic**: Update `static/js/chat.js`

## Troubleshooting

### "OPENAI_API_KEY is not set" error
Make sure you've created a `.env` file with your API key.

### Port 5000 already in use
Change the port in `app.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=Config.DEBUG)
```

### Messages not appearing
Check browser console for JavaScript errors and ensure the Flask server is running.

## Security Notes

- Never commit your `.env` file or API keys to version control
- Use environment variables for sensitive data
- In production, use a proper WSGI server (gunicorn, uWSGI)
- Enable HTTPS in production
- Set a strong `SECRET_KEY`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the project repository.