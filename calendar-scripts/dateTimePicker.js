// Pop-up para escolher data e hora de início e fim do evento
// Reutiliza o endDatePicker para as datas e o clockPicker para as horas

import { getDayOfWeek, getMonthName } from './newDateFunctions.js';
import { openEndDatePicker } from './endDatePicker.js';
import { openClockPicker } from './clockPicker.js';

// Nomes abreviados dos dias da semana (formato "dom.", "seg.", ...)
const weekdayShort = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

// Estado interno do pop-up
let tentativeStartDate = null;
let tentativeEndDate = null;
let tentativeStartTime = "06:00";
let tentativeEndTime = "06:00";
let tentativeAllDay = false;
let onConfirmCallback = null;

// Referências aos elementos do pop-up
const popup = document.querySelector('.datetime-picker-popup');
const card = document.querySelector('.datetime-picker-card');
const allDayCheck = document.querySelector('.datetime-picker-allday-check');
const startDateBtn = document.querySelector('.datetime-picker-start-date');
const startTimeBtn = document.querySelector('.datetime-picker-start-time');
const endDateBtn = document.querySelector('.datetime-picker-end-date');
const endTimeBtn = document.querySelector('.datetime-picker-end-time');
const cancelBtn = document.querySelector('.datetime-picker-cancel');
const okBtn = document.querySelector('.datetime-picker-ok');

// Formata uma data no padrão "Julho 26 (dom.)"
function formatDateLabel(date) {
    const monthName = getMonthName(date.getMonth() + 1);
    const day = date.getDate();
    const weekday = weekdayShort[date.getDay()];
    return `${monthName} ${day} (${weekday})`;
}

// Reflete o estado interno nos botões do pop-up
function updateLabels() {
    startDateBtn.textContent = formatDateLabel(tentativeStartDate);
    endDateBtn.textContent = formatDateLabel(tentativeEndDate);
    startTimeBtn.textContent = tentativeStartTime;
    endTimeBtn.textContent = tentativeEndTime;
    allDayCheck.checked = tentativeAllDay;
    card.classList.toggle('all-day', tentativeAllDay);
}

// Handlers de clique nos campos de data (abrem o endDatePicker existente)
function handleStartDateClick() {
    openEndDatePicker(tentativeStartDate, (chosen) => {
        if (!chosen) return;
        tentativeStartDate = chosen;
        // Se a data final ficou antes da inicial, alinha para a mesma data
        if (tentativeEndDate < tentativeStartDate) {
            tentativeEndDate = new Date(tentativeStartDate);
        }
        enforceSameDayOrder(); // Se caiu no mesmo dia, garante que o fim não fique antes do início
        updateLabels();
    });
}

function handleEndDateClick() {
    openEndDatePicker(tentativeEndDate, (chosen) => {
        if (!chosen) return;
        tentativeEndDate = chosen;
        // Se a data final ficou antes da inicial, alinha para a mesma data
        if (tentativeEndDate < tentativeStartDate) {
            tentativeStartDate = new Date(tentativeEndDate);
        }
        enforceSameDayOrder(); // Se caiu no mesmo dia, garante que o fim não fique antes do início
        updateLabels();
    });
}

// Converte "HH:MM" em número de minutos desde a meia-noite (para comparar horários)
function timeToMinutes(hhmm) {
    if (!hhmm || !hhmm.includes(':')) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

// Se início e fim caem no mesmo dia e o fim ficou antes do início, snapa o fim para o início
// (impede intervalos inválidos como 16:00 → 12:00 no mesmo dia)
function enforceSameDayOrder() {
    if (isSameDay(tentativeStartDate, tentativeEndDate)) {
        if (timeToMinutes(tentativeEndTime) < timeToMinutes(tentativeStartTime)) {
            tentativeEndTime = tentativeStartTime;
        }
    }
}

// Handlers de clique nas horas (abrem o clockPicker)
function handleStartTimeClick() {
    openClockPicker(tentativeStartTime, (chosen) => {
        tentativeStartTime = chosen;
        enforceSameDayOrder(); // Se avançou o início além do fim (mesmo dia), realinha o fim
        updateLabels();
    });
}

function handleEndTimeClick() {
    openClockPicker(tentativeEndTime, (chosen) => {
        tentativeEndTime = chosen;
        enforceSameDayOrder(); // Impede fim < início quando é o mesmo dia
        updateLabels();
    });
}

// Toggle do "O dia todo"
function handleAllDayChange() {
    tentativeAllDay = allDayCheck.checked;
    if (tentativeAllDay) {
        tentativeStartTime = "00:00";
        tentativeEndTime = "23:59";
    } else {
        // Se as horas estão nos extremos, volta ao padrão 06:00
        if (tentativeStartTime === "00:00" && tentativeEndTime === "23:59") {
            tentativeStartTime = "06:00";
            tentativeEndTime = "06:00";
        }
    }
    updateLabels();
}

function closeDateTimePicker() {
    popup.classList.remove('active');
    allDayCheck.removeEventListener('change', handleAllDayChange);
    startDateBtn.removeEventListener('click', handleStartDateClick);
    endDateBtn.removeEventListener('click', handleEndDateClick);
    startTimeBtn.removeEventListener('click', handleStartTimeClick);
    endTimeBtn.removeEventListener('click', handleEndTimeClick);
    cancelBtn.removeEventListener('click', handleCancel);
    okBtn.removeEventListener('click', handleOk);
    popup.removeEventListener('click', handleBackdropClick);
    onConfirmCallback = null;
}

function handleCancel() {
    closeDateTimePicker();
}

function handleOk() {
    if (typeof onConfirmCallback === 'function') {
        onConfirmCallback({
            startDate: tentativeStartDate,
            endDate: tentativeEndDate,
            startTime: tentativeStartTime,
            endTime: tentativeEndTime,
            allDay: tentativeAllDay
        });
    }
    closeDateTimePicker();
}

function handleBackdropClick(event) {
    if (event.target === popup) closeDateTimePicker();
}

// Verifica se duas datas representam o mesmo dia
export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

// Abre o pop-up com valores iniciais e callback ao confirmar
// initial: { startDate: Date, endDate: Date, startTime: "HH:MM", endTime: "HH:MM", allDay: bool }
export function openDateTimePicker(initial, onConfirm) {
    onConfirmCallback = onConfirm;
    tentativeStartDate = new Date(initial.startDate);
    tentativeEndDate = new Date(initial.endDate);
    tentativeStartTime = initial.startTime || "06:00";
    tentativeEndTime = initial.endTime || "06:00";
    tentativeAllDay = !!initial.allDay;

    updateLabels();
    popup.classList.add('active');

    allDayCheck.addEventListener('change', handleAllDayChange);
    startDateBtn.addEventListener('click', handleStartDateClick);
    endDateBtn.addEventListener('click', handleEndDateClick);
    startTimeBtn.addEventListener('click', handleStartTimeClick);
    endTimeBtn.addEventListener('click', handleEndTimeClick);
    cancelBtn.addEventListener('click', handleCancel);
    okBtn.addEventListener('click', handleOk);
    popup.addEventListener('click', handleBackdropClick);
}
