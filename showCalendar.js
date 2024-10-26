function getDayOfWeek(year, month) {
    // Cria um objeto Date para o primeiro dia do mês
    // Lembre-se que o mês em JavaScript é 0-indexado (0 = janeiro, 1 = fevereiro, ..., 11 = dezembro)
    const data = new Date(year, month - 1, 1);

    // Obtém o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
    const dayOfWeek = data.getDay();

    // Retorna o dia da semana do primeiro dia do determinado mês do derminado ano
    return dayOfWeek;
}


function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate(); // Retorna o número de dias do mês
}

function showCalendar(year, month) {
    const monthElement = document.querySelector('.month');
    const daysCells = monthElement.querySelectorAll('.days');

    const dayOfWeek = getDayOfWeek(year, month); // Dia da semana do primeiro dia do mês
    const daysInMonth = getDaysInMonth(year, month); // Total de dias no mês
    const daysInPreviousMonth = getDaysInMonth(year, month - 1); // Total de dias no mês anterior

    let dayCounter = 1;

    // Limpa as células antes de preencher
    daysCells.forEach(cell => {
        cell.textContent = ''; // Limpa as células
        cell.style.backgroundColor = ''; // Remove o estilo anterior
    });

    // Preenche as células com os últimos dias do mês anterior
    for (let i = 0; i < dayOfWeek; i++) {
        daysCells[i].textContent = daysInPreviousMonth - dayOfWeek + i + 1; // Últimos dias do mês anterior
        daysCells[i].style.backgroundColor = 'var(--other-days-bg-color)'; // Cor do mês anterior
    }

    // Preenche os dias do mês atual
    for (let i = dayOfWeek; i < dayOfWeek + daysInMonth; i++) {
        daysCells[i].textContent = dayCounter;
        daysCells[i].style.backgroundColor = 'var(--days-bg-color)'; // Cor dos dias do mês atual
        dayCounter++;
    }

    // Preenche as células restantes do próximo mês
    let nextDayCounter = 1;
    for (let i = dayOfWeek + daysInMonth; i < daysCells.length; i++) {
        daysCells[i].textContent = nextDayCounter; // Dias do mês seguinte
        daysCells[i].style.backgroundColor = 'var(--other-days-bg-color)'; // Cor do próximo mês
        nextDayCounter++;
    }
}

// Exemplo de uso
const year = 2024;
const month = 10; // Outubro

showCalendar(year, month);