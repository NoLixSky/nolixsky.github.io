document.addEventListener('DOMContentLoaded', () => {
    let chats = {};
    let currentChatId = null;
    const STORAGE_KEY = 'explow_chat_data';
    const chatHistory = document.getElementById('chat-history');
    const messagesContainer = document.getElementById('messages-container');
    const inputField = document.getElementById('input-field');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    function loadChats() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed === 'object' && parsed !== null) {
                    chats = parsed;
                }
            }
        } catch (e) {
            console.warn('Ошибка чтения localStorage, сброс данных:', e);
            chats = {};
        }
    }

    function saveChats() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch (e) {
            console.warn('Ошибка сохранения в localStorage:', e);
        }
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

            const messages = chats[id] || [];
            let title = 'Новый чат';
            if (messages.length > 0) {
                const firstUserMsg = messages.find(m => m.type === 'user');
                if (firstUserMsg) {
                    title = firstUserMsg.text.length > 25 ? firstUserMsg.text.substring(0, 25) + '...' : firstUserMsg.text;
                }
            }

            const chatText = document.createElement('span');
            chatText.className = 'chat-text';
            chatText.innerText = title;
            
            const dotsWrapper = document.createElement('div');
            dotsWrapper.className = 'dots-wrapper';
            
            const dots = document.createElement('span');
            dots.className = 'menu-dots';
            dots.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                </svg>
            `;

            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu';
            dropdown.innerHTML = `
                <div class="dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Удалить чат
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

            const deleteBtn = dropdown.querySelector('.dropdown-item');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                delete chats[id];
                saveChats();
                renderSidebar();
                renderMessages();
            });
        });
    }

    function renderMessages() {
        messagesContainer.innerHTML = '';
        
        if (!currentChatId || !chats[currentChatId] || chats[currentChatId].length === 0) {
            const greetingWrapper = document.createElement('div');
            greetingWrapper.className = 'greeting-wrapper';
            greetingWrapper.innerHTML = `<div class="greeting-text">Чем я могу вам помочь?</div>`;
            messagesContainer.appendChild(greetingWrapper);
            return;
        }

        const chatMessages = chats[currentChatId];
        chatMessages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${msg.type}`;

            const sender = document.createElement('div');
            sender.className = 'message-sender';
            sender.innerText = msg.type === 'user' ? 'Вы' : 'explow';
            wrapper.appendChild(sender);

            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.type}`;
            msgDiv.innerText = msg.text;
            wrapper.appendChild(msgDiv);

            messagesContainer.appendChild(wrapper);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function createNewChat() {
        const newId = 'chat_' + Date.now();
        chats[newId] = [];
        currentChatId = newId;
        saveChats();
        renderSidebar();
        renderMessages();
        inputField.focus();
    }

    function addMessageToCurrentChat(type, text) {
        if (!currentChatId || !chats[currentChatId]) return;
        chats[currentChatId].push({ type, text });
        saveChats();
        renderMessages();
        renderSidebar();
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

        addMessageToCurrentChat('user', text);
        inputField.value = '';

        addTypingIndicator();

        // ВНИМАНИЕ: Здесь заглушка. В финальной версии замените этот блок на fetch запрос к вашему Cloudflare Worker + Groq!
        setTimeout(() => {
            removeTypingIndicator();
            const aiText = "Привет! Это реальный многопоточный чат с сохранением истории. В следующей версии я подключусь к настоящему ИИ (Llama 3 через Groq) по твоему запросу!";
            addMessageToCurrentChat('ai', aiText);
        }, 1200);
    }

    loadChats();
    if (Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        const ids = Object.keys(chats);
        currentChatId = ids[0];
        renderSidebar();
        renderMessages();
    }

    newChatBtn.addEventListener('click', createNewChat);
    sendBtn.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
});
