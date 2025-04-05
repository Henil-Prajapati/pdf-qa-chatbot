document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pdf-upload');
    const uploadStatus = document.getElementById('upload-status');
    const documentsList = document.getElementById('documents-list');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatInterface = document.getElementById('chat-interface');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const processingOverlay = document.getElementById('processing-overlay');
    const processingText = document.getElementById('processing-text');

    // Backend API URL (change this to your actual API URL)
    const API_URL = 'http://localhost:8000';
    
    // Active document tracking
    let activeDocument = null;
    let uploadedDocuments = [];

    // Initialize
    function init() {
        setupEventListeners();
        checkServerHealth();
        setupNeonEffects();
    }

    // Setup neon effects
    function setupNeonEffects() {
        // Add neon hover effect to all interactive elements
        const interactiveElements = document.querySelectorAll('.document-item, .send-button, #chat-input, .upload-container');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.classList.add('neon-hover');
            });
            
            element.addEventListener('mouseleave', function() {
                this.classList.remove('neon-hover');
            });
        });

        // Add typing animation to welcome text
        const welcomeText = document.querySelector('.welcome-screen h2');
        if (welcomeText) {
            const text = welcomeText.textContent;
            welcomeText.textContent = '';
            
            let i = 0;
            const typeWriter = setInterval(() => {
                if (i < text.length) {
                    welcomeText.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typeWriter);
                }
            }, 100);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (file.type === 'application/pdf') {
                    uploadPDF(file);
                } else {
                    showUploadStatus('Please select a PDF file', 'error');
                }
            }
        });

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf') {
                    uploadPDF(file);
                } else {
                    showUploadStatus('Please drop a PDF file', 'error');
                }
            }
        });

        // Send message button
        sendButton.addEventListener('click', sendMessage);

        // Input keypress (Enter to send)
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Add neon effect to input on focus
        chatInput.addEventListener('focus', () => {
            chatInput.classList.add('neon-focus');
        });

        chatInput.addEventListener('blur', () => {
            chatInput.classList.remove('neon-focus');
        });
    }

    // Check server health
    function checkServerHealth() {
        fetch(`${API_URL}/health/`)
            .then(response => {
                if (response.ok) {
                    console.log('Server is running');
                    // Add subtle neon pulse to indicate server is running
                    document.body.classList.add('server-connected');
                } else {
                    console.error('Server health check failed');
                    showUploadStatus('Server is not responding. Please check your backend.', 'error');
                }
            })
            .catch(error => {
                console.error('Server health check error:', error);
                showUploadStatus('Cannot connect to server. Make sure your backend is running.', 'error');
            });
    }

    // Upload PDF file
    function uploadPDF(file) {
        showProcessingOverlay('Uploading document...');
        
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_URL}/upload-pdf/`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            hideProcessingOverlay();
            showUploadStatus(`Document "${file.name}" processed successfully!`, 'success');
            
            // Add document to list
            const docInfo = {
                id: data.filename,
                name: file.name
            };
            
            addDocumentToList(docInfo);
            uploadedDocuments.push(docInfo);
            
            // Set as active document
            setActiveDocument(docInfo);
        })
        .catch(error => {
            hideProcessingOverlay();
            showUploadStatus('Error uploading document: ' + error.message, 'error');
        });
    }

    // Add document to the sidebar list
    function addDocumentToList(docInfo) {
        const li = document.createElement('li');
        li.className = 'document-item';
        li.setAttribute('data-id', docInfo.id);
        li.innerHTML = `
            <i class="fas fa-file-pdf"></i>
            <span>${docInfo.name}</span>
        `;
        
        // Add neon effect on hover
        li.addEventListener('mouseenter', () => {
            li.classList.add('neon-hover');
        });
        
        li.addEventListener('mouseleave', () => {
            li.classList.remove('neon-hover');
        });
        
        li.addEventListener('click', () => {
            setActiveDocument(docInfo);
        });
        
        documentsList.appendChild(li);
        
        // Add entrance animation
        setTimeout(() => {
            li.classList.add('slide-in');
        }, 10);
    }

    // Set active document
    function setActiveDocument(docInfo) {
        activeDocument = docInfo;
        
        // Update UI
        document.querySelectorAll('.document-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.document-item[data-id="${docInfo.id}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Show chat interface with animation
        welcomeScreen.classList.add('fade-out');
        
        setTimeout(() => {
            welcomeScreen.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            chatInterface.classList.add('fade-in');
            
            // Clear previous chat
            chatMessages.innerHTML = '';
            
            // Add initial bot message with typing effect
            addBotMessageWithTyping(`I've processed "${docInfo.name}". Ask me anything about this document!`);
        }, 500);
    }

    // Send message
    function sendMessage() {
        const question = chatInput.value.trim();
        
        if (!question) return;
        if (!activeDocument) {
            showUploadStatus('Please upload a document first', 'error');
            return;
        }
        
        // Add user message to chat
        addUserMessage(question);
        
        // Clear input
        chatInput.value = '';
        
        // Show thinking animation
        const thinkingId = addBotThinkingMessage();
        
        // Send to API
        fetch(`${API_URL}/ask/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get answer');
            }
            return response.json();
        })
        .then(data => {
            // Remove thinking message
            removeMessage(thinkingId);
            
            // Add response to chat with typing effect
            addBotMessageWithTyping(data.answer, data.sources);
        })
        .catch(error => {
            // Remove thinking message
            removeMessage(thinkingId);
            
            // Add error message
            addBotMessage(`Sorry, I encountered an error: ${error.message}`);
        });
    }

    // Add user message to chat
    function addUserMessage(text) {
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user slide-up';
        messageDiv.id = messageId;
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageId;
    }

    // Add bot message to chat
    function addBotMessage(text, sources = []) {
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot slide-up';
        messageDiv.id = messageId;
        
        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="message-sources">
                    <div>Sources:</div>
                    ${sources.map(source => `
                        <div class="source-item">
                            Page ${source.page}: ${source.text}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-content">${formatText(text)}</div>
            ${sourcesHtml}
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageId;
    }

    // Add bot message with typing effect
    function addBotMessageWithTyping(text, sources = []) {
        const messageId = 'msg-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot slide-up';
        messageDiv.id = messageId;
        
        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageDiv.appendChild(messageContent);
        
        // Add sources container if needed
        let sourcesContainer = null;
        if (sources && sources.length > 0) {
            sourcesContainer = document.createElement('div');
            sourcesContainer.className = 'message-sources';
            sourcesContainer.innerHTML = '<div>Sources:</div>';
            messageDiv.appendChild(sourcesContainer);
        }
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        
        // Simulate typing effect
        let i = 0;
        const typeWriter = setInterval(() => {
            if (i < text.length) {
                messageContent.innerHTML = formatText(text.substring(0, i + 1));
                i++;
                scrollToBottom();
            } else {
                clearInterval(typeWriter);
                
                // Add sources after typing is complete
                if (sources && sources.length > 0) {
                    sources.forEach(source => {
                        const sourceItem = document.createElement('div');
                        sourceItem.className = 'source-item';
                        sourceItem.innerHTML = `Page ${source.page}: ${source.text}`;
                        sourcesContainer.appendChild(sourceItem);
                    });
                }
            }
        }, 30);
        
        return messageId;
    }

    // Add bot "thinking" message with animation
    function addBotThinkingMessage() {
        const messageId = 'msg-thinking-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot slide-up';
        messageDiv.id = messageId;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageId;
    }

    // Remove a message by ID
    function removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.classList.add('fade-out');
            setTimeout(() => {
                message.remove();
            }, 300);
        }
    }

    // Format text with markdown-like syntax
    function formatText(text) {
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        // Bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        text = text.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        
        // Inline code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return text;
    }

    // Show upload status message
    function showUploadStatus(message, type = 'info') {
        uploadStatus.className = `upload-status ${type}`;
        uploadStatus.textContent = message;
        
        // Add neon pulse effect for success
        if (type === 'success') {
            uploadStatus.classList.add('neon-pulse');
            setTimeout(() => {
                uploadStatus.classList.remove('neon-pulse');
            }, 2000);
            
            // Auto-hide after some time
            setTimeout(() => {
                uploadStatus.textContent = '';
            }, 5000);
        }
    }

    // Show processing overlay
    function showProcessingOverlay(message) {
        processingText.textContent = message;
        processingOverlay.classList.remove('hidden');
        processingOverlay.classList.add('fade-in');
    }

    // Hide processing overlay
    function hideProcessingOverlay() {
        processingOverlay.classList.add('fade-out');
        setTimeout(() => {
            processingOverlay.classList.add('hidden');
            processingOverlay.classList.remove('fade-out');
        }, 300);
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Initialize the app
    init();
}); 