// Глобальная функция для копирования кода
window.copyCode = function(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const codeEl = wrapper.querySelector('pre code');
    if (codeEl) {
        const text = codeEl.innerText;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Скопировано!`;
                setTimeout(() => { btn.innerHTML = orig; }, 2000);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text; document.body.appendChild(textarea);
            textarea.select(); document.execCommand('copy');
            document.body.removeChild(textarea);
            const orig = btn.innerHTML;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Скопировано!`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Чат загружен!");

    const translations = {
        ru: {
            new_chat: 'Новый чат', how_can_i_help: 'Чем я могу вам помочь?',
            write_your_request: 'Напишите ваш запрос...', log_in: 'Войти',
            settings: 'Настройки', log_out: 'Выйти',
            account_settings: 'Настройки аккаунта', change_profile_details: 'Измените данные вашего профиля',
            username: 'Имя пользователя', password: 'Пароль', interface_language: 'Язык интерфейса',
            change_password: 'Сменить пароль', save_password: 'Сохранить пароль',
            save: 'Сохранить', cancel: 'Отмена', delete_chat: 'Удалить чат',
            delete_title: 'После удаления чат невозможно восстановить', delete_desc: 'Ссылки для общего доступа станут недействительными.',
            rename_title: 'Переименовать чат', rename_desc: 'Введите новое название для этого чата.',
            new_chat_name_placeholder: 'Новое название чата...', log_in_sign_up: 'Вход / Регистрация',
            reg_desc: 'Введите свои данные для входа в аккаунт', logout_title: 'Выход из аккаунта',
            logout_desc: 'Вы действительно хотите выйти из аккаунта?', log_out_confirm: 'Выйти',
            you: 'Вы', quick: 'Быстрый', expert: 'Эксперт'
        },
        en: {
            new_chat: 'New chat', how_can_i_help: 'How can I help you?',
            write_your_request: 'Write your request...', log_in: 'Log in',
            settings: 'Settings', log_out: 'Log out',
            account_settings: 'Account settings', change_profile_details: 'Change your profile details',
            username: 'Username', password: 'Password', interface_language: 'Interface language',
            change_password: 'Change password', save_password: 'Save password',
            save: 'Save', cancel: 'Cancel', delete_chat: 'Delete chat',
            delete_title: 'Chat cannot be restored after deletion', delete_desc: 'Shared links will become invalid.',
            rename_title: 'Rename chat', rename_desc: 'Enter a new name for this chat.',
            new_chat_name_placeholder: 'New chat name...', log_in_sign_up: 'Log in / Sign up',
            reg_desc: 'Enter your details to log in to your account', logout_title: 'Log out of account',
            logout_desc: 'Are you sure you want to log out of your account?', log_out_confirm: 'Log out',
            you: 'You', quick: 'Quick', expert: 'Expert'
        }
    };

    const chatHistory = document.getElementById('chat-history');
    const messagesContainer = document.getElementById('messages-container');
    const inputField = document.getElementById('input-field');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    let chats = {}, currentChatId = null, pendingChatActionId = null, isLoggedIn = false, selectedModel = 'quick';
    const STORAGE_KEY = 'explow_chat_data';
    const WORKER_URL_QUICK = 'https://explow-proxy.avatarsale75.workers.dev';
    const WORKER_URL_EXPERT = 'https://explow-proxy-expert.avatarsale75.workers.dev';

    function loadProfile() {
        const saved = localStorage.getItem('explow_user');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                document.getElementById('user-name').innerText = data.username;
                document.getElementById('user-avatar').innerText = data.avatar;
                document.getElementById('btn-register').style.display = 'none';
                document.getElementById('user-profile').style.display = 'flex';
                isLoggedIn = true;
                return data;
            } catch(e) { localStorage.removeItem('explow_user'); }
        }
        return null;
    }
    let userData = loadProfile();

    function updateUILanguage(lang) {
        const t = translations[lang] || translations['ru'];
        document.getElementById('btn-new-chat-text').innerText = t.new_chat;
        document.getElementById('btn-login-text').innerText = t.log_in;
        document.getElementById('settings-btn-text').innerText = t.settings;
        document.getElementById('logout-btn-text').innerText = t.log_out;
        document.getElementById('input-field').placeholder = t.write_your_request;
        document.getElementById('modal-delete-title').innerText = t.delete_title;
        document.getElementById('modal-delete-desc').innerText = t.delete_desc;
        document.getElementById('delete-btn-text').innerText = t.delete_chat;
        document.getElementById('modal-rename-title').innerText = t.rename_title;
        document.getElementById('modal-rename-desc').innerText = t.rename_desc;
        document.getElementById('modal-rename-input').placeholder = t.new_chat_name_placeholder;
        document.getElementById('reg-modal-title').innerText = t.log_in_sign_up;
        document.getElementById('reg-modal-desc').innerText = t.reg_desc;
        document.getElementById('login-btn-modal-text').innerText = t.log_in;
        document.getElementById('settings-modal-title').innerText = t.account_settings;
        document.getElementById('settings-modal-desc').innerText = t.change_profile_details;
        document.getElementById('settings-nickname-label').innerText = t.username;
        document.getElementById('settings-password-label').innerText = t.password;
        document.getElementById('settings-lang-label').innerText = t.interface_language;
        document.querySelectorAll('#cancel-btn-text').forEach(el => el.innerText = t.cancel);
        document.querySelectorAll('#save-btn-text').forEach(el => el.innerText = t.save);
        document.getElementById('change-pass-btn-text').innerText = t.change_password;
        document.getElementById('logout-modal-title').innerText = t.logout_title;
        document.getElementById('logout-modal-desc').innerText = t.logout_desc;
        document.getElementById('logout-confirm-btn-text').innerText = t.log_out_confirm;
        
        renderSidebar();
        if (!currentChatId || !chats[currentChatId] || !chats[currentChatId].messages || chats[currentChatId].messages.length === 0) {
            renderMessages();
        }
    }

    function loadChats() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { try { chats = JSON.parse(saved); } catch(e) { chats = {}; } }
        else { chats = {}; }
        for (const key in chats) {
            if (Array.isArray(chats[key])) {
                chats[key] = { title: 'Новый чат', messages: chats[key] };
            }
        }
    }
    function saveChats() { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); }

    function renderSidebar() {
        const currentLang = userData ? userData.language : 'ru';
        const t = translations[currentLang] || translations['ru'];
        chatHistory.innerHTML = '';
        const ids = Object.keys(chats);
        if (ids.length === 0) { currentChatId = null; }
        else if (!currentChatId || !chats[currentChatId]) { currentChatId = ids[0]; }

        ids.forEach(id => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            if (id === currentChatId) chatItem.classList.add('active');

            const chatData = chats[id];
            let title = chatData.title || t.new_chat;
            if (!chatData.title && chatData.messages && chatData.messages.length > 0) {
                const firstUserMsg = chatData.messages.find(m => m.type === 'user');
                if (firstUserMsg) {
                    title = firstUserMsg.text.length > 25 ? firstUserMsg.text.substring(0, 25) + '...' : firstUserMsg.text;
                    chatData.title = title; saveChats();
                }
            }

            const chatText = document.createElement('span');
            chatText.className = 'chat-text'; chatText.innerText = title;
            
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
                    <span>${t.rename_title}</span>
                </div>
                <div class="dropdown-item delete" data-action="delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    <span>${t.delete_chat}</span>
                </div>
            `;

            dotsWrapper.appendChild(dots); dotsWrapper.appendChild(dropdown);
            chatItem.appendChild(chatText); chatItem.appendChild(dotsWrapper);
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
                e.stopPropagation(); dropdown.classList.remove('open');
                pendingChatActionId = id;
                document.getElementById('modal-delete').classList.add('active');
            });

            const renameBtn = dropdown.querySelector('[data-action="rename"]');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation(); dropdown.classList.remove('open');
                pendingChatActionId = id;
                document.getElementById('modal-rename-input').value = chats[id].title || t.new_chat;
                document.getElementById('modal-rename').classList.add('active');
            });

            document.addEventListener('click', (e) => {
                if (!chatItem.contains(e.target)) { dropdown.classList.remove('open'); }
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
        const currentLang = userData ? userData.language : 'ru';
        const t = translations[currentLang] || translations['ru'];

        if (!currentChatId || !chats[currentChatId] || !chats[currentChatId].messages || chats[currentChatId].messages.length === 0) {
            document.getElementById('chat-header').style.display = 'flex';
            const wrapper = document.createElement('div');
            wrapper.className = 'greeting-wrapper';

            const greetingText = document.createElement('div');
            greetingText.className = 'greeting-text';
            greetingText.innerText = t.how_can_i_help;
            wrapper.appendChild(greetingText);

            const switcher = document.createElement('div');
            switcher.className = 'model-switcher';
            
            const btnQuick = document.createElement('button');
            btnQuick.className = selectedModel === 'quick' ? 'model-btn active' : 'model-btn';
            btnQuick.id = 'model-quick';
            btnQuick.innerHTML = `<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span class="model-text">${t.quick}</span>`;
            btnQuick.addEventListener('click', () => switchModel('quick'));
            
            const btnExpert = document.createElement('button');
            btnExpert.className = selectedModel === 'expert' ? 'model-btn active' : 'model-btn';
            btnExpert.id = 'model-expert';
            btnExpert.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><circle cx="12" cy="12" r="3"/></svg><span class="model-text">${t.expert}</span>`;
            btnExpert.addEventListener('click', () => switchModel('expert'));
            
            switcher.appendChild(btnQuick); switcher.appendChild(btnExpert);
            wrapper.appendChild(switcher);
            messagesContainer.appendChild(wrapper);
            return;
        } else {
            document.getElementById('chat-header').style.display = 'none';
        }

        const chatMessages = chats[currentChatId].messages;
        chatMessages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-wrapper ${msg.type}`;
            const sender = document.createElement('div');
            sender.className = 'message-sender';
            sender.innerText = msg.type === 'user' ? t.you : 'explow';
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
        const currentLang = userData ? userData.language : 'ru';
        const t = translations[currentLang] || translations['ru'];
        const newId = 'chat_' + Date.now();
        chats[newId] = { title: t.new_chat, messages: [] };
        currentChatId = newId;
        saveChats(); renderSidebar(); renderMessages(); inputField.focus();
    }

    function switchModel(model) {
        selectedModel = model;
        const quickBtn = document.getElementById('model-quick');
        const expertBtn = document.getElementById('model-expert');
        if (quickBtn && expertBtn) {
            quickBtn.classList.toggle('active', model === 'quick');
            expertBtn.classList.toggle('active', model === 'expert');
        }
        console.log("🔄 Модель переключена на:", model);
    }

    function addMessageToCurrentChat(type, text) {
        if (!currentChatId || !chats[currentChatId]) return;
        if (!chats[currentChatId].messages) chats[currentChatId].messages = [];
        chats[currentChatId].messages.push({ type, text });
        if (type === 'user' && !chats[currentChatId].title) {
            const short = text.length > 25 ? text.substring(0, 25) + '...' : text;
            chats[currentChatId].title = short;
        }
        saveChats(); renderMessages(); renderSidebar();
    }

    function addTypingIndicator() {
        const existing = document.getElementById('typing-wrapper');
        if (existing) existing.remove();
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
            dot.className = 'typing-dot'; indicator.appendChild(dot);
        }
        wrapper.appendChild(indicator);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const wrapper = document.getElementById('typing-wrapper');
        if (wrapper) wrapper.remove();
    }

    function getSystemPrompt() {
        const user = localStorage.getItem('explow_user');
        let lang = 'ru';
        if (user) { try { lang = JSON.parse(user).language || 'ru'; } catch(e) {} }
        return lang === 'ru' 
            ? 'Ты — ИИ-помощник explow. Отвечай строго на русском языке. Будь кратким.' 
            : 'You are an AI assistant explow. Reply strictly in English. Be concise.';
    }

    function handleSendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        if (!isLoggedIn) {
            const currentLang = userData ? userData.language : 'ru';
            const t = translations[currentLang] || translations['ru'];
            addMessageToCurrentChat('ai', `⚠️ ${t.log_in} first.`);
            inputField.value = '';
            return;
        }

        addMessageToCurrentChat('user', text);
        inputField.value = '';
        addTypingIndicator();

        const targetUrl = selectedModel === 'quick' ? WORKER_URL_QUICK : WORKER_URL_EXPERT;
        const systemPrompt = getSystemPrompt();

        if (window.location.protocol === 'file:') {
            setTimeout(() => {
                removeTypingIndicator();
                const demoReply = `Ответ от модели **${selectedModel === 'quick' ? 'Быстрый' : 'Эксперт'}**!\n\n\`\`\`html\n<h1>Демо-режим</h1>\n<p>Ваши воркеры подключены корректно.</p>\n\`\`\``;
                addMessageToCurrentChat('ai', demoReply);
            }, 800);
            return;
        }

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
            removeTypingIndicator();
            const aiText = data.choices && data.choices.length > 0 
                ? data.choices[0].message.content 
                : "⚠️ Пустой ответ.";
            addMessageToCurrentChat('ai', aiText);
        })
        .catch(error => {
            removeTypingIndicator();
            addMessageToCurrentChat('ai', `❌ Ошибка: ${error.message}`);
        });
    }

    // ==================== МОДАЛЬНЫЕ ОКНА (ЛОГИКА) ====================
    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
        pendingChatActionId = null;
    }
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });

    document.getElementById('modal-delete-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-delete-confirm').addEventListener('click', function() {
        if (pendingChatActionId) {
            delete chats[pendingChatActionId];
            pendingChatActionId = null;
            saveChats(); renderSidebar(); renderMessages();
        }
        closeModal();
    });

    document.getElementById('modal-rename-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-rename-confirm').addEventListener('click', function() {
        const newTitle = document.getElementById('modal-rename-input').value.trim();
        if (pendingChatActionId && newTitle) {
            chats[pendingChatActionId].title = newTitle;
            pendingChatActionId = null;
            saveChats(); renderSidebar();
        }
        closeModal();
    });

    // ==================== ВХОД / РЕГИСТРАЦИЯ ====================
    document.getElementById('btn-register').addEventListener('click', () => {
        document.getElementById('modal-register').classList.add('active');
    });

    document.getElementById('modal-register-cancel').addEventListener('click', () => {
        document.getElementById('modal-register').classList.remove('active');
    });

    document.getElementById('modal-register-confirm').addEventListener('click', () => {
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        if (!email) { alert('Введите Email'); return; }
        if (!password) { alert('Пароль обязателен'); return; }
        const name = email.split('@')[0];
        const avatar = name.charAt(0).toUpperCase();
        userData = {
            username: name, email: email, password: password, avatar: avatar, language: 'ru'
        };
        localStorage.setItem('explow_user', JSON.stringify(userData));
        isLoggedIn = true;

        document.getElementById('user-name').innerText = name;
        document.getElementById('user-avatar').innerText = avatar;
        document.getElementById('btn-register').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('modal-register').classList.remove('active');
        updateUILanguage('ru');
    });

    // ==================== НАСТРОЙКИ ====================
    let isPasswordEditMode = false;

    document.getElementById('settings-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.remove('open');
        if (!userData) { alert('Сначала войдите в аккаунт.'); return; }
        document.getElementById('settings-nickname').value = userData.username;
        document.getElementById('settings-language').value = userData.language || 'ru';
        const display = document.getElementById('password-display');
        const input = document.getElementById('settings-password');
        const btn = document.getElementById('toggle-pass-btn');
        display.style.display = 'block';
        input.style.display = 'none';
        input.value = '';
        const t = translations[userData.language] || translations['ru'];
        document.getElementById('change-pass-btn-text').innerText = t.change_password;
        isPasswordEditMode = false;
        if (userData.password) { display.innerText = '••••••••'; } else { display.innerText = 'Не установлен'; }
        document.getElementById('modal-settings').classList.add('active');
    });

    document.getElementById('toggle-pass-btn').addEventListener('click', () => {
        const display = document.getElementById('password-display');
        const input = document.getElementById('settings-password');
        const btn = document.getElementById('toggle-pass-btn');
        const t = translations[userData.language] || translations['ru'];
        if (!isPasswordEditMode) {
            display.style.display = 'none'; input.style.display = 'block';
            input.value = ''; input.focus();
            document.getElementById('change-pass-btn-text').innerText = t.save_password;
            isPasswordEditMode = true;
        } else {
            display.style.display = 'block'; input.style.display = 'none';
            document.getElementById('change-pass-btn-text').innerText = t.change_password;
            isPasswordEditMode = false;
        }
    });

    document.getElementById('modal-settings-cancel').addEventListener('click', () => {
        document.getElementById('modal-settings').classList.remove('active');
    });

    document.getElementById('modal-settings-save').addEventListener('click', () => {
        const newNick = document.getElementById('settings-nickname').value.trim();
        if (!newNick) { alert('Имя пользователя не может быть пустым.'); return; }
        const newLang = document.getElementById('settings-language').value;
        const passInput = document.getElementById('settings-password');
        let newPass = userData.password;
        if (passInput.style.display === 'block') {
            const trimmedPass = passInput.value.trim();
            if (trimmedPass) newPass = trimmedPass;
        }
        userData.username = newNick;
        userData.avatar = newNick.charAt(0).toUpperCase();
        userData.password = newPass;
        userData.language = newLang;
        localStorage.setItem('explow_user', JSON.stringify(userData));
        document.getElementById('user-name').innerText = newNick;
        document.getElementById('user-avatar').innerText = newNick.charAt(0).toUpperCase();
        document.getElementById('modal-settings').classList.remove('active');
        updateUILanguage(newLang);
    });

    // ==================== ВЫХОД ====================
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.remove('open');
        document.getElementById('modal-logout').classList.add('active');
    });

    document.getElementById('modal-logout-cancel').addEventListener('click', () => {
        document.getElementById('modal-logout').classList.remove('active');
    });

    document.getElementById('modal-logout-confirm').addEventListener('click', () => {
        localStorage.removeItem('explow_user');
        isLoggedIn = false; userData = null;
        document.getElementById('user-profile').style.display = 'none';
        document.getElementById('btn-register').style.display = 'flex';
        document.getElementById('modal-logout').classList.remove('active');
        updateUILanguage('ru');
    });

    // ==================== ПРОФИЛЬ МЕНЮ ====================
    document.getElementById('profile-dots').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-dots-wrapper')) {
            document.getElementById('profile-dropdown').classList.remove('open');
        }
    });

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    loadChats();
    if (Object.keys(chats).length === 0) { createNewChat(); }
    else {
        const ids = Object.keys(chats);
        currentChatId = ids[0];
        renderSidebar();
        renderMessages();
    }

    // По умолчанию язык интерфейса — русский
    if (userData) { updateUILanguage(userData.language || 'ru'); } else { updateUILanguage('ru'); }

    newChatBtn.addEventListener('click', createNewChat);
    sendBtn.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    console.log("✅ Все системы готовы!");
});
