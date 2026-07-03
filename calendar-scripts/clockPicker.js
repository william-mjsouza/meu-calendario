// Pop-up de seleção de horário estilo relógio (padrão Android)
// - Modo hora: dois anéis (externo 12/1-11 e interno 00/13-23), detectados por raio
// - Modo minuto: 60 valores selecionáveis (labels apenas nos múltiplos de 5)
// - Interação por pointer events: aceita clique e drag fluido em mouse e toque

const popup = document.querySelector('.clock-picker-popup');
const dial = document.querySelector('.clock-picker-dial');
const hand = document.querySelector('.clock-picker-hand');
const hourBtn = document.querySelector('.clock-picker-hour-btn');
const minuteBtn = document.querySelector('.clock-picker-minute-btn');
const cancelBtn = document.querySelector('.clock-picker-cancel');
const okBtn = document.querySelector('.clock-picker-ok');

// Garante que existe uma "ponta" na extremidade do ponteiro (criada uma vez e reutilizada)
let handTip = document.querySelector('.clock-picker-hand-tip');
if (!handTip) {
    handTip = document.createElement('div');
    handTip.classList.add('clock-picker-hand-tip');
    hand.appendChild(handTip);
}

// Limite (em % do raio do mostrador) para distinguir anel interno do externo no modo hora.
// Os números do anel externo ficam em radiusPct ≈ 0.84 e os do interno em ≈ 0.56.
// O limite fica no ponto médio (0.70), garantindo que clicar em cima de qualquer número
// selecione o anel correto sem "vazamento" para o outro.
const INNER_RING_THRESHOLD = 0.70;

// Estado interno
let currentHour = 6;
let currentMinute = 0;
let mode = 'hour'; // 'hour' | 'minute'
let isDragging = false;
let onConfirmCallback = null;

function pad2(value) {
    return String(value).padStart(2, '0');
}

// Atualiza o display digital HH : MM no topo e o realce do modo ativo
function updateDisplay() {
    hourBtn.textContent = pad2(currentHour);
    minuteBtn.textContent = pad2(currentMinute);
    hourBtn.classList.toggle('active', mode === 'hour');
    minuteBtn.classList.toggle('active', mode === 'minute');
}

// Rotaciona o ponteiro e ajusta o comprimento (anel interno x externo no modo hora)
function updateHand() {
    let angle = 0;
    let isInner = false;
    if (mode === 'hour') {
        // 12 marcações a cada 30°; hora 12 e 00 caem em 0° (topo)
        const hourIndex = currentHour % 12; // 0..11
        angle = hourIndex * 30;
        // Anel interno cobre 00 e 13-23
        isInner = currentHour === 0 || (currentHour >= 13 && currentHour <= 23);
    } else {
        // 60 marcações a cada 6°
        angle = currentMinute * 6;
    }
    hand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    hand.classList.toggle('inner', isInner);
}

// Cria um número posicionado no anel indicado ('outer' | 'inner')
// index: 0 = topo (12h/00min), 1 = 1h, ..., 11 = 11h — 30° por marcação
function createNumberLabel(value, index, ring, isSelected) {
    const label = document.createElement('span');
    label.classList.add('clock-number', ring);
    if (isSelected) label.classList.add('selected');
    label.textContent = pad2(value);
    const angleDeg = index * 30 - 90; // Ajusta para começar do topo
    const angleRad = angleDeg * Math.PI / 180;
    const radius = ring === 'outer' ? 42 : 28; // % do raio do mostrador
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);
    label.style.left = `${x}%`;
    label.style.top = `${y}%`;
    label.style.transform = 'translate(-50%, -50%)';
    dial.appendChild(label);
}

// Limpa os números anteriores e redesenha conforme o modo
function renderNumbers() {
    dial.querySelectorAll('.clock-number').forEach(el => el.remove());

    if (mode === 'hour') {
        // Anel externo: 12 (topo), 1, 2, ..., 11
        for (let i = 0; i < 12; i++) {
            const value = i === 0 ? 12 : i;
            createNumberLabel(value, i, 'outer', currentHour === value);
        }
        // Anel interno: 00 (topo), 13, 14, ..., 23
        for (let i = 0; i < 12; i++) {
            const value = i === 0 ? 0 : i + 12;
            createNumberLabel(value, i, 'inner', currentHour === value);
        }
    } else {
        // Modo minuto: labels apenas nos múltiplos de 5 (00, 05, ..., 55)
        // A seleção fina (0-59) é feita pelo ponteiro/ângulo, não pelos labels
        for (let i = 0; i < 12; i++) {
            const value = i * 5;
            createNumberLabel(value, i, 'outer', currentMinute === value);
        }
    }
}

// Re-renderiza tudo
function render() {
    renderNumbers();
    updateDisplay();
    updateHand();
}

// Calcula ângulo (0-360, sentido horário a partir do topo) e raio relativo (0-1) para um ponto
function getPointerAngleAndRadius(clientX, clientY) {
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // atan2 retorna ângulo a partir do eixo +X (direita). Rotacionamos 90° para começar do topo.
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusPct = distance / (rect.width / 2);
    return { angle, radiusPct };
}

// Atualiza o valor selecionado com base na posição do ponteiro
function updateFromPointer(clientX, clientY) {
    const { angle, radiusPct } = getPointerAngleAndRadius(clientX, clientY);
    if (mode === 'hour') {
        // 12 marcações a cada 30°
        const index = Math.round(angle / 30) % 12; // 0..11
        // Raio decide anel interno x externo
        const isInner = radiusPct < INNER_RING_THRESHOLD;
        if (isInner) {
            currentHour = index === 0 ? 0 : index + 12;
        } else {
            currentHour = index === 0 ? 12 : index;
        }
    } else {
        // 60 marcações a cada 6° — resolução de 1 minuto
        currentMinute = Math.round(angle / 6) % 60;
    }
    render();
}

// ---- Handlers de ponteiro (pointerdown/move/up cobrem mouse E toque) ----
function handlePointerDown(event) {
    event.preventDefault();
    isDragging = true;
    // Captura o ponteiro para continuar recebendo eventos mesmo se sair do dial
    try { dial.setPointerCapture(event.pointerId); } catch (_) { /* ignora se não suportado */ }
    updateFromPointer(event.clientX, event.clientY);
}

function handlePointerMove(event) {
    if (!isDragging) return;
    event.preventDefault();
    updateFromPointer(event.clientX, event.clientY);
}

function handlePointerUp(event) {
    if (!isDragging) return;
    isDragging = false;
    try { dial.releasePointerCapture(event.pointerId); } catch (_) {}
    // Auto-avança de hora para minuto ao soltar
    if (mode === 'hour') {
        mode = 'minute';
        render();
    }
}

// ---- Handlers dos botões laterais ----
function switchToHourMode() {
    mode = 'hour';
    render();
}

function switchToMinuteMode() {
    mode = 'minute';
    render();
}

function closeClockPicker() {
    popup.classList.remove('active');
    hourBtn.removeEventListener('click', switchToHourMode);
    minuteBtn.removeEventListener('click', switchToMinuteMode);
    cancelBtn.removeEventListener('click', handleCancel);
    okBtn.removeEventListener('click', handleOk);
    popup.removeEventListener('click', handleBackdropClick);
    dial.removeEventListener('pointerdown', handlePointerDown);
    dial.removeEventListener('pointermove', handlePointerMove);
    dial.removeEventListener('pointerup', handlePointerUp);
    dial.removeEventListener('pointercancel', handlePointerUp);
    onConfirmCallback = null;
}

function handleCancel() { closeClockPicker(); }

function handleOk() {
    if (typeof onConfirmCallback === 'function') {
        onConfirmCallback(`${pad2(currentHour)}:${pad2(currentMinute)}`);
    }
    closeClockPicker();
}

function handleBackdropClick(event) {
    if (event.target === popup) closeClockPicker();
}

// Abre o pop-up com um horário inicial "HH:MM" e callback ao confirmar
export function openClockPicker(initialTime, onConfirm) {
    onConfirmCallback = onConfirm;

    if (typeof initialTime === 'string' && initialTime.includes(':')) {
        const [h, m] = initialTime.split(':').map(Number);
        currentHour = Number.isFinite(h) ? h : 6;
        currentMinute = Number.isFinite(m) ? m : 0;
    } else {
        currentHour = 6;
        currentMinute = 0;
    }
    mode = 'hour';
    isDragging = false;

    render();
    popup.classList.add('active');

    hourBtn.addEventListener('click', switchToHourMode);
    minuteBtn.addEventListener('click', switchToMinuteMode);
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
    popup.addEventListener('click', handleBackdropClick);

    // Pointer events funcionam para mouse e toque (Chrome/Firefox/Safari modernos)
    dial.addEventListener('pointerdown', handlePointerDown);
    dial.addEventListener('pointermove', handlePointerMove);
    dial.addEventListener('pointerup', handlePointerUp);
    dial.addEventListener('pointercancel', handlePointerUp);
}
