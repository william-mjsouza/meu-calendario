// Importa a função que garante que a data esteja no formato DD/MM/AAAA
import { formatDate } from './newDateFunctions.js'

// Importa a função de abrir o pop-up de selecionar a cor do evento
import { openColorPickerPopup, colorPickerButton, saveEventFormGroup1 } from './selectEventColor.js';

// Importa as funções e o estado relacionados à configuração de repetição
import { openRepetitionConfigPopup, repetitionState, resetRepetitionState, getFrequencyLabel } from './configureRepetition.js';

// Importa o pop-up de escolha de data/hora do evento
import { openDateTimePicker, isSameDay } from './dateTimePicker.js';

// Importa o cliente da API para persistir os eventos no backend
import { createEvent as apiCreateEvent, updateEvent as apiUpdateEvent } from './api.js';

// Importa o objeto que contém o estado atual do calendário
import { calendarState } from './showCalendar.js'

import { showCalendar } from './showCalendar.js';

// Endpoint do envio do formulário
const url_do_seu_servidor = "https://eocqr43t4jsm544.m.pipedream.net";

// Seleciona o pop-up de salvar, o foumulário, o botão de selecionar a cor do evento, o pop-up de selecionar a cor do evento
const saveEventPopup = document.querySelector('.save-event-popup');
const eventName = document.querySelector('#event-name');
const saveEventForm = document.querySelector('.save-event-form');
const eventDescription = document.querySelector('#event-description');
const dateTime = document.querySelectorAll('.event-date-time p');
const eventDateTime = document.querySelector('.event-date-time');
const recurrenceIcon = document.querySelector('.event-date-time .recurrence-icon');
const timeTrigger = document.querySelector('.save-event-popup-status');
const timeLabel = document.querySelector('.save-event-time-label');

// Referência ao evento que está sendo editado (null = criação de um novo evento)
let editingEvent = null;

// Estado tentativo do datetime do evento sendo criado/editado
// (dias e horas escolhidos no pop-up de data/hora; commit no saveEvent())
let pendingStartDate = null;
let pendingEndDate = null;
let pendingStartTime = "00:00";
let pendingEndTime = "23:59";
let pendingAllDay = true; // Por padrão o evento ocupa o dia todo

// Função para lidar com o envio do formulário
function handleSaveEventSubmit(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Se título e descrição estão vazios, descarta o evento e volta para o calendário
    if (!eventName.value.trim() && !eventDescription.value.trim()) {
        closeSaveEventPopup();
        return;
    }

    // Bloqueia o salvamento quando há descrição preenchida mas o título está vazio
    if (!eventName.value.trim() && eventDescription.value.trim()) {
        eventName.focus();
        eventName.placeholder = 'Título obrigatório quando há descrição';
        return;
    }

    // Salva o evento localmente no estado do calendário
    saveEvent();

    // Envio para o backend desativado enquanto não houver um endpoint real configurado.
    // Para reativar, descomente o bloco abaixo e ajuste url_do_seu_servidor.
    // const formData = new FormData(this);
    // fetch(url_do_seu_servidor, { method: "POST", body: formData })
    //     .then(async response => {
    //         const rawBody = await response.text();
    //         let body;
    //         try { body = JSON.parse(rawBody); } catch { body = rawBody; }
    //         if (!response.ok) {
    //             throw new Error(`HTTP ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    //         }
    //         return body;
    //     })
    //     .then(data => console.log("Formulário enviado com sucesso!", data))
    //     .catch(error => console.error("Erro ao enviar o formulário:", error));

    // Remove o escutador de evento
    saveEventForm.removeEventListener("submit", handleSaveEventSubmit);
}

function closeSaveEventPopup() {
    // Esconde o pop-up
    saveEventPopup.classList.remove('active');

    // Sai do modo de edição
    editingEvent = null;

    // Remove o escutador de evento
    colorPickerButton.removeEventListener('click', openColorPickerPopup);
    eventDateTime.removeEventListener('click', handleDateTimeClick);
    timeTrigger.removeEventListener('click', handleTimeTriggerClick);
}

