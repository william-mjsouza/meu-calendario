// Importa a função que garante que a data esteja no formato DD/MM/AAAA
import { formatDate } from './newDateFunctions.js'

// Importa a função de abrir o pop-up de selecionar a cor do evento
import { openColorPickerPopup, colorPickerButton } from './selectEventColor.js';

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

// Função para lidar com o envio do formulário
function handleSaveEventSubmit(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    console.log("Código adicional executado!"); // Só pra testar
    saveEvent();    // Só pra testar

    // Coleta os dados do formulário
    const formData = new FormData(this);

    // Envia os dados com AJAX
    fetch(url_do_seu_servidor, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("Formulário enviado com sucesso!", data);
        // Aqui você pode executar código adicional após o envio, como atualizar a interface
        //saveEvent();
    })
    .catch(error => {
        console.error("Erro ao enviar o formulário:", error);
    });

    // Remove o escutador de evento
    saveEventForm.removeEventListener("submit", handleSaveEventSubmit);
}

function closeSaveEventPopup() {
    // Esconde o pop-up
    saveEventPopup.classList.remove('active');

    // Remove o escutador de evento
    colorPickerButton.removeEventListener('click', openColorPickerPopup);
}

function saveEvent() {
    // Adiciona o marcador de evento no dia
    //calendarState.selectedDayElement.classList.add('marked-day');
    
    // Cria o objeto do evento com os dados coletados do formulário
    const dayEvent = {
        title: eventName.value,
        description: eventDescription.value,
        start_date: new Date(calendarState.year, calendarState.month, calendarState.day),   // A data é pega automaticamente
        frequency: "weekly",
        end_date: null,  // Pode ser definido se houver um campo de data final
        color: colorPickerButton.style.backgroundColor
    };

    // Adiciona o evento ao array de eventos
    calendarState.dayEvents.push(dayEvent);
    console.log(calendarState.dayEvents);
    
    // Sai do "modo edição"

    // Atualiza o calendário
    showCalendar(calendarState.month, calendarState.year);
    // Fecha o pop-up
    closeSaveEventPopup();
}

// Função para abrir o pop-up de salvar
export function openSaveEventPopup() {
    // Mostra o pop-up
    saveEventPopup.classList.add('active');

    // Atualiza a data e hora do evento
    dateTime[0].textContent = formatDate(`${calendarState.day}/${calendarState.month}/${calendarState.year}`);
    dateTime[1].textContent = 'Manhã'   // Valor padrão

    // Adiciona o evento de clique no botão de selecionar cor para abrir o pop-up de selecionar a cor do evento
    colorPickerButton.addEventListener('click', openColorPickerPopup);

    // Adiciona um escutador de evento de submissão no próprio formulário para tratar o envio dele
    saveEventForm.addEventListener("submit", handleSaveEventSubmit);
}