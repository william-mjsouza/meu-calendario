// Importa as novas funções que criei para manipular datas
import { getDayOfWeek } from './newDateFunctions.js';

// Importa o objeto que contém o estado atual do calendário
import { calendarState } from './showCalendar.js'

export function getEventsForDay(day, month, year) {
    // Filtra os eventos armazenados no calendário
    return calendarState.dayEvents.filter(event => {
        const eventDate = event.start_date;
        const eventEndDate = event.end_date; // Adicionando a data de fim do evento
        const currentDate = new Date(year, month, day); // Ajuste do mês para zero-indexado

        // Verifica se o evento começa no dia atual
        if (
            eventDate.getFullYear() === year &&
            eventDate.getMonth() === month &&
            eventDate.getDate() === day
        ) {
            if (eventEndDate) {
                // Se a data de fim existe, verifica se o dia atual está dentro do intervalo
                return currentDate >= eventDate && currentDate <= eventEndDate;
            } else {
                return true; // Para eventos sem data de fim, considera o evento como válido
            }
        }

        // Implementação para eventos recorrentes
        if (eventEndDate && (currentDate < eventDate || currentDate > eventEndDate)) {
            return false; // Se a data atual não está dentro do intervalo de repetição, descarta
        }

        // Verifica se a data atual é posterior ou igual à data de início do evento
        if (currentDate < eventDate) {
            return false;
        }

        const timeDifference = currentDate.getTime() - eventDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        if (event.frequency === "daily") {
            // Eventos diários ocorrem todos os dias
            return true;

        } else if (event.frequency === "weekly") {
            // Eventos semanais: verifica se o dia da semana é o mesmo
            if (getDayOfWeek(year, month, day) !== getDayOfWeek(event.start_date.getFullYear(), event.start_date.getMonth(), event.start_date.getDate())) {
                return false;
            }
            // Verifica se a diferença em semanas é zero ou um múltiplo de 1
            const weeksDifference = Math.floor(daysDifference / 7);
            return weeksDifference >= 0;

        } else if (event.frequency === "biweekly") {
            // Eventos quinzenais: mesmo dia da semana e diferença em semanas é par
            if (getDayOfWeek(year, month, day) !== getDayOfWeek(event.start_date.getFullYear(), event.start_date.getMonth(), event.start_date.getDate())) {
                return false;
            }
            const weeksDifference = Math.floor(daysDifference / 7);
            return weeksDifference >= 0 && weeksDifference % 2 === 0;

        } else if (event.frequency === "monthly") {
            // Eventos mensais: ocorre no mesmo dia do mês
            return eventDate.getDate() === day;

        } else if (event.frequency === "yearly") {
            // Eventos anuais: ocorre no mesmo dia e mês
            return eventDate.getDate() === day && eventDate.getMonth() === month - 1;
        }

        return false; // Para eventos não recorrentes que não se encaixam nas condições
    });
}

// Função para adicionar marcadores de evento 
export function addMarker(markersContainer, color) {
    const marker = document.createElement("span");
    marker.classList.add("marker");

    // Define a cor do marcador com base no evento
    marker.style.backgroundColor = color;

    const markersNumber = markersContainer.children.length;
    // Preenche a segunda linha do grid primeiro, depois a primeira
    if (markersNumber < 4) {
        marker.style.gridArea = `2 / ${markersNumber + 1}`; // Linha 2, coluna 1 a 4
    } 
    else {
        marker.style.gridArea = `1 / ${markersNumber - 3}`; // Linha 1, coluna 1 a 4
    }

    markersContainer.appendChild(marker);
}