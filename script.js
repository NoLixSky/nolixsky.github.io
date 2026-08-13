// Универсальная функция копирования
function fallbackCopy(text, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ Скопировано';
        setTimeout(() => btn.innerHTML = orig, 2000);
    } catch (err) {
        console.error('Ошибка копирования', err);
    }
    document.body.removeChild(textarea);
}

window.copyToClipboard = function(btn, text) {
    if (!text) {
        const card = btn.closest('.ai-card');
        const contentEl = card.querySelector('.ai-content');
        text = contentEl.innerText;
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '✅ Скопировано';
            setTimeout(() => btn.innerHTML = orig, 2000);
        }).catch(() => {
            fallbackCopy(text, btn);
        });
    } else {
        fallbackCopy(text, btn);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Чат загружен!");

    const chatArea = document.getElementById('chat-area');
    const inputField = document.getElementById('input-field');
    const sendBtn = document.getElementById('send-btn');
    const modelFast = document.getElementById('model-fast');
    const modelExpert = document.getElementById('model-expert');
    const recentChatsList = document.getElementById('recent-chats-list');
    const mainContainer = document.getElementById('main-content');

    let currentModel = 'Быстрый';
    let isChatActive = false;
    let recentChats = [];

    // ================================================================
    // ВАШИ РАБОЧИЕ АДРЕСА CLOUDFLARE WORKERS
    // ================================================================
    const WORKER_URL_QUICK = 'https://explow-proxy.avatarsale75.workers.dev/';
    const WORKER_URL_EXPERT = 'https://explow-proxy-expert.avatarsale75.workers.dev/';

    // ================================================================

    // ЗАГРУЗКА ПРОФИЛЯ ИЗ LOCALSTORAGE
    const savedUser = localStorage.getItem('explow_user');
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            document.getElementById('profile-name').textContent = userData.username || 'Explow User';
            const avatarLetter = userData.avatar || (userData.username ? userData.username.charAt(0).toUpperCase() : 'E');
            document.getElementById('profile-avatar').textContent = avatarLetter;
        } catch(e) { console.log("Ошибка загрузки профиля"); }
    }

    // ================================================================
    // ФУНКЦИЯ СБРОСА (возвращает логотип и кнопки, скрывает чат)
    // ================================================================
    window.resetChat = function() {
        chatArea.innerHTML = '';
        // Показываем главный экран (лого + кнопки), скрываем чат
        mainContainer.style.display = 'flex';
        chatArea.style.display = 'none';
        chatArea.classList.remove('active');
        isChatActive = false;
        inputField.value = '';
        inputField.placeholder = 'Введите запрос...';

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const title = `Чат ${recentChats.length + 1}`;
        recentChats.unshift({ title: title, time: timeStr });
        renderRecentChats();
    };

    function renderRecentChats() {
        recentChatsList.innerHTML = '';
        recentChats.slice(0, 10).forEach(chat => {
            const el = document.createElement('div');
            el.className = 'recent-chat-item';
            el.innerHTML = `<span>${chat.title}</span> <span class="chat-time">${chat.time}</span>`;
            el.onclick = () => { inputField.focus(); };
            recentChatsList.appendChild(el);
        });
    }

    window.setPlaceholder = function(section) {
        inputField.placeholder = `Спросите про ${section}...`;
        inputField.focus();
    };

    window.toggleModel = function() {
        if (currentModel === 'Быстрый') {
            currentModel = 'Высокий';
            modelFast.className = 'inactive-model';
            modelExpert.className = 'active-model';
        } else {
            currentModel = 'Быстрый';
            modelFast.className = 'active-model';
            modelExpert.className = 'inactive-model';
        }
    };

    window.handleImageUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            if (!isChatActive) {
                mainContainer.style.display = 'none';
                chatArea.style.display = 'flex';
                chatArea.classList.add('active');
                isChatActive = true;
            }
            const wrapper = document.createElement('div');
            wrapper.className = 'message-wrapper user';
            const sender = document.createElement('div');
            sender.className = 'message-sender';
            sender.textContent = 'Вы';
            wrapper.appendChild(sender);
            const msg = document.createElement('div');
            msg.className = 'message user';
            msg.innerHTML = `
                <img src="${e.target.result}" class="image-preview" alt="Загруженное фото">
                <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.4);">📷 Изображение прикреплено</div>
            `;
            wrapper.appendChild(msg);
            chatArea.appendChild(wrapper);
            chatArea.scrollTop = chatArea.scrollHeight;
        };
        reader.readAsDataURL(file);
        event.target.value = ''; 
    };

    function formatMessageContent(text) {
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const parts = text.split(/(```[\s\S]*?```)/g);
        let html = '';
        parts.forEach(part => {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            if (match) {
                const lang = match[1] || 'plaintext';
                const code = match[2];
                const displayLang = lang === 'javascript' ? 'JavaScript' : lang.toUpperCase();
                html += `
                <div class="code-block-wrapper">
                    <div class="code-header">
                        <span class="code-lang">${displayLang}</span>
                    </div>
                    <pre><code class="language-${lang}">${code}</code></pre>
                </div>`;
            } else {
                html += part.replace(/\n/g, '<br>');
            }
        });
        return html;
    }

    function addMessage(type, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}`;
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        sender.textContent = type === 'user' ? 'Вы' : 'explow';
        wrapper.appendChild(sender);

        if (type === 'user') {
            const msg = document.createElement('div');
            msg.className = `message ${type}`;
            msg.textContent = text;
            wrapper.appendChild(msg);
        } else {
            const card = document.createElement('div');
            card.className = 'ai-card';
            
            const avatarRow = document.createElement('div');
            avatarRow.className = 'ai-avatar-row';
            avatarRow.innerHTML = `
                <div class="ai-avatar">E</div>
                <div class="ai-name">explow</div>
            `;
            card.appendChild(avatarRow);

            const content = document.createElement('div');
            content.className = 'ai-content';
            content.innerHTML = formatMessageContent(text);
            card.appendChild(content);

            const actions = document.createElement('div');
            actions.className = 'ai-actions';
            actions.innerHTML = `
                <button class="ai-action-btn" onclick="copyToClipboard(this)">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Копировать
                </button>
            `;
            card.appendChild(actions);
            wrapper.appendChild(card);
        }

        chatArea.appendChild(wrapper);
        chatArea.scrollTop = chatArea.scrollHeight;

        if (type === 'ai') {
            chatArea.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        }
    }

    // Системный промпт
    function getSystemPrompt() {
        const user = localStorage.getItem('explow_user');
        let lang = 'ru';
        if (user) { try { lang = JSON.parse(user).language || 'ru'; } catch(e) {} }
        return lang === 'ru' 
            ? 'Ты — ИИ-помощник explow. Отвечай строго на русском языке. Будь кратким.' 
            : 'You are an AI assistant explow. Reply strictly in English. Be concise.';
    }

    // ========== ГЛАВНАЯ ФУНКЦИЯ ОТПРАВКИ ЗАПРОСА К ИИ ==========
    function handleSend() {
        const text = inputField.value.trim();
        if (!text) return;

        // Если чат ещё не активен — убираем логотип и показываем чат
        if (!isChatActive) {
            mainContainer.style.display = 'none';
            chatArea.style.display = 'flex';
            chatArea.classList.add('active');
            isChatActive = true;
        }

        addMessage('user', text);
        inputField.value = '';
        inputField.style.height = '24px';

        const targetUrl = currentModel === 'Быстрый' ? WORKER_URL_QUICK : WORKER_URL_EXPERT;
        const systemPrompt = getSystemPrompt();

        // ОТПРАВКА В CLOUDFLARE WORKER
        fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, system_prompt: systemPrompt })
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return response.json();
        })
        .then(data => {
            const aiText = data.choices && data.choices.length > 0 
                ? data.choices[0].message.content 
                : "⚠️ Пустой ответ от ИИ.";
            addMessage('ai', aiText);
        })
        .catch(error => {
            addMessage('ai', `❌ Ошибка соединения с ИИ:\n${error.message}`);
        });
    }

    // ==================================================================

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    inputField.addEventListener('input', () => {
        inputField.style.height = '24px';
        inputField.style.height = inputField.scrollHeight + 'px';
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            resetChat();
        }
    });

    // ✅ ИНИЦИАЛИЗАЦИЯ: при загрузке показываем логотип, чат скрыт
    mainContainer.style.display = 'flex';
    chatArea.style.display = 'none';
    chatArea.classList.remove('active');
    isChatActive = false;
    renderRecentChats();

});
