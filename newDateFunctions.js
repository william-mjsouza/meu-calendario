export function getDayOfWeek(year, month, day) {
    // Cria um objeto Date para o primeiro dia do mês
    // Lembre-se que o mês em JavaScript é 0-indexado (0 = janeiro, 1 = fevereiro, ..., 11 = dezembro)
    const data = new Date(year, month - 1, day);

    // Obtém o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
    const dayOfWeek = data.getDay();

    // Retorna o dia da semana do primeiro dia do determinado mês do derminado ano
    return dayOfWeek;
}


export function getDayOfWeekName(dayOfWeek) {
    const dayOfWeekNames = [
        "dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."
    ];
    return dayOfWeekNames[dayOfWeek];
}


export function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate(); // Retorna o número de dias do mês
}


export function getMonthName(month) {
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return monthNames[month - 1];
}