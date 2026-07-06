import { openSaveEventPopup } from './saveEvent.js';
import { getDayOfWeek, getDayOfWeekName, getMonthName } from './newDateFunctions.js';
import { calendarState, showCalendar } from './showCalendar.js';
import { getEventsForDay } from './markDays.js';
import { applyHoldRippleEffect } from './animations/rippleEffect.js';
import { deleteEvent as apiDeleteEvent, updateEvent as apiUpdateEvent } from './api.js';
import { showToast } from './toast.js';

const calendar = document.querySelector('.calendar');
const createEventPopup = document.querySelector('.add-event');
const createEventButton = document.querySelector('.create-event-button');
const savedEventsContainer = document.querySelector('.saved-events');
const overlay = document.createElement('div');

// Verifica se duas datas caem no mesmo dia (ignorando horas)
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

// Formata uma data como DD/MM/AA (2 dígitos no ano)
function formatShortDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear() % 100).padStart(2, '0');
    return `${dd}/${mm}/${yy}`;
}

// Retorna a string de horário do evento para exibir na lista ("HH:MM - HH:MM" ou "... DD/MM/AA"
// se o fim é em dia diferente); retorna null quando o evento é "O dia todo"
function getEventTimeLabel(event) {
    if (event.all_day) return null;
    if (!event.start_hour || !event.end_hour) return null;
    const startDate = event.start_date ? new Date(event.start_date) : null;
    const endDate = event.end_event_date ? new Date(event.end_event_date) : startDate;
    if (startDate && endDate && !isSameDay(startDate, endDate)) {
        return `${event.start_hour} - ${event.end_hour} ${formatShortDate(endDate)}`;
    }
    return `${event.start_hour} - ${event.end_hour}`;
}

// Resolve uma string de cor (que pode conter var(--...)) para um valor concreto que possa
// ser aplicado a propriedades CSS via JS (ex.: border-left-color)
// Consulta a variável CSS diretamente em :root, evitando problemas de resolução tardia
function resolveColor(color) {
    if (!color) return 'transparent';
    // Se a cor for uma referência a uma variável CSS, busca o valor diretamente em :root
    const varMatch = color.match(/^\s*var\((--[^)]+)\)\s*$/);
    if (varMatch) {
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]).trim();
        if (resolved) return resolved;
    }
    // Caso já seja uma cor concreta (rgb, hex, etc.), retorna como está
    return color;
}

// Função que renderiza os eventos salvos do dia clicado dentro da div .saved-events
function renderSavedEvents() {
    // Limpa o conteúdo anterior
    savedEventsContainer.innerHTML = '';

    // Pega os eventos do dia atualmente selecionado
    const events = getEventsForDay(Number(calendarState.day), calendarState.month, calendarState.year);

    // Caso não haja eventos, mantém um span vazio como espaço reservado
    if (events.length === 0) {
        const placeholder = document.createElement('span');
        placeholder.classList.add('saved-event');
        savedEventsContainer.appendChild(placeholder);
        return;
    }

    // Cria um span .saved-event para cada evento do dia
    events.forEach(event => {
        const savedEvent = document.createElement('span');
        savedEvent.classList.add('saved-event', 'has-event');
        // Reflete o estado de conclusão persistido no evento
        if (event.concluded) {
            savedEvent.classList.add('concluded');
        }
        savedEvent.style.cursor = 'pointer';
        // Aplica a cor do evento como faixa lateral esquerda (só existe quando .has-event está presente)
        // Resolve a cor para RGB via uma div temporária para lidar com valores em var(--...)
        savedEvent.style.borderLeftColor = resolveColor(event.color);

        // Clique no span (fora dos botões) abre o pop-up de salvar em modo de edição
        savedEvent.addEventListener('click', (clickEvent) => {
            // Ignora cliques nos botões internos (excluir e concluir)
            if (clickEvent.target.closest('.delete-event') || clickEvent.target.closest('.conclude-event')) {
                return;
            }
            closeCreateEventPopup();
            openSaveEventPopup(event);
        });

        // Bloco de informações (título + linha de horário) em coluna
        const info = document.createElement('div');
        info.classList.add('saved-event-info');

        // Título do evento
        const title = document.createElement('h3');
        title.classList.add('event-title');
        title.textContent = event.title;
        info.appendChild(title);

        // Linha de horário: relógio + "HH:MM - HH:MM [DD/MM/AA]", omitida quando é "O dia todo"
        const timeLabel = getEventTimeLabel(event);
        if (timeLabel) {
            const timeRow = document.createElement('span');
            timeRow.classList.add('saved-event-time');
            const clockIcon = document.createElement('i');
            clockIcon.classList.add('material-icons');
            clockIcon.setAttribute('aria-hidden', 'true');
            clockIcon.textContent = 'access_time';
            const timeText = document.createElement('span');
            timeText.textContent = timeLabel;
            timeRow.appendChild(clockIcon);
            timeRow.appendChild(timeText);
            info.appendChild(timeRow);
        }

        // Botão de excluir
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('material-icons', 'delete-event');
        deleteButton.textContent = 'close';
        deleteButton.addEventListener('click', () => handleDeleteEvent(event));

        // Botão de concluir
        const concludeButton = document.createElement('button');
        concludeButton.classList.add('material-icons', 'conclude-event');
        concludeButton.textContent = 'check';
        concludeButton.addEventListener('click', () => handleConcludeEvent(event, savedEvent));

        savedEvent.appendChild(info);
        savedEvent.appendChild(deleteButton);
        savedEvent.appendChild(concludeButton);
        savedEventsContainer.appendChild(savedEvent);
    });
}

