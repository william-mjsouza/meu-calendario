// Importa as novas funções que criei para manipular datas
import { getDayOfWeek } from './newDateFunctions.js';

// Importa o objeto que contém o estado atual do calendário
import { calendarState } from './showCalendar.js'

// Função que retorna todos os eventos que ocorrem em um dia específico (considerando as repetições)
// Os parâmetros day, month, year vêm com o mês 1-indexado (1 = janeiro, ..., 12 = dezembro)
export function getEventsForDay(day, month, year) {
    // Filtra os eventos armazenados no calendário
    return calendarState.dayEvents.filter(event => {
        const eventDate = event.start_date;
        const eventEndDate = event.end_date; // Data de término da repetição (pode ser null = "Nunca")
        const currentDate = new Date(year, month - 1, day); // Mês 0-indexado no Date

        // Antes da data de início: nunca exibe o evento
        if (currentDate < new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())) {
            return false;
        }

        // Depois da data de término (se houver): nunca exibe o evento
        if (eventEndDate && currentDate > new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate())) {
            return false;
        }

        // Verifica se o dia atual é exatamente o dia de início do evento
        const isStartDay = (
            eventDate.getFullYear() === year &&
            eventDate.getMonth() === month - 1 &&
            eventDate.getDate() === day
        );

        // Eventos "Uma só vez" só aparecem no dia de início
        if (event.frequency === "once") {
            return isStartDay;
        }

        // No dia de início, qualquer evento recorrente também aparece
        if (isStartDay) {
            return true;
        }

        // Diferença em dias entre a data atual e a data de início (usada para frequências recorrentes)
        const startDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const timeDifference = currentDate.getTime() - startDateOnly.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        if (event.frequency === "daily") {
            // Eventos diários ocorrem todos os dias a partir da data de início
            return true;

        } else if (event.frequency === "weekly") {
            // Eventos semanais: mesmo dia da semana da data de início
            if (getDayOfWeek(year, month, day) !== getDayOfWeek(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate())) {
                return false;
            }
            return daysDifference % 7 === 0;

        } else if (event.frequency === "biweekly") {
            // Eventos quinzenais: mesmo dia da semana e diferença em semanas par
            if (getDayOfWeek(year, month, day) !== getDayOfWeek(eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate())) {
                return false;
            }
            return daysDifference % 14 === 0;

        } else if (event.frequency === "monthly") {
            // Eventos mensais: ocorre no mesmo dia do mês da data de início
            return eventDate.getDate() === day;

        } else if (event.frequency === "yearly") {
            // Eventos anuais: ocorre no mesmo dia e mês da data de início
            return eventDate.getDate() === day && eventDate.getMonth() === month - 1;
        }

        return false; // Caso a frequência não seja reconhecida
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
