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


function getMonthName(month) {
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return monthNames[month - 1];
}


function showCalendar(day, month, year) {
    const calendarTitle = document.querySelector('.calendar-title');
    const monthElement = document.querySelector('.month');
    const daysCells = monthElement.querySelectorAll('.days');

    const dayOfWeek = getDayOfWeek(year, month); // Dia da semana do primeiro dia do mês
    const daysInMonth = getDaysInMonth(year, month); // Total de dias no mês
    const daysInPreviousMonth = getDaysInMonth(year, month - 1); // Total de dias no mês anterior

    // Atualiza o título do calendário com o mês e o ano
    calendarTitle.textContent = `${getMonthName(month)} de ${year}`;

    let dayCounter = 1;

    // Limpa as células antes de preencher
    daysCells.forEach(cell => {
        cell.textContent = ''; // Remove o conteúdo anterior
        cell.style.backgroundColor = ''; // Remove a cor de de fundo anterior
        cell.style.color = '';  // Remove a cor do texto anterior
        cell.style.border = ''; // Remove qualquer borda anterior
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
        
        const currentDayOfWeek = (i % 7);
        // Pinta o texto dos dias de domingo com vermelho
        if (currentDayOfWeek === 0) {
            daysCells[i].style.color = 'var(--sun-color)';
        }
        // Pinta o texto dos dias de sábado com azul
        else if (currentDayOfWeek === 6) {
            daysCells[i].style.color = 'var(--sat-color)';
        }

        // Verifica se é o dia atual e adiciona o estilo de borda
        if (dayCounter === day) {
            daysCells[i].style.border = '3px solid #899DD9'; // Borda grossa e azul clara para o dia atual
        }

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


// Pega o ano, mês e dia atuais
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // getMonth() retorna o mês de 0 a 11, então adicionamos 1
const day = currentDate.getDate();

showCalendar(day, month, year);