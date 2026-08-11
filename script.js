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
                isLoggedIn = true
