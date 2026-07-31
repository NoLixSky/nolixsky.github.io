function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error(err); }
    document.body.removeChild(textArea);
}

window.copyCode = function(btnElement) {
    const wrapper = btnElement.closest('.code-block-wrapper');
    const codeElement = wrapper.querySelector('pre code');
    if (codeElement) {
        const textToCopy = codeElement.innerText;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = btnElement.innerHTML;
                btnElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Скопировано!`;
                setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
            }).catch(() => { fallbackCopyTextToClipboard(textToCopy); });
        } else {
            fallbackCopyTextToClipboard(textToCopy);
            const originalText = btnElement.innerHTML;
            btnElement.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Скопировано!`;
            setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ EXPLOW: Скрипт полностью загружен!");
    
    let chats = {};
    let currentChatId = null;
    let pendingChatActionId = null;

    const STORAGE_KEY = 'explow_chat_data';
    const chatHistory = document.getElementById('chat-history');
    const messagesContainer = document.getElementById('messages-container');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHeader = document.getElementById('chat-header');
    const inputField = document.getElementById('input-field');
    const WORKER_URL = 'https://explow-proxy.avatarsale75.workers.dev';

    let isLoggedIn = false;

    const savedUser = localStorage.getItem('explow_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            document.getElementById('user-name').innerText = userData.username;
            document.getElementById('user-avatar').innerText = userData.avatar;
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('user-profile').style.display = 'flex';
            isLoggedIn = true;
        } catch (e) { console.error("Ошибка восстановления профиля:", e); }
    }

    function loadChats() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    chats = parsed;
                    for (const key in chats) {
                        if (Array.isArray(chats[key])) {
                            chats[key] = { title: 'Новый чат', messages: chats[key] };
                        }
                    }
                }
            }
        } catch (e) { console.error("Ошибка загрузки чатов:", e); chats = {}; }
    }

    function saveChats() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch (e) { console.error("Ошибка сохранения:", e); }
    }

    function renderSidebar() {
        chatHistory.innerHTML = '';
        const ids = Object.keys(chats);
        if (ids.length === 0) {
            currentChatId = null;
        } else if (!currentChatId || !chats[currentChatId]) {
            currentChatId = ids[0];
        }

        ids.forEach(id => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (id === currentChatId) chatItem.classList.add('active');

            const chatData = chats[id];
            let title = chatData.title || 'Новый чат';
            if (!chatData.title && chatData.messages && chatData.messages.length > 0) {
                const firstUserMsg = chatData.messages.find(m => m.type === 'user');
                if (firstUserMsg) {
                    title = firstUserMsg.text.length > 25 ? firstUserMsg.text.substring(0, 25) + '...' : firstUserMsg.text;
                    chatData.title = title;
                    saveChats();
                }
            }

            const chatText = document.createElement('span');
            chatText.className = 'chat-text';
            chatText.innerText = title;
            
            const dotsWrapper = document.createElement('div');
            dotsWrapper.className = 'dots-wrapper';
            const dots = document.createElement('span');
            dots.className = 'menu-dots';
            dots.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>`;

            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu';
            dropdown.innerHTML = `
                <div class="dropdown-item" data-action="rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Переименовать
                </div>
                <div class="dropdown-item delete" data-action="delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Удалить
                </div>
            `;

            dotsWrapper.appendChild(dots);
            dotsWrapper.appendChild(dropdown);
            chatItem.appendChild(chatText);
            chatItem.appendChild(dotsWrapper);
            chatHistory.appendChild(chatItem);

            dots.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
                dropdown.classList.toggle('open');
            });

            chatItem.addEventListener('click', () => {
                document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
                chatItem.classList.add('active');
                dropdown.classList.remove('open');
                currentChatId = id;
                renderMessages();
            });

            const deleteBtn = dropdown.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('open');
                pendingChatActionId = id;
                document.getElementById('modal-delete').classList.add('active');
            });

            const renameBtn = dropdown.querySelector('[data-action="rename"]');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('open');
                pendingChatActionId = id;
                const currentTitle = chats[id].title || 'Новый чат';
                document.getElementById('modal-rename-input').value = currentTitle;
                document.getElementById('modal-rename').classList.add('active');
            });

            document.addEventListener('click', (e) => {
                if (!chatItem.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });
        });
    }

    function formatMessageContent(text) {
        if (!text) return '';
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const parts = text.split(/(```[\s\S]*?```)/g);
        let formatted = '';
        parts.forEach(part => {
            const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
            if (codeMatch) {
                const lang = codeMatch[1] || 'plaintext';
                const codeContent = codeMatch[2];
                const displayLang = lang === 'javascript' ? 'JavaScript' : lang.toUpperCase();
                
                formatted += `
                <div class="code-block-wrapper">
                    <div class="code-header">
                        <span class="code-lang">${displayLang}</span>
                        <button class="copy-btn" onclick="copyCode(this)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Копировать
                        </button>
                    </div>
                    <pre><code class="language-${lang}">${codeContent}</code></pre>
                </div>`;
            } else {
                formatted += part.replace(/\n/g, '<br>');
            }
        });
        return formatted;
    }

    function renderMessages() {
        messagesContainer.innerHTML = '';
        
        if (!currentChatId || !chats[currentChatId] || !chats[currentChatId].messages || chats[currentChatId].messages.length === 0) {
            if (chatHeader) chatHeader.style.display = 'flex';
            const greetingWrapper = document.createElement('div');
            greetingWrapper.className = 'greeting-wrapper';
            greetingWrapper.innerHTML = `<div class="greeting-text">Чем я могу вам помочь?</div>`;
            messagesContainer.appendChild(greetingWrapper);
            return;
        } else {
            if (chatHeader) chatHeader.style.display = 'none';
        }

        const chatMessages = chats[currentChatId].messages;
        chatMessages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${msg.type}`;
            const sender = document.createElement('div');
            sender.className = 'message-sender';
            sender.innerText = msg.type === 'user' ? 'Вы' : 'explow';
            wrapper.appendChild(sender);
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.type}`;
            msgDiv.innerHTML = formatMessageContent(msg.text);
            wrapper.appendChild(msgDiv);
            messagesContainer.appendChild(wrapper);
        });

        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function createNewChat() {
        const newId = 'chat_' + Date.now();
        chats[newId] = { title: 'Новый чат', messages: [] };
        currentChatId = newId;
        saveChats();
        renderSidebar();
        renderMessages();
        inputField.focus();
    }

    function addMessageToCurrentChat(type, text) {
        if (!currentChatId || !chats[currentChatId]) return false;
        if (!chats[currentChatId].messages) chats[currentChatId].messages = [];
        chats[currentChatId].messages.push({ type, text });
        if (type === 'user' && !chats[currentChatId].title) {
            const short = text.length > 25 ? text.substring(0, 25) + '...' : text;
            chats[currentChatId].title = short;
        }
        saveChats();
        renderMessages();
        renderSidebar();
        return true;
    }

    function addTypingIndicator() {
        const existing = document.getElementById('typing-wrapper');
        if(existing) existing.remove();
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper ai';
        wrapper.id = 'typing-wrapper';
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        sender.innerText = 'explow';
        wrapper.appendChild(sender);
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            indicator.appendChild(dot);
        }
        wrapper.appendChild(indicator);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const wrapper = document.getElementById('typing-wrapper');
        if (wrapper) wrapper.remove();
    }

    function handleSendMessage() {
        const text = inputField.value.trim();
        if (!text || !currentChatId) return;

        if (!isLoggedIn) {
            addMessageToCurrentChat('ai', '⚠️ Пожалуйста, сначала зарегистрируйтесь (нажмите кнопку "Вход" внизу слева), чтобы пользоваться ИИ.');
            inputField.value = '';
            return;
        }

        addMessageToCurrentChat('user', text);
        inputField.value = '';
        addTypingIndicator();

        if (window.location.protocol === 'file:') {
            setTimeout(() => {
                removeTypingIndicator();
                const mockFallback = `Здесь вы можете увидеть поддержку кода для разных языков:\n\n\`\`\`html\n<h1>Привет, это EXPLOW AI!</h1>\n<p>Это работает!</p>\n\`\`\`\n\n\`\`\`css\nbody {\n  background: black;\n  color: white;\n}\n\`\`\`\n\n\`\`\`javascript\nconsole.log("Этот код работает с красивой подсветкой!");\n\`\`\``;
                addMessageToCurrentChat('ai', mockFallback);
            }, 500);
            return;
        }

        fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return response.json();
        })
        .then(data => {
            removeTypingIndicator();
            const aiText = data.choices && data.choices.length > 0 
                ? data.choices[0].message.content 
                : "⚠️ Сервер вернул пустой ответ.";
            addMessageToCurrentChat('ai', aiText);
        })
        .catch(error => {
            removeTypingIndicator();
            addMessageToCurrentChat('ai', `❌ Ошибка связи с Cloudflare: ${error.message}`);
        });
    }

    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
        pendingChatActionId = null;
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });

    document.getElementById('logout-btn').addEventListener('click', function() {
        document.getElementById('modal-logout').classList.add('active');
    });
    document.getElementById('modal-logout-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-logout-confirm').addEventListener('click', function() {
        localStorage.removeItem('explow_user');
        isLoggedIn = false;
        document.getElementById('user-profile').style.display = 'none';
        document.getElementById('login-btn').style.display = 'flex';
        closeModal();
    });

    document.getElementById('modal-delete-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-delete-confirm').addEventListener('click', function() {
        if (pendingChatActionId) {
            delete chats[pendingChatActionId];
            pendingChatActionId = null;
            saveChats();
            renderSidebar();
            renderMessages();
        }
        closeModal();
    });

    document.getElementById('modal-rename-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-rename-confirm').addEventListener('click', function() {
        const input = document.getElementById('modal-rename-input');
        const newTitle = input.value.trim();
        if (pendingChatActionId && newTitle !== '') {
            chats[pendingChatActionId].title = newTitle;
            pendingChatActionId = null;
            saveChats();
            renderSidebar();
        }
        closeModal();
    });

    document.getElementById('auth-submit-btn').addEventListener('click', function() {
        const email = document.getElementById('auth-email').value.trim();
        if (!email) {
            alert('Пожалуйста, введите Email');
            return;
        }
        const name = email.split('@')[0];
        const avatarLetter = name.charAt(0).toUpperCase();
        const userData = { username: name, email: email, avatar: avatarLetter };
        localStorage.setItem('explow_user', JSON.stringify(userData));
        isLoggedIn = true;

        document.getElementById('user-name').innerText = name;
        document.getElementById('user-avatar').innerText = avatarLetter;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-chat-view').style.display = 'flex';
        document.getElementById('sidebar').style.display = 'flex';
    });

    document.getElementById('profile-dots').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.profile-dots-wrapper')) {
            document.getElementById('profile-dropdown').classList.remove('open');
        }
    });

    loadChats();
    if (Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        const ids = Object.keys(chats);
        currentChatId = ids[0];
        renderSidebar();
        renderMessages();
    }

    document.getElementById('login-btn').addEventListener('click', function() {
        document.getElementById('main-chat-view').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('sidebar').style.display = 'none';
    });

    newChatBtn.addEventListener('click', createNewChat);
    sendBtn.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });
});
