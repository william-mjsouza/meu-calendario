// Sistema de toasts (snackbars) para feedback de ações do usuário.
// Uso:
//   showToast("Evento salvo");
//   showToast("Sem conexão com o servidor", { type: "error" });
//   showToast("Evento excluído", { type: "success", action: { label: "Desfazer", onClick: undo } });

const DEFAULT_DURATION = 4000; // ms — padrão material design
const ANIMATION_MS = 200;      // duração da transição de saída

// Mapeamento de tipo → ícone (Material Icons)
const ICONS = {
    success: 'check_circle',
    error: 'error_outline',
    info: 'info'
};

let container = null;

// Garante que existe um único container no DOM (criado no primeiro uso)
function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.classList.add('toast-container');
    document.body.appendChild(container);
    return container;
}

// Remove um toast do DOM com transição de saída suave
function dismissToast(toastEl) {
    if (!toastEl || !toastEl.isConnected) return;
    toastEl.classList.remove('visible');
    toastEl.classList.add('leaving');
    setTimeout(() => {
        if (toastEl.isConnected) toastEl.remove();
    }, ANIMATION_MS);
}

/**
 * Exibe um toast na tela.
 *
 * @param {string} message — texto principal
 * @param {object} options
 * @param {"success"|"error"|"info"} [options.type="success"] — cor da faixa lateral e ícone
 * @param {number} [options.duration] — tempo em ms até desaparecer (undo → 5000, senão 4000)
 * @param {{label: string, onClick: () => void}} [options.action] — botão inline (ex.: "Desfazer")
 * @param {boolean} [options.dismissible] — mostra um X para fechar manualmente
 * @returns {{dismiss: () => void}} — controlador do toast (dismissível programaticamente)
 */
export function showToast(message, options = {}) {
    const type = options.type || "success";
    const duration = options.duration || (options.action ? 5000 : DEFAULT_DURATION);
    ensureContainer();

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    // Erros usam role="alert" (leitor de tela interrompe); demais usam aria-live="polite"
    if (type === 'error') {
        toast.setAttribute('role', 'alert');
    } else {
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
    }

    // Ícone
    const icon = document.createElement('i');
    icon.classList.add('material-icons', 'toast-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ICONS[type] || ICONS.info;
    toast.appendChild(icon);

    // Mensagem
    const msg = document.createElement('span');
    msg.classList.add('toast-message');
    msg.textContent = message;
    toast.appendChild(msg);

    // Timer que dispara a saída (guardado numa var para poder cancelar via ação)
    let hideTimer = setTimeout(() => dismissToast(toast), duration);

    // Botão de ação opcional (ex.: "Desfazer")
    if (options.action && typeof options.action.onClick === 'function') {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.classList.add('toast-action');
        actionBtn.textContent = options.action.label || 'Desfazer';
        actionBtn.addEventListener('click', () => {
            clearTimeout(hideTimer);
            try { options.action.onClick(); } catch (err) { console.error(err); }
            dismissToast(toast);
        });
        toast.appendChild(actionBtn);
    }

    // Botão X opcional
    if (options.dismissible) {
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.classList.add('toast-close');
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            clearTimeout(hideTimer);
            dismissToast(toast);
        });
        toast.appendChild(closeBtn);
    }

    container.appendChild(toast);
    // Força um reflow antes de aplicar .visible para garantir a transição
    requestAnimationFrame(() => toast.classList.add('visible'));

    return { dismiss: () => { clearTimeout(hideTimer); dismissToast(toast); } };
}
