import { openSaveEventPopup } from './saveEvent.js';
import { getDayOfWeek, getDayOfWeekName, getMonthName } from './newDateFunctions.js';
import { calendarState, showCalendar } from './showCalendar.js';
import { getEventsForDay } from './markDays.js';
import { applyHoldRippleEffect } from './animations/rippleEffect.js';

const calendar = document.querySelector('.calendar');
const createEventPopup = document.querySelector('.add-event');
const createEventButton = document.querySelector('.create-event-button');
const savedEventsContainer = document.querySelector('.saved-events');
const overlay = document.createElement('div');

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

        // Título do evento
        const title = document.createElement('h3');
        title.classList.add('event-title');
        title.textContent = event.title;

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

        savedEvent.appendChild(title);
        savedEvent.appendChild(deleteButton);
        savedEvent.appendChild(concludeButton);
        savedEventsContainer.appendChild(savedEvent);
    });
}

// Remove o evento da lista global e atualiza o calendário e o pop-up
function handleDeleteEvent(eventToRemove) {
    const index = calendarState.dayEvents.indexOf(eventToRemove);
    if (index !== -1) {
        calendarState.dayEvents.splice(index, 1);
    }
    // Atualiza o calendário (remove o marcador do dia se for o caso)
    showCalendar(calendarState.month, calendarState.year);
    // Re-renderiza a lista do dia
    renderSavedEvents();
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