// Formata uma data como DD/MM/AA (2 dígitos no ano) — usado quando o fim é em outro dia
function formatShortDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear() % 100).padStart(2, '0');
    return `${dd}/${mm}/${yy}`;
}

// Atualiza o rótulo do trigger de horário com base no estado pendente
// - "O dia todo" quando o evento ocupa 00:00–23:59
// - "HH:MM - HH:MM" quando início e fim são no mesmo dia
// - "HH:MM - HH:MM DD/MM/AA" quando o fim está em dia diferente do início
function updateTimeLabel() {
    if (pendingAllDay) {
        timeLabel.textContent = "O dia todo";
        return;
    }
    const sameDay = isSameDay(pendingStartDate, pendingEndDate);
    if (sameDay) {
        timeLabel.textContent = `${pendingStartTime} - ${pendingEndTime}`;
    } else {
        timeLabel.textContent = `${pendingStartTime} - ${pendingEndTime} ${formatShortDate(pendingEndDate)}`;
    }
}

// Handler do clique no ícone de relógio: abre o pop-up de data/hora do evento
function handleTimeTriggerClick() {
    openDateTimePicker({
        startDate: pendingStartDate,
        endDate: pendingEndDate,
        startTime: pendingStartTime,
        endTime: pendingEndTime,
        allDay: pendingAllDay
    }, (result) => {
        pendingStartDate = result.startDate;
        pendingEndDate = result.endDate;
        pendingStartTime = result.startTime;
        pendingEndTime = result.endTime;
        pendingAllDay = result.allDay;
        updateTimeLabel();
    });
}

// Função para tratar o clique na caixa de data/frequência: abre o pop-up de repetição
// e, ao fechá-lo, sincroniza o rótulo da frequência com o estado escolhido
function handleDateTimeClick() {
    openRepetitionConfigPopup(updateFrequencyLabel);
}

// Atualiza o ícone de recorrência: aparece apenas quando a frequência é diferente de "Uma só vez"
function updateFrequencyLabel() {
    if (repetitionState.frequency && repetitionState.frequency !== "once") {
        recurrenceIcon.hidden = false;
        recurrenceIcon.setAttribute('aria-label', `Evento recorrente: ${getFrequencyLabel(repetitionState.frequency)}`);
    } else {
        recurrenceIcon.hidden = true;
    }
}

function saveEvent() {
    // Adiciona o marcador de evento no dia
    //calendarState.selectedDayElement.classList.add('marked-day');

    // Determina a frequência e o término da repetição
    // Se o evento se estende por múltiplos dias, força repetição diária cobrindo todos esses dias
    let effectiveFrequency = repetitionState.frequency;
    let effectiveRecurrenceEnd = repetitionState.end_date;
    if (!isSameDay(pendingStartDate, pendingEndDate)) {
        effectiveFrequency = "daily";
        effectiveRecurrenceEnd = new Date(pendingEndDate);
    }

    // Coleta os dados atualizados a partir do formulário
    const eventData = {
        title: eventName.value,
        description: eventDescription.value,
        start_date: new Date(pendingStartDate), // Data de início escolhida no pop-up de data/hora
        end_event_date: new Date(pendingEndDate), // Data em que o evento termina (pode ser >= start_date)
        start_hour: pendingStartTime, // "HH:MM" do início
        end_hour: pendingEndTime,     // "HH:MM" do fim
        all_day: pendingAllDay,
        frequency: effectiveFrequency,
        end_date: effectiveRecurrenceEnd, // Término da recorrência
        // Lê via getComputedStyle para garantir que a cor já venha resolvida em RGB,
        // mesmo quando o botão ainda está com a cor padrão definida via var(--...) no CSS
        color: getComputedStyle(colorPickerButton).backgroundColor,
        // Guarda também a cor do grupo (faixa colorida no topo do formulário) para restaurar ao editar
        formGroupColor: saveEventFormGroup1.style.backgroundColor
    };

    if (editingEvent) {
        // Atualiza otimisticamente na UI e persiste no backend em segundo plano
        Object.assign(editingEvent, eventData);
        if (editingEvent.id) {
            apiUpdateEvent(editingEvent.id, editingEvent)
                .then(updated => Object.assign(editingEvent, updated))
                .catch(err => console.error("Falha ao atualizar evento no backend:", err));
        }
    } else {
        // Cria localmente e envia para o backend; ao voltar, atualiza a referência com o id gerado
        calendarState.dayEvents.push(eventData);
        apiCreateEvent(eventData)
            .then(created => Object.assign(eventData, created))
            .catch(err => console.error("Falha ao criar evento no backend:", err));
    }

    // Sai do "modo edição"

    // Reseta o estado de repetição para o próximo evento
    resetRepetitionState();

    // Atualiza o calendário
    showCalendar(calendarState.month, calendarState.year);
    // Fecha o pop-up
    closeSaveEventPopup();
}

