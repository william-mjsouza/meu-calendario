// Importa as novas funções que criei para manipular datas
import { getDayOfWeek, getDayOfWeekName, getMonthName } from './newDateFunctions.js';

// Seleciona calendário, o pop-up de adicionar evento no calendário e a sobreposição
const calendar = document.querySelector('.calendar');
const popupAddEvent = document.querySelector('.add-event');
const overlay = document.createElement('div');

// Função para abrir o pop-up com a data especificada
export function openPopup(day, month, year) {
    // Escurece o calendário
    overlay.classList.add('overlay');
    calendar.appendChild(overlay);

    // Exibe a data no pop-up
    let dayOfWeek = getDayOfWeek(year, month, day);
    let dayOfWeekName = getDayOfWeekName(dayOfWeek);
    document.querySelector('.event-date').textContent = `${dayOfWeekName}, ${day} de ${getMonthName(month)}`;

    // Mostra o pop-up e a sobreposição
    popupAddEvent.classList.add('active');
    overlay.classList.add('active');

    // Adiciona o evento de clique para fechar o pop-up
    overlay.addEventListener('click', closePopup);
}

// Função para fechar o pop-up
function closePopup() {
    popupAddEvent.classList.remove('active');
    overlay.classList.remove('active');
}