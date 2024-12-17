import { openSaveEventPopup } from './saveEvent.js';
import { getDayOfWeek, getDayOfWeekName, getMonthName } from './newDateFunctions.js';
import { calendarState } from './showCalendar.js';
import { applyHoldRippleEffect } from './animations/rippleEffect.js';

const calendar = document.querySelector('.calendar');
const createEventPopup = document.querySelector('.add-event');
const createEventButton = document.querySelector('.create-event-button');
const overlay = document.createElement('div');

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

    createEventPopup.classList.add('active');
    overlay.classList.add('active');

    // Aplica o efeito ripple que funciona enquanto pressionado
    applyHoldRippleEffect(createEventButton, handleRelease);

    overlay.addEventListener('click', closeCreateEventPopup);
}
