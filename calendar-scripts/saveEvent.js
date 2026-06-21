// Importa a função que garante que a data esteja no formato DD/MM/AAAA
import { formatDate } from './newDateFunctions.js'

// Importa a função de abrir o pop-up de selecionar a cor do evento
import { openColorPickerPopup, colorPickerButton, saveEventFormGroup1 } from './selectEventColor.js';

// Importa as funções e o estado relacionados à configuração de repetição
import { openRepetitionConfigPopup, repetitionState, resetRepetitionState, getFrequencyLabel } from './configureRepetition.js';

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

// Referência ao evento que está sendo editado (null = criação de um novo evento)
let editingEvent = null;

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

    // Coleta os dados atualizados a partir do formulário
    const eventData = {
        title: eventName.value,
        description: eventDescription.value,
        start_date: new Date(calendarState.year, calendarState.month - 1, calendarState.day), // Mês 0-indexado no Date
        frequency: repetitionState.frequency,
        end_date: repetitionState.end_date,
        // Lê via getComputedStyle para garantir que a cor já venha resolvida em RGB,
        // mesmo quando o botão ainda está com a cor padrão definida via var(--...) no CSS
        color: getComputedStyle(colorPickerButton).backgroundColor,
        // Guarda também a cor do grupo (faixa colorida no topo do formulário) para restaurar ao editar
        formGroupColor: saveEventFormGroup1.style.backgroundColor
    };

    if (editingEvent) {
        // Atualiza o evento existente preservando a posição no array
        Object.assign(editingEvent, eventData);
    } else {
        // Cria um novo evento
        calendarState.dayEvents.push(eventData);
    }
    console.log(calendarState.dayEvents);

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
    } else {
        // Modo criação: limpa todos os campos e reseta o estado de repetição
        editingEvent = null;
        eventName.value = '';
        eventDescription.value = '';
        colorPickerButton.style.backgroundColor = '';      // Volta à cor padrão definida no CSS
        saveEventFormGroup1.style.backgroundColor = '';    // Volta à cor padrão definida no CSS
        resetRepetitionState();
    }

    // Restaura o placeholder do título caso tenha sido trocado pela mensagem de validação
    eventName.placeholder = 'Título';

    // Mostra o pop-up
    saveEventPopup.classList.add('active');

    // Atualiza a data e o ícone de recorrência do evento
    dateTime[0].textContent = formatDate(`${calendarState.day}/${calendarState.month}/${calendarState.year}`);
    updateFrequencyLabel(); // Mostra/oculta o ícone de recorrência conforme a frequência atual

    // Adiciona o evento de clique no botão de selecionar cor para abrir o pop-up de selecionar a cor do evento
    colorPickerButton.addEventListener('click', openColorPickerPopup);

    // Adiciona o evento de clique na caixa de data/frequência para abrir o pop-up de configuração de repetição
    // Ao fechar o pop-up, sincroniza o rótulo da frequência com o que foi escolhido
    eventDateTime.addEventListener('click', handleDateTimeClick);

    // Adiciona um escutador de evento de submissão no próprio formulário para tratar o envio dele
    saveEventForm.addEventListener("submit", handleSaveEventSubmit);
}