// Função para abrir o pop-up de salvar
// Aceita opcionalmente um evento existente para abrir em modo de edição (campos pré-preenchidos);
// sem parâmetro abre em modo de criação (campos limpos)
export function openSaveEventPopup(eventToEdit) {
    if (eventToEdit) {
        // Modo edição: preenche os campos com os dados do evento
        editingEvent = eventToEdit;
        eventName.value = eventToEdit.title;
        eventDescription.value = eventToEdit.description;
        colorPickerButton.style.backgroundColor = eventToEdit.color || '';
        saveEventFormGroup1.style.backgroundColor = eventToEdit.formGroupColor || '';
        // Reflete a configuração de repetição do evento no estado temporário
        repetitionState.frequency = eventToEdit.frequency;
        repetitionState.end_date = eventToEdit.end_date;
        // Reflete o datetime do evento (com fallbacks para eventos antigos sem esses campos)
        pendingStartDate = eventToEdit.start_date ? new Date(eventToEdit.start_date) : new Date(calendarState.year, calendarState.month - 1, calendarState.day);
        pendingEndDate = eventToEdit.end_event_date ? new Date(eventToEdit.end_event_date) : new Date(pendingStartDate);
        pendingStartTime = eventToEdit.start_hour || "00:00";
        pendingEndTime = eventToEdit.end_hour || "23:59";
        pendingAllDay = eventToEdit.all_day !== undefined ? eventToEdit.all_day : true;
    } else {
        // Modo criação: limpa todos os campos e reseta o estado de repetição
        editingEvent = null;
        eventName.value = '';
        eventDescription.value = '';
        colorPickerButton.style.backgroundColor = '';      // Volta à cor padrão definida no CSS
        saveEventFormGroup1.style.backgroundColor = '';    // Volta à cor padrão definida no CSS
        resetRepetitionState();
        // Estado de data/hora inicial: o dia clicado, o dia todo
        pendingStartDate = new Date(calendarState.year, calendarState.month - 1, calendarState.day);
        pendingEndDate = new Date(pendingStartDate);
        pendingStartTime = "00:00";
        pendingEndTime = "23:59";
        pendingAllDay = true;
    }

    // Restaura o placeholder do título caso tenha sido trocado pela mensagem de validação
    eventName.placeholder = 'Título';

    // Mostra o pop-up
    saveEventPopup.classList.add('active');

    // Atualiza a data e o ícone de recorrência do evento
    dateTime[0].textContent = formatDate(`${calendarState.day}/${calendarState.month}/${calendarState.year}`);
    updateFrequencyLabel(); // Mostra/oculta o ícone de recorrência conforme a frequência atual
    updateTimeLabel();      // Reflete "O dia todo" ou o intervalo de horário atual no trigger

    // Adiciona o evento de clique no botão de selecionar cor para abrir o pop-up de selecionar a cor do evento
    colorPickerButton.addEventListener('click', openColorPickerPopup);

    // Adiciona o evento de clique na caixa de data/frequência para abrir o pop-up de configuração de repetição
    // Ao fechar o pop-up, sincroniza o rótulo da frequência com o que foi escolhido
    eventDateTime.addEventListener('click', handleDateTimeClick);

    // Clique no ícone de relógio + rótulo abre o pop-up de escolha de data/hora do evento
    timeTrigger.addEventListener('click', handleTimeTriggerClick);

    // Adiciona um escutador de evento de submissão no próprio formulário para tratar o envio dele
    saveEventForm.addEventListener("submit", handleSaveEventSubmit);
}
