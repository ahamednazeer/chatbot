/**
 * Chat application frontend logic
 */

class ChatApp {
    constructor() {
        // Main elements
        this.appContainer = document.querySelector('.app-container');
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.charCount = document.getElementById('charCount');
        this.welcomeMessage = document.querySelector('.welcome-message');
        this.chatTitle = document.getElementById('chatTitle');
        
        // Sidebar elements
        this.newChatBtn = document.getElementById('newChatBtn');
        this.toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
        this.expandSidebarBtn = document.getElementById('expandSidebarBtn');
        this.mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        this.conversationList = document.getElementById('conversationList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        
        // File upload elements
        this.fileUploadBtn = document.getElementById('fileUploadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.filePreviewModal = document.getElementById('filePreviewModal');
        this.previewFileName = document.getElementById('previewFileName');
        this.previewFileSize = document.getElementById('previewFileSize');
        this.fileMessageInput = document.getElementById('fileMessageInput');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
        this.confirmUploadBtn = document.getElementById('confirmUploadBtn');
        
        // Voice elements
        this.voiceInputBtn = document.getElementById('voiceInputBtn');
        
        // Toast notification elements
        this.toastNotification = document.getElementById('toastNotification');
        this.toastMessage = document.getElementById('toastMessage');
        this.toastClose = document.getElementById('toastClose');
        
        // Example prompts
        this.examplePrompts = document.querySelectorAll('.example-prompt');
        
        // State variables
        this.isProcessing = false;
        this.currentFile = null;
        this.conversations = [];
        this.currentConversationId = null;
        this.isDarkTheme = true; // Default theme
        
        // Voice recognition state
        this.recognition = null;
        this.isRecording = false;
        this.hasRetriedRecognition = false; // Retry once on transient errors
        
        // Speech synthesis state
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isSpeaking = false;
        
        // Create sidebar overlay for mobile
        this.sidebarOverlay = document.createElement('div');
        this.sidebarOverlay.className = 'sidebar-overlay';
        this.appContainer.appendChild(this.sidebarOverlay);
        
        this.init();
    }
    
    init() {
        // Configure marked.js for better code rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {}
                    }
                    return hljs.highlightAuto(code).value;
                },
                breaks: true,
                gfm: true
            });
        }
        
        // Message event listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResize();
        });
        
        // File upload event listeners
        this.fileUploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        this.closeModalBtn.addEventListener('click', () => this.closeFilePreviewModal());
        this.cancelUploadBtn.addEventListener('click', () => this.closeFilePreviewModal());
        this.confirmUploadBtn.addEventListener('click', () => this.uploadFile());
        
        // Sidebar event listeners
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.expandSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.mobileSidebarToggle.addEventListener('click', () => this.toggleMobileSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllConversations());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        
        // Toast notification event listeners
        this.toastClose.addEventListener('click', () => this.hideToast());
        
        // Example prompts event listeners
        this.examplePrompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                this.messageInput.value = prompt.textContent;
                this.updateCharCount();
                this.autoResize();
                this.messageInput.focus();
            });
        });
        
        // Voice input event listener
        this.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Load theme preference from localStorage
        this.loadThemePreference();
        
        // Load conversation history
        this.loadHistory();
    }
    
    handleFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds the 10MB limit.');
            this.fileInput.value = '';
            return;
        }
        
        // Store the current file
        this.currentFile = file;
        
        // Update preview modal
        this.previewFileName.textContent = file.name;
        this.previewFileSize.textContent = this.formatFileSize(file.size);
        
        // Show the preview modal
        this.filePreviewModal.classList.remove('hidden');
    }
    
    closeFilePreviewModal() {
        this.filePreviewModal.classList.add('hidden');
        this.fileMessageInput.value = '';
        this.fileInput.value = '';
        this.currentFile = null;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    async uploadFile() {
        if (!this.currentFile) return;
        
        // Hide welcome message
        this.hideWelcomeMessage();
        
        // Disable input while processing
        this.setProcessing(true);
        
        // Get optional message
        const message = this.fileMessageInput.value.trim();
        
        // Create form data
        const formData = new FormData();
        formData.append('file', this.currentFile);
        
        // Add optional message
        if (message) {
            formData.append('message', message);
        }
        
        try {
            // Show file being uploaded in chat
            this.addMessage('user', `Uploading file: ${this.currentFile.name}...`);
            
            // Upload the file
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update the last message to show the file was uploaded successfully
                const lastMessage = this.chatContainer.lastElementChild;
                const contentDiv = lastMessage.querySelector('.message-content');
                
                // Create file badge with link
                const fileLink = document.createElement('a');
                fileLink.href = data.file_path;
                fileLink.target = '_blank';
                fileLink.className = 'file-badge';
                fileLink.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
                    </svg>
                    ${this.currentFile.name}
                `;
                
                // Create a container for the file badge and buttons
                const fileContainer = document.createElement('div');
                fileContainer.className = 'file-container';
                
                // Create a view content button for text files
                if (data.content_extracted) {
                    const viewContentBtn = document.createElement('button');
                    viewContentBtn.className = 'view-content-btn';
                    viewContentBtn.innerHTML = 'View Content';
                    viewContentBtn.addEventListener('click', () => this.viewFileContent(data.unique_filename));
                    fileContainer.appendChild(viewContentBtn);
                }
                
                contentDiv.innerHTML = '';
                contentDiv.appendChild(fileLink);
                
                // If we have content preview, add the button
                if (data.content_extracted) {
                    contentDiv.appendChild(fileContainer);
                }
                
                // If there's a message, add it
                if (message) {
                    const messageText = document.createElement('p');
                    messageText.textContent = message;
                    messageText.style.marginTop = '0.5rem';
                    contentDiv.appendChild(messageText);
                    
                    // The message will be added to the chat history on the server side
                }
                
                // Get AI response
                await this.streamMessage(`I've uploaded a file named ${this.currentFile.name}. ${message}`);
                
                // Close the modal
                this.closeFilePreviewModal();
            } else {
                // Show error
                this.showError(data.error || 'Failed to upload file');
                
                // Update the last message to show the error
                const lastMessage = this.chatContainer.lastElementChild;
                const contentDiv = lastMessage.querySelector('.message-content');
                contentDiv.textContent = `Failed to upload file: ${data.error || 'Unknown error'}`;
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showError(error.message || 'Failed to upload file');
            
            // Update the last message to show the error
            const lastMessage = this.chatContainer.lastElementChild;
            const contentDiv = lastMessage.querySelector('.message-content');
            contentDiv.textContent = `Failed to upload file: ${error.message || 'Unknown error'}`;
        } finally {
            // Re-enable input
            this.setProcessing(false);
        }
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }
    
    /**
     * Format markdown content to HTML
     * @param {string} content - The markdown content to format
     * @returns {string} - The formatted HTML
     */
    formatMarkdown(content) {
        if (typeof marked !== 'undefined') {
            return marked.parse(content);
        }
        // Fallback: simple text with line breaks
        return content.replace(/\n/g, '<br>');
    }
    
    /**
     * Apply syntax highlighting to code blocks in an element
     * @param {HTMLElement} element - The element containing code blocks
     */
    highlightCodeBlocks(element) {
        if (typeof hljs !== 'undefined') {
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }
    
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 1800) {
            this.charCount.style.color = 'var(--warning)';
        } else if (count > 1950) {
            this.charCount.style.color = 'var(--error)';
        } else {
            this.charCount.style.color = 'var(--text-muted)';
        }
    }
    
    hideWelcomeMessage() {
        if (this.welcomeMessage) {
            this.welcomeMessage.classList.add('fade-out');
            setTimeout(() => {
                this.welcomeMessage.remove();
                this.welcomeMessage = null;
            }, 300);
        }
    }
    
    async sendMessage() {
        if (this.isProcessing) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Hide welcome message on first message
        this.hideWelcomeMessage();
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Clear input
        this.messageInput.value = '';
        this.updateCharCount();
        this.autoResize();
        
        // Disable input while processing
        this.setProcessing(true);
        
        // Use streaming by default
        const useStreaming = true;
        
        if (useStreaming) {
            // Handle streaming response
            await this.streamMessage(message);
        } else {
            // Handle regular response (fallback)
            await this.regularMessage(message);
        }
        
        // Re-enable input
        this.setProcessing(false);
    }
    
    async streamMessage(message) {
        // Create a placeholder for the bot message
        const messageDiv = this.createBotMessageElement('');
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Get the content element where we'll stream the text
        const contentDiv = messageDiv.querySelector('.message-content');
        
        // Accumulate the full message text
        let fullText = '';
        
        try {
            // Make the streaming request
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    temperature: 0.7,
                    stream: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Set up event source for server-sent events
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete events from the buffer
                let eventEnd = buffer.indexOf('\n\n');
                while (eventEnd > -1) {
                    const eventData = buffer.substring(0, eventEnd);
                    buffer = buffer.substring(eventEnd + 2);
                    
                    // Process the event if it starts with "data: "
                    if (eventData.startsWith('data: ')) {
                        const jsonData = JSON.parse(eventData.substring(6));
                        
                        if (jsonData.type === 'chunk') {
                            // Append the chunk to the accumulated text
                            fullText += jsonData.content;
                            // Render the markdown in real-time
                            contentDiv.innerHTML = this.formatMarkdown(fullText);
                            // Apply syntax highlighting to code blocks
                            this.highlightCodeBlocks(contentDiv);
                            this.scrollToBottom();
                        } 
                        else if (jsonData.type === 'error') {
                            console.error('Streaming error:', jsonData.error);
                            fullText += '\n\nError: ' + jsonData.error;
                            contentDiv.innerHTML = this.formatMarkdown(fullText);
                        }
                    }
                    
                    eventEnd = buffer.indexOf('\n\n');
                }
            }
            
            // Process any remaining buffer
            if (buffer.startsWith('data: ')) {
                const jsonData = JSON.parse(buffer.substring(6));
                if (jsonData.type === 'chunk') {
                    fullText += jsonData.content;
                    contentDiv.innerHTML = this.formatMarkdown(fullText);
                    this.highlightCodeBlocks(contentDiv);
                }
            }
            
            // Add voice output button after streaming is complete
            if (fullText) {
                this.addVoiceOutputButton(messageDiv, fullText);
            }
            
        } catch (error) {
            console.error('Error streaming message:', error);
            contentDiv.innerHTML = this.formatMarkdown('Sorry, I encountered an error while generating a response. Please try again.');
            this.showError(error.message);
        }
        
        this.scrollToBottom();
    }
    
    async viewFileContent(filename) {
        try {
            // Show loading indicator
            const loadingElement = this.showLoading();
            
            // Fetch file content
            const response = await fetch(`/api/file-content/${filename}`);
            const data = await response.json();
            
            // Remove loading indicator
            this.removeLoading(loadingElement);
            
            if (data.success) {
                // Create a modal to display the content
                const modal = document.createElement('div');
                modal.className = 'file-content-modal';
                
                // Create modal content
                modal.innerHTML = `
                    <div class="file-content-container">
                        <div class="file-content-header">
                            <h3>${data.filename}</h3>
                            <button class="close-content-btn">&times;</button>
                        </div>
                        <div class="file-content-body">
                            <pre>${data.content}</pre>
                        </div>
                    </div>
                `;
                
                // Add modal to body
                document.body.appendChild(modal);
                
                // Add event listener to close button
                const closeBtn = modal.querySelector('.close-content-btn');
                closeBtn.addEventListener('click', () => {
                    modal.remove();
                });
                
                // Close on click outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            } else {
                this.showError(data.error || 'Could not load file content');
            }
        } catch (error) {
            console.error('Error viewing file content:', error);
            this.showError(error.message || 'Failed to load file content');
        }
    }
    
    async regularMessage(message) {
        // Show loading indicator
        const loadingElement = this.showLoading();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    temperature: 0.7,
                    stream: false
                })
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            this.removeLoading(loadingElement);
            
            if (data.success) {
                this.addMessage('bot', data.message);
            } else {
                this.addMessage('bot', data.message || 'Sorry, something went wrong. Please try again.');
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.removeLoading(loadingElement);
            this.addMessage('bot', 'Sorry, I encountered an error. Please check your connection and try again.');
            this.showError(error.message);
        }
    }
    
    createBotMessageElement(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add voice output button for bot messages
        if (content) {
            this.addVoiceOutputButton(messageDiv, content);
        }
        
        return messageDiv;
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (role === 'bot') {
            avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
            `;
        } else {
            avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                </svg>
            `;
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Format bot messages with markdown, keep user messages as plain text
        if (role === 'bot') {
            contentDiv.innerHTML = this.formatMarkdown(content);
            // Apply syntax highlighting to code blocks
            this.highlightCodeBlocks(contentDiv);
        } else {
            contentDiv.textContent = content;
        }
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add voice output button for bot messages
        if (role === 'bot' && content) {
            this.addVoiceOutputButton(messageDiv, content);
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showLoading() {
        const template = document.getElementById('loadingTemplate');
        const loadingElement = template.content.cloneNode(true);
        this.chatContainer.appendChild(loadingElement);
        this.scrollToBottom();
        
        // Return the actual element for later removal
        return this.chatContainer.lastElementChild;
    }
    
    removeLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.remove();
        }
    }
    
    showError(message) {
        console.error('Chat error:', message);
        // You can implement a toast notification here if desired
    }
    
    setProcessing(processing) {
        this.isProcessing = processing;
        this.sendBtn.disabled = processing;
        this.messageInput.disabled = processing;
        
        if (processing) {
            this.sendBtn.style.opacity = '0.5';
        } else {
            this.sendBtn.style.opacity = '1';
            this.messageInput.focus();
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    async clearConversation() {
        if (!confirm('Are you sure you want to clear the conversation?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear chat container
                this.chatContainer.innerHTML = '';
                
                // Show welcome message again
                this.chatContainer.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
                                <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <h2>Welcome to AI Assistant</h2>
                        <p>I'm here to help you with any questions or tasks. Start a conversation by typing a message below.</p>
                    </div>
                `;
                
                this.welcomeMessage = document.querySelector('.welcome-message');
            }
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.showError('Failed to clear conversation');
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data.success && data.messages.length > 0) {
                this.hideWelcomeMessage();
                
                data.messages.forEach(msg => {
                    this.addMessage(msg.role === 'user' ? 'user' : 'bot', msg.content);
                });
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    // Sidebar functions
    startNewChat() {
        // Clear the current conversation
        this.chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
                        <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
                    </svg>
                </div>
                <h2>Welcome to AI Assistant</h2>
                <p>I'm here to help you with any questions or tasks. Start a conversation by typing a message below.</p>
            </div>
        `;
        this.welcomeMessage = document.querySelector('.welcome-message');
        
        // Clear the conversation on the server
        fetch('/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).catch(error => {
            console.error('Error clearing conversation:', error);
        });
        
        // Focus on the input
        this.messageInput.focus();
    }
    
    toggleSidebar() {
        this.appContainer.classList.toggle('sidebar-collapsed');
    }
    
    toggleMobileSidebar() {
        this.appContainer.classList.toggle('mobile-sidebar-open');
    }
    
    closeMobileSidebar() {
        this.appContainer.classList.remove('mobile-sidebar-open');
    }
    
    async clearAllConversations() {
        if (!confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear the conversation list
                this.conversationList.innerHTML = '<div class="empty-history-message">No recent conversations</div>';
                
                // Clear the current chat
                this.startNewChat();
                
                // Show success message
                this.showToast('All conversations cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Error clearing conversations:', error);
            this.showToast('Failed to clear conversations', 'error');
        }
    }
    
    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        
        if (this.isDarkTheme) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        }
    }
    
    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'light') {
            this.isDarkTheme = false;
            document.body.classList.add('light-theme');
        } else {
            this.isDarkTheme = true;
            document.body.classList.remove('light-theme');
        }
    }
    
    showToast(message, type = 'info') {
        if (!this.toastNotification || !this.toastMessage) {
            console.log('Toast:', message);
            return;
        }
        
        this.toastMessage.textContent = message;
        this.toastNotification.className = `toast-notification ${type}`;
        this.toastNotification.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }
    
    hideToast() {
        if (this.toastNotification) {
            this.toastNotification.classList.remove('show');
        }
    }
    
    // ===== Voice Input (Speech-to-Text) Methods =====
    
    initSpeechRecognition() {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // SpeechRecognition only works in secure contexts (https or localhost)
        const isSecureContext = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecureContext) {
            console.warn('Speech recognition requires a secure context (https or localhost)');
            this.voiceInputBtn.style.display = 'none';
            return;
        }
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            this.voiceInputBtn.style.display = 'none';
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.voiceInputBtn.classList.add('recording');
            this.voiceInputBtn.disabled = false; // Re-enable after start resolves
            this.messageInput.placeholder = 'Listening...';
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update the input with the transcript
            if (finalTranscript) {
                this.messageInput.value = (this.messageInput.value + finalTranscript).trim();
                this.updateCharCount();
                this.autoResize();
            } else if (interimTranscript) {
                // Show interim results in placeholder or input
                const currentValue = this.messageInput.value;
                this.messageInput.value = currentValue + interimTranscript;
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            // Retry once on transient errors when online
            const transientErrors = new Set(['network', 'no-speech', 'aborted']);
            if (navigator.onLine && transientErrors.has(event.error) && !this.hasRetriedRecognition) {
                this.hasRetriedRecognition = true;
                try {
                    this.recognition.stop();
                } catch (_) {}
                setTimeout(() => {
                    try {
                        this.startVoiceInput();
                    } catch (retryErr) {
                        console.error('Retry start failed:', retryErr);
                        this.stopVoiceInput();
                        this.showToast('Could not start speech recognition. Please try again.', 'error');
                    }
                }, 200);
                return;
            }

            // Stop recording state
            this.stopVoiceInput();
            this.hasRetriedRecognition = false;
            
            // Provide user-friendly error messages
            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'No microphone found. Please check your device.',
                'not-allowed': 'Microphone access denied. Please enable it in your browser settings.',
                'network': navigator.onLine ? 'Temporary network issue with the speech service. Please try again.' : 'No internet connection. Please reconnect and try again.',
                'aborted': 'Speech recognition was aborted.',
                'service-not-allowed': 'Speech recognition service is not allowed. Please check your browser settings.',
                'bad-grammar': 'Speech recognition grammar error.',
                'language-not-supported': 'Language not supported.'
            };
            
            const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
            this.showToast(message, 'error');
        };
        
        this.recognition.onend = () => {
            // Only stop if we're still in recording state
            // This prevents double-stopping
            if (this.isRecording) {
                this.stopVoiceInput();
            }
        };
    }
    
    toggleVoiceInput() {
        if (this.isRecording) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }
    
    startVoiceInput() {
        if (!this.recognition) {
            this.showToast('Speech recognition not available in this browser', 'error');
            return;
        }
        
        // Check if already recording
        if (this.isRecording) {
            return;
        }

        // Disable the button briefly to avoid rapid re-invocations
        this.voiceInputBtn.disabled = true;
        
        try {
            // Check for network connectivity
            if (!navigator.onLine) {
                this.showToast('No internet connection. Speech recognition requires an active internet connection.', 'error');
                return;
            }

            // Reset retry flag before starting
            this.hasRetriedRecognition = false;
            
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            
            // Handle specific errors
            if (error.name === 'InvalidStateError') {
                // Recognition is already started, stop and restart
                this.recognition.stop();
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                        this.showToast('Failed to start voice input. Please try again.', 'error');
                    }
                }, 100);
            } else if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
                // Permission denied or no mic
                this.showToast('Microphone unavailable or permission denied. Please check your browser settings.', 'error');
            } else {
                this.showToast('Failed to start voice input. Please try again.', 'error');
            }
        } finally {
            // Re-enable the button regardless of outcome
            this.voiceInputBtn.disabled = false;
        }
    }
    
    stopVoiceInput() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.voiceInputBtn.classList.remove('recording');
        this.messageInput.placeholder = 'Type your message here...';
    }
    
    // ===== Voice Output (Text-to-Speech) Methods =====
    
    speakText(text, button) {
        // Stop any ongoing speech
        if (this.isSpeaking) {
            this.stopSpeaking();
            return;
        }
        
        // Remove markdown and HTML tags for better speech
        const cleanText = this.stripMarkdown(text);
        
        if (!cleanText.trim()) {
            this.showToast('No text to speak', 'error');
            return;
        }
        
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 1.0;
        
        // Get available voices and select a good one
        const voices = this.synthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        if (englishVoice) {
            this.currentUtterance.voice = englishVoice;
        }
        
        // Event handlers
        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            if (button) {
                button.classList.add('speaking');
            }
        };
        
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            if (button) {
                button.classList.remove('speaking');
            }
            this.currentUtterance = null;
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            if (button) {
                button.classList.remove('speaking');
            }
            this.currentUtterance = null;
        };
        
        // Speak
        this.synthesis.speak(this.currentUtterance);
    }
    
    stopSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        
        // Remove speaking class from all buttons
        document.querySelectorAll('.voice-output-btn.speaking').forEach(btn => {
            btn.classList.remove('speaking');
        });
    }
    
    stripMarkdown(text) {
        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, '');
        text = text.replace(/`[^`]+`/g, '');
        
        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Remove markdown formatting
        text = text.replace(/[*_~`#]/g, '');
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
        text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, ''); // Images
        
        // Clean up whitespace
        text = text.replace(/\n+/g, '. ');
        text = text.replace(/\s+/g, ' ');
        
        return text.trim();
    }
    
    addVoiceOutputButton(messageDiv, text) {
        // Create speaker button
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'voice-output-btn';
        speakerBtn.title = 'Read aloud';
        speakerBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
            </svg>
        `;
        
        speakerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speakText(text, speakerBtn);
        });
        
        messageDiv.appendChild(speakerBtn);
    }
}

// Initialize the chat app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});