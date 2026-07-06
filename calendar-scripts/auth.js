// Controla o comportamento da tela de login/cadastro (index.html)
// Alterna entre as abas, envia os formulários e redireciona para o calendário ao autenticar

import { isAuthenticated, login, register, saveSession } from './api.js';
import { showToast } from './toast.js';

// Se o usuário já está autenticado, vai direto para o calendário
if (isAuthenticated()) {
    window.location.href = "calendar.html";
}

// Exibe uma mensagem "flash" deixada por outra página (ex.: sessão expirou)
const flash = sessionStorage.getItem("mc.flash");
if (flash) {
    try {
        const { message, type } = JSON.parse(flash);
        showToast(message, { type });
    } catch (_) { /* ignora payload inválido */ }
    sessionStorage.removeItem("mc.flash");
}

const tabs = document.querySelectorAll('.login-tab');
const loginForm = document.querySelector('.login-form[data-form="login"]');
const registerForm = document.querySelector('.login-form[data-form="register"]');
const messageEl = document.querySelector('.login-message');

// Exibe uma mensagem inline (erro ou sucesso)
function showMessage(text, type = "error") {
    messageEl.textContent = text;
    messageEl.classList.remove("error", "success");
    messageEl.classList.add(type);
    messageEl.hidden = false;
}

function clearMessage() {
    messageEl.hidden = true;
    messageEl.textContent = "";
}

// Alterna entre as abas Entrar / Cadastrar
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        loginForm.hidden = mode !== 'login';
        registerForm.hidden = mode !== 'register';
        clearMessage();
    });
});

// Handler compartilhado para desabilitar o botão enquanto a requisição está em andamento
async function handleSubmit(form, action) {
    const submitButton = form.querySelector('.login-submit');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";
    clearMessage();
    try {
        const response = await action();
        saveSession(response);
        showMessage("Autenticado! Redirecionando…", "success");
        // Deixa um toast de boas-vindas para aparecer assim que o calendário carregar
        sessionStorage.setItem("mc.flash", JSON.stringify({
            message: `Bem-vindo, ${response.name}!`,
            type: "success"
        }));
        setTimeout(() => window.location.href = "calendar.html", 300);
    } catch (err) {
        showMessage(err.message || "Não foi possível autenticar.", "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    handleSubmit(loginForm, () => login(data));
});

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm).entries());
    handleSubmit(registerForm, () => register(data));
});