// Remove o evento da lista com padrão "excluir + desfazer":
// 1. Remove imediatamente da UI para feedback instantâneo
// 2. Mostra um toast "Evento excluído — Desfazer" por 5s
// 3. Ao final do prazo (sem clique em Desfazer), efetiva a remoção no backend
// 4. Se o usuário clicar em Desfazer, o evento volta ao array e o marcador retorna ao calendário
function handleDeleteEvent(eventToRemove) {
    const index = calendarState.dayEvents.indexOf(eventToRemove);
    if (index === -1) return;

    // Remove da UI imediatamente (posição original guardada para eventual restauração)
    calendarState.dayEvents.splice(index, 1);
    showCalendar(calendarState.month, calendarState.year);
    renderSavedEvents();

    // Estado do desfazer: se for null quando o toast expirar, é porque o usuário desfez
    let undone = false;

    showToast("Evento excluído", {
        type: "success",
        duration: 5000,
        action: {
            label: "Desfazer",
            onClick: () => {
                undone = true;
                // Restaura o evento na mesma posição original
                calendarState.dayEvents.splice(index, 0, eventToRemove);
                showCalendar(calendarState.month, calendarState.year);
                renderSavedEvents();
            }
        }
    });

    // Só chama o backend quando o prazo de desfazer expira e o usuário não desfez
    if (eventToRemove.id) {
        setTimeout(() => {
            if (undone) return; // Nada a fazer — evento foi restaurado
            apiDeleteEvent(eventToRemove.id)
                .catch(err => {
                    console.error("Falha ao excluir evento no backend:", err);
                    showToast("Não foi possível excluir do servidor", { type: "error" });
                    // Restaura localmente já que o servidor recusou
                    if (!calendarState.dayEvents.includes(eventToRemove)) {
                        calendarState.dayEvents.splice(index, 0, eventToRemove);
                        showCalendar(calendarState.month, calendarState.year);
                        renderSavedEvents();
                    }
                });
        }, 5100); // Um pouco depois do toast expirar
    }
}

// Alterna o estado de "concluído" do evento (persiste no objeto do evento)
// Marcado: força a frequência para "once" (guardando a original em originalFrequency)
// Desmarcado: restaura a frequência original quando havia uma salva
function handleConcludeEvent(eventObj, savedEventElement) {
    if (eventObj.concluded) {
        // Desmarca: restaura a frequência original (se existir)
        eventObj.concluded = false;
        if (eventObj.originalFrequency !== undefined) {
            eventObj.frequency = eventObj.originalFrequency;
            delete eventObj.originalFrequency;
        }
    } else {
        // Marca: salva a frequência atual e força "once" para não continuar recorrendo
        eventObj.concluded = true;
        if (eventObj.frequency !== "once") {
            eventObj.originalFrequency = eventObj.frequency;
            eventObj.frequency = "once";
        }
    }
    // Reflete o novo estado no elemento da lista
    savedEventElement.classList.toggle('concluded', eventObj.concluded);
    // Atualiza o calendário (os marcadores das recorrências futuras somem ao marcar)
    showCalendar(calendarState.month, calendarState.year);
    // Persiste a mudança no backend (se o evento já foi salvo lá)
    if (eventObj.id) {
        apiUpdateEvent(eventObj.id, eventObj).catch(err => console.error("Falha ao atualizar evento no backend:", err));
    }
}

function closeCreateEventPopup() {
    createEventPopup.classList.remove('active');
    overlay.classList.remove('active');
}

function handleRelease() {
    // Só será chamado após mouseup/touchend ou se sair do botão pressionado
    closeCreateEventPopup();
    openSaveEventPopup();
}

export function openCreateEventPopup() {
    overlay.classList.add('overlay');
    calendar.appendChild(overlay);

    let dayOfWeek = getDayOfWeek(calendarState.year, calendarState.month, calendarState.day);
    let dayOfWeekName = getDayOfWeekName(dayOfWeek);
    document.querySelector('.event-date').textContent = `${dayOfWeekName}, ${calendarState.day} de ${getMonthName(calendarState.month)}`;

    // Renderiza a lista de eventos salvos do dia clicado
    renderSavedEvents();

    createEventPopup.classList.add('active');
    overlay.classList.add('active');

    // Aplica o efeito ripple que funciona enquanto pressionado
    applyHoldRippleEffect(createEventButton, handleRelease);

    overlay.addEventListener('click', closeCreateEventPopup);
}
