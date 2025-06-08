// JavaScript code for Ollama Chat UI
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendBtn = document.getElementById('send-btn');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileUploadInput = document.getElementById('file-upload');
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imageUploadInput = document.getElementById('image-upload');
    const attachmentsContainer = document.getElementById('attachments');
    const confirmationModal = document.getElementById('confirmation-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const historyBtn = document.querySelector('button:has(i.fas.fa-history)'); // Fixed selector
    const modelSelect = document.getElementById('model-select');
    const modelLoadingSpinner = document.getElementById('model-loading-spinner');
    const endpointInput = document.getElementById('ollama-endpoint');
    const connectedFilesList = document.getElementById('connected-files-list');
    const addFilesBtn = document.getElementById('add-files-btn');
    const addFilesInput = document.getElementById('add-files-input');
    let ollamaEndpoint = ""; // Store endpoint globally
    let fetchTimeout = null;

    // Track selected model
    let selectedModel = "";

    // Update selectedModel when user selects a model
    modelSelect.addEventListener('change', function() {
        selectedModel = modelSelect.value;
    });

    // Helper to populate model dropdown
    function populateModelSelect(models, selected) {
        if (!models || models.length === 0) {
            modelSelect.innerHTML = `<option>None</option>`;
            selectedModel = "";
            return;
        }
        modelSelect.innerHTML = models.map(m =>
            `<option value="${m.value || m.name}">${m.name}</option>`
        ).join('');
        if (selected) {
            modelSelect.value = selected;
            selectedModel = selected;
        } else {
            modelSelect.selectedIndex = 0;
            selectedModel = modelSelect.value;
        }
    }

    // Show "None (add Ollama endpoint)" if no endpoint
    function showNoneAddEndpoint() {
        modelSelect.innerHTML = `<option>None (add Ollama endpoint)</option>`;
    }

    // Fetch models from Ollama endpoint with timeout
    function fetchOllamaModels(endpoint) {
        if (!endpoint) {
            showNoneAddEndpoint();
            return;
        }
        // Prevent multiple fetches if already loaded
        if (modelsLoaded) return;
        modelSelect.innerHTML = `<option>Loading...</option>`;
        modelLoadingSpinner.classList.remove('hidden');

        // Timeout logic
        if (fetchTimeout) clearTimeout(fetchTimeout);
        let didTimeout = false;
        fetchTimeout = setTimeout(() => {
            didTimeout = true;
            modelLoadingSpinner.classList.add('hidden');
            showNoneAddEndpoint();
        }, 10000);

        fetch(endpoint + '/api/tags')
            .then(res => res.json())
            .then(data => {
                if (didTimeout) return;
                clearTimeout(fetchTimeout);
                modelLoadingSpinner.classList.add('hidden');
                if (data && Array.isArray(data.models) && data.models.length > 0) {
                    const ollamaModels = data.models.map(m => ({
                        name: m.name,
                        value: m.name
                    }));
                    populateModelSelect(ollamaModels);
                    modelsLoaded = true;
                } else {
                    modelSelect.innerHTML = `<option>None</option>`;
                }
            })
            .catch(() => {
                if (didTimeout) return;
                clearTimeout(fetchTimeout);
                modelLoadingSpinner.classList.add('hidden');
                modelSelect.innerHTML = `<option>None</option>`;
            });
    }

    // Settings modal logic
    const settingsModal = document.getElementById('settings-modal');
    const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    sidebarSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
    });
    closeSettingsModal.addEventListener('click', closeSettings);
    cancelSettingsBtn.addEventListener('click', closeSettings);
    function closeSettings() {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
    }

    saveSettingsBtn.addEventListener('click', () => {
        closeSettings();
        ollamaEndpoint = endpointInput.value.trim().replace(/\/$/, '');
        if (!ollamaEndpoint) {
            showNoneAddEndpoint();
            return;
        }
        fetchOllamaModels(ollamaEndpoint);
    });

    // Fetch models only once per page load
    let modelsLoaded = false;

    function fetchOllamaModels(endpoint) {
        if (!endpoint) {
            showNoneAddEndpoint();
            return;
        }
        // Prevent multiple fetches if already loaded
        if (modelsLoaded) return;
        modelSelect.innerHTML = `<option>Loading...</option>`;
        modelLoadingSpinner.classList.remove('hidden');

        // Timeout logic
        if (fetchTimeout) clearTimeout(fetchTimeout);
        let didTimeout = false;
        fetchTimeout = setTimeout(() => {
            didTimeout = true;
            modelLoadingSpinner.classList.add('hidden');
            showNoneAddEndpoint();
        }, 10000);

        fetch(endpoint + '/api/tags')
            .then(res => res.json())
            .then(data => {
                if (didTimeout) return;
                clearTimeout(fetchTimeout);
                modelLoadingSpinner.classList.add('hidden');
                if (data && Array.isArray(data.models) && data.models.length > 0) {
                    const ollamaModels = data.models.map(m => ({
                        name: m.name,
                        value: m.name
                    }));
                    populateModelSelect(ollamaModels);
                    modelsLoaded = true;
                } else {
                    modelSelect.innerHTML = `<option>None</option>`;
                }
            })
            .catch(() => {
                if (didTimeout) return;
                clearTimeout(fetchTimeout);
                modelLoadingSpinner.classList.add('hidden');
                modelSelect.innerHTML = `<option>None</option>`;
            });
    }

    // Only fetch models on page load or when endpoint changes
    endpointInput.addEventListener('input', function() {
        modelsLoaded = false;
    });

    // On page load, check if endpoint input has a value
    ollamaEndpoint = endpointInput.value.trim().replace(/\/$/, '');
    if (ollamaEndpoint) {
        fetchOllamaModels(ollamaEndpoint);
    } else {
        showNoneAddEndpoint();
    }

    // Auto-resize text area
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Send message functionality (update to use selectedModel)
    sendBtn.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (!message) return;
        if (!selectedModel || selectedModel === "None" || selectedModel === "None (add Ollama endpoint)") {
            alert("Please select a model before sending a message.");
            return;
        }
        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Call Ollama API for chat completion
        if (ollamaEndpoint) {
            // Show loading spinner or "Assistant is typing..." message
            const loadingDiv = document.createElement('div');
            loadingDiv.className = "animate-fade-in max-w-3xl w-full";
            loadingDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full">
                        <i class="fas fa-robot text-primary"></i>
                    </div>
                    <div class="flex-1 bg-gray-100 rounded-xl rounded-tl-none p-4">
                        <p class="font-medium text-gray-700 mb-2">Ollama Assistant</p>
                        <p class="text-gray-700" id="assistant-msg">
                            <span class="ollama-spinner"></span> Thinking...
                        </p>
                    </div>
                </div>
            `;
            chatMessages.appendChild(loadingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Track if user has scrolled up (for scroll-to-bottom button)
            let userScrolledUp = false;
            let scrollBtn = document.getElementById('scroll-to-bottom-btn');
            if (!scrollBtn) {
                scrollBtn = document.createElement('button');
                scrollBtn.id = 'scroll-to-bottom-btn';
                scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
                // Center horizontally at the bottom of the chat area
                scrollBtn.style.position = 'fixed';
                scrollBtn.style.left = '50%';
                scrollBtn.style.transform = 'translateX(-50%)';
                scrollBtn.style.bottom = '100px';
                scrollBtn.style.zIndex = 50;
                scrollBtn.style.display = 'none';
                scrollBtn.className = 'bg-primary text-white rounded-full p-2 shadow hover:bg-blue-700 transition';
                scrollBtn.onclick = () => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    userScrolledUp = false;
                    scrollBtn.style.display = 'none';
                };
                document.body.appendChild(scrollBtn);
            }

            chatMessages.addEventListener('scroll', function() {
                // If user is not at the bottom, show scroll button
                if (chatMessages.scrollTop + chatMessages.clientHeight < chatMessages.scrollHeight - 40) {
                    userScrolledUp = true;
                    scrollBtn.style.display = 'block';
                } else {
                    userScrolledUp = false;
                    scrollBtn.style.display = 'none';
                }
            });

            fetch(`${ollamaEndpoint}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Add Authorization header if using API key
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: "user", content: message }
                    ]
                })
            })
            .then(async res => {
                const reader = res.body.getReader();
                let decoder = new TextDecoder();
                let buffer = '';
                let assistantMessage = '';
                let isDone = false;
                let assistantMsgDiv = loadingDiv.querySelector('#assistant-msg');
                let gotFirstChunk = false;

                // For instant code block rendering
                let codeBlockOpen = false;
                let codeBlockLang = '';
                let codeBlockBuffer = '';
                let codeBlockId = '';

                function renderStreamingMarkdown(text) {
                    // Streaming markdown: render code blocks as soon as they start
                    let html = '';
                    let lines = text.split('\n');
                    let inCode = false;
                    let codeLang = '';
                    let codeId = '';
                    let codeLines = [];
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        let codeMatch = line.match(/^```(\w*)/);
                        if (codeMatch) {
                            if (!inCode) {
                                // Start code block
                                inCode = true;
                                codeLang = codeMatch[1] || '';
                                codeId = 'code-' + Math.random().toString(36).substr(2, 9);
                                codeLines = [];
                            } else {
                                // End code block
                                inCode = false;
                                html += `
<div class="relative group my-3">
    <button onclick="copyCodeToClipboard('${codeId}', this)" class="absolute top-2 right-2 z-10 bg-gray-200 hover:bg-primary text-xs px-2 py-1 rounded opacity-80 group-hover:opacity-100 transition">Copy</button>
    <pre class="overflow-x-auto rounded bg-gray-900 text-gray-100 p-4 text-sm mb-0"><code id="${codeId}" class="language-${codeLang}">${codeLines.join('\n').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>
</div>
                                `;
                                codeLang = '';
                                codeId = '';
                                codeLines = [];
                            }
                            continue;
                        }
                        if (inCode) {
                            codeLines.push(line);
                        } else {
                            // Render markdown for normal lines (simple, no extra <br> after paragraphs)
                            if (line.trim() === '') {
                                html += '<div style="height:0.5em"></div>';
                            } else {
                                // Headings, bold, italic, inline code
                                let l = line
                                    .replace(/^### (.*)$/, '<h3 class="font-bold mt-3 mb-2">$1</h3>')
                                    .replace(/^## (.*)$/, '<h2 class="font-bold mt-3 mb-2">$1</h2>')
                                    .replace(/^# (.*)$/, '<h1 class="font-bold mt-3 mb-2">$1</h1>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
                                html += `<div class="mb-1">${l}</div>`;
                            }
                        }
                    }
                    // If code block is still open, render it as incomplete
                    if (inCode && codeLines.length > 0) {
                        html += `
<div class="relative group my-3">
    <button onclick="copyCodeToClipboard('${codeId}', this)" class="absolute top-2 right-2 z-10 bg-gray-200 hover:bg-primary text-xs px-2 py-1 rounded opacity-80 group-hover:opacity-100 transition">Copy</button>
    <pre class="overflow-x-auto rounded bg-gray-900 text-gray-100 p-4 text-sm mb-0"><code id="${codeId}" class="language-${codeLang}">${codeLines.join('\n').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>
</div>
                        `;
                    }
                    return html;
                }

                while (!isDone) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    // Process each complete line (NDJSON)
                    let lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line for next chunk

                    for (let line of lines) {
                        line = line.trim();
                        if (!line) continue;
                        let data;
                        try {
                            data = JSON.parse(line);
                        } catch {
                            continue;
                        }
                        if (data && data.message && typeof data.message.content === 'string') {
                            assistantMessage += data.message.content;
                            gotFirstChunk = true;
                            if (assistantMsgDiv) {
                                assistantMsgDiv.innerHTML = renderStreamingMarkdown(assistantMessage) +
                                    (isDone ? '' : ' <span class="ollama-spinner"></span>');
                            }
                            // Auto-scroll if user is not scrolled up
                            if (!userScrolledUp) {
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                        }
                        if (data.done) {
                            isDone = true;
                        }
                    }
                    if (!gotFirstChunk && assistantMsgDiv) {
                        assistantMsgDiv.innerHTML = `<span class="ollama-spinner"></span> Thinking...`;
                    }
                }
                // After streaming is done, remove spinner and show final message
                if (!assistantMessage) {
                    if (assistantMsgDiv) {
                        assistantMsgDiv.innerHTML = `<span class="ollama-spinner"></span> Thinking...`;
                    }
                    addMessage("No response from model.", 'assistant');
                    loadingDiv.remove();
                } else {
                    if (assistantMsgDiv) {
                        assistantMsgDiv.innerHTML = renderStreamingMarkdown(assistantMessage);
                    }
                }
            })
            .catch(err => {
                loadingDiv.remove();
                addMessage("Error contacting Ollama API.", 'assistant');
            });
        } else {
            addMessage("No Ollama endpoint configured.", 'assistant');
        }
    });
    
    // Handle Enter key
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
    
    // File upload functionality
    fileUploadBtn.addEventListener('click', () => fileUploadInput.click());
    fileUploadInput.addEventListener('change', handleFileUpload);
    
    // Image upload functionality
    imageUploadBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', handleImageUpload);
    
    // Confirmation modal actions
    cancelBtn.addEventListener('click', () => confirmationModal.classList.add('hidden'));
    confirmBtn.addEventListener('click', () => {
        alert('Action confirmed! (In a real app, this would execute the operation)');
        confirmationModal.classList.add('hidden');
    });
    
    // History button functionality
    if (historyBtn) {
        historyBtn.addEventListener('click', function() {
            document.getElementById('confirmation-title').textContent = 'Clear Conversation?';
            document.getElementById('confirmation-text').textContent = 'Are you sure you want to clear this conversation? This action cannot be undone.';
            confirmationModal.classList.remove('hidden');
            confirmationModal.classList.add('flex');
        });
    }

    // Functions
    function addMessage(message, sender) {
        if (!message) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `animate-fade-in max-w-3xl w-full ${sender === 'user' ? 'ml-auto' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="flex items-start gap-3">
                ${sender === 'user' ? 
                `<div class="flex-1 bg-primary-100 rounded-xl rounded-tr-none p-4">
                    <p class="font-medium text-primary mb-2">You</p>
                    <p class="text-gray-700">${message}</p>
                </div>
                <div class="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-full">
                    <i class="fas fa-user text-primary"></i>
                </div>` : 
                `<div class="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full">
                    <i class="fas fa-robot text-primary"></i>
                </div>
                <div class="flex-1 bg-gray-100 rounded-xl rounded-tl-none p-4">
                    <p class="font-medium text-gray-700 mb-2">Ollama Assistant</p>
                    <p class="text-gray-700">${message}</p>
                </div>`}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function handleFileUpload(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileDiv = document.createElement('div');
            fileDiv.className = 'flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg';
            fileDiv.innerHTML = `
                <i class="${getFileIcon(file.name)}"></i>
                <span class="text-sm">${file.name}</span>
                <button class="ml-1 text-blue-500 hover:text-blue-700">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            const removeBtn = fileDiv.querySelector('button');
            removeBtn.addEventListener('click', () => fileDiv.remove());
            
            attachmentsContainer.appendChild(fileDiv);
            e.target.value = ''; // Reset file input
        }
    }
    
    function handleImageUpload(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            const objectUrl = URL.createObjectURL(file);
            
            const imgPreview = document.createElement('div');
            imgPreview.className = 'rounded-lg overflow-hidden w-56 relative group';
            imgPreview.innerHTML = `
                <img src="${objectUrl}" alt="${file.name}" class="w-full h-auto object-cover rounded-lg">
                <p class="text-xs text-gray-500 mt-1">${file.name}</p>
                <button class="absolute top-1 right-1 bg-white/50 hover:bg-white/80 rounded-full w-6 h-6 flex items-center justify-center">
                    <i class="fas fa-times text-red-600"></i>
                </button>
            `;
            
            const removeBtn = imgPreview.querySelector('button');
            removeBtn.addEventListener('click', () => {
                URL.revokeObjectURL(objectUrl);
                imgPreview.remove();
            });
            
            attachmentsContainer.appendChild(imgPreview);
            e.target.value = ''; // Reset file input
        }
    }
    
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return 'fas fa-image text-blue-500';
        } else if (['pdf'].includes(ext)) {
            return 'fas fa-file-pdf text-red-500';
        } else if (['doc', 'docx'].includes(ext)) {
            return 'fas fa-file-word text-blue-600';
        } else if (['xls', 'xlsx'].includes(ext)) {
            return 'fas fa-file-excel text-green-500';
        } else if (['ppt', 'pptx'].includes(ext)) {
            return 'fas fa-file-powerpoint text-orange-500';
        } else if (['zip', 'rar', '7z'].includes(ext)) {
            return 'fas fa-file-archive text-yellow-600';
        } else {
            return 'fas fa-file text-gray-500';
        }
    }
    
    // Initialize - show confirmation modal with proper display type
    confirmationModal.classList.add('hidden');
    confirmationModal.classList.remove('hidden');
    confirmationModal.classList.add('flex');
    confirmationModal.classList.add('hidden');

    const connectionStatus = document.getElementById('ollama-connection-status');
    const connectionDot = document.getElementById('ollama-connection-dot');

    function setConnectionStatus(connected) {
        if (connected) {
            connectionStatus.className = "bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
            connectionDot.className = "h-2 w-2 bg-green-600 rounded-full animate-pulse";
            connectionStatus.innerHTML = `<div id="ollama-connection-dot" class="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>Connected`;
        } else {
            connectionStatus.className = "bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
            connectionDot.className = "h-2 w-2 bg-red-600 rounded-full";
            connectionStatus.innerHTML = `<div id="ollama-connection-dot" class="h-2 w-2 bg-red-600 rounded-full"></div>Disconnected`;
        }
    }

    // Check Ollama endpoint connection
    function checkOllamaConnection(endpoint) {
        if (!endpoint) {
            setConnectionStatus(false);
            return;
        }
        fetch(endpoint + '/api/tags', { method: 'GET' })
            .then(res => {
                if (res.ok) setConnectionStatus(true);
                else setConnectionStatus(false);
            })
            .catch(() => setConnectionStatus(false));
    }

    // Update connection status on settings save and on page load
    saveSettingsBtn.addEventListener('click', () => {
        ollamaEndpoint = endpointInput.value.trim().replace(/\/$/, '');
        checkOllamaConnection(ollamaEndpoint);
    });

    // On page load
    ollamaEndpoint = endpointInput.value.trim().replace(/\/$/, '');
    checkOllamaConnection(ollamaEndpoint);

    // State for connected files
    let connectedFiles = [];

    // Render connected files
    function renderConnectedFiles() {
        connectedFilesList.innerHTML = '';
        connectedFiles.forEach((file, idx) => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg';
            fileDiv.innerHTML = `
                <i class="${getFileIcon(file.name)}"></i>
                <div>
                    <p class="text-sm font-medium truncate w-40">${file.name}</p>
                    <p class="text-xs text-gray-500">${file.info || ''}</p>
                </div>
                <button class="ml-auto text-gray-400 hover:text-red-500" data-idx="${idx}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            // Remove file handler
            fileDiv.querySelector('button').addEventListener('click', () => {
                connectedFiles.splice(idx, 1);
                renderConnectedFiles();
            });
            connectedFilesList.appendChild(fileDiv);
        });
    }

    // Add files button logic
    addFilesBtn.addEventListener('click', () => {
        addFilesInput.click();
    });

    addFilesInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            connectedFiles.push({
                name: file.name,
                info: file.size ? (file.size > 10000 ? `${Math.round(file.size/1024)} KB` : `${file.size} bytes`)
                    : '', // You can enhance info extraction as needed
            });
        });
        renderConnectedFiles();
        e.target.value = '';
    });

    // Optionally, call renderConnectedFiles() on load if you want to restore from storage
});

// Add this helper function at the end of your file (before the last closing });
function renderMarkdownWithCopy(text) {
    // Minimal markdown renderer with code block support and copy button
    // 1. Extract code blocks and replace with placeholders
    let codeBlocks = [];
    let html = text.replace(/```(\w*)\s*([\s\S]*?)```/g, function(_, lang, code) {
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
        codeBlocks.push({
            id: codeId,
            lang: lang || '',
            code: code
        });
        return `[[CODEBLOCK_${codeId}]]`;
    });

    // Escape HTML for the rest
    html = html
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Headings, bold, italic, inline code, lists, line breaks
    html = html
        .replace(/^### (.*)$/gm, '<h3 class="font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*)$/gm, '<h2 class="font-bold mt-4 mb-2">$1</h2>')
        .replace(/^# (.*)$/gm, '<h1 class="font-bold mt-4 mb-2">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>');

    // Restore code blocks with copy button
    for (const block of codeBlocks) {
        const codeHtml = `
<div class="relative group my-4">
    <button onclick="navigator.clipboard.writeText(document.getElementById('${block.id}').innerText)" class="absolute top-2 right-2 z-10 bg-gray-200 hover:bg-primary text-xs px-2 py-1 rounded opacity-80 group-hover:opacity-100 transition">Copy</button>
    <pre class="overflow-x-auto rounded bg-gray-900 text-gray-100 p-4 text-sm"><code id="${block.id}" class="language-${block.lang}">${block.code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>
</div>
        `;
        html = html.replace(`[[CODEBLOCK_${block.id}]]`, codeHtml);
    }

    return html;
}

// Add this helper function at the end of your file (before the last closing });
function copyCodeToClipboard(codeId, btn) {
    const codeElem = document.getElementById(codeId);
    if (!codeElem) return;
    navigator.clipboard.writeText(codeElem.innerText).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = "Copied!";
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.disabled = false;
        }, 1200);
    });
}