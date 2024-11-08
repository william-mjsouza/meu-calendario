// Importa as novas funções que criei para manipular datas
import { getDayOfWeek, getDaysInMonth, getMonthName } from './newDateFunctions.js';
// Importa a função de exibição do pop-up de adicionar evento no calendário
import { openPopup } from './addEvent.js';

// Pega o ano, mês e dia atuais
const currentDate = new Date();
const YEAR = currentDate.getFullYear();
const MONTH = currentDate.getMonth() + 1; // getMonth() retorna o mês de 0 a 11, então adicionamos 1
const DAY = currentDate.getDate();

// Captura os botões
const previousButton = document.querySelector('.previous-month');
const nextButton = document.querySelector('.next-month');


// Função para lidar com o toque em um dia do mês atual (para smartphones e tablets)
function handleDayTouch(event) {
    const dayClicked = event.target.textContent;

    // Previne o comportamento padrão para evitar que "tap-and-hold" interfira
    event.preventDefault();

    // Define a cor de fundo ao iniciar o toque
    event.target.style.backgroundColor = 'var(--days-clicked-bg-color)';

    function handleTouchEnd() {
        // Volta à cor original
        event.target.style.backgroundColor = 'var(--days-bg-color)';
        
        // Abre o popup com a data
        openPopup(dayClicked, MONTH, YEAR);

        // Remove os event listeners após o toque
        removeTouchListeners();
    }

    function handleTouchCancel() {
        // Volta à cor original se o toque for cancelado
        event.target.style.backgroundColor = 'var(--days-bg-color)';

        // Remove os event listeners
        removeTouchListeners();
    }

    function handleTouchMove(moveEvent) {
        const touch = moveEvent.touches[0];
        const targetRect = event.target.getBoundingClientRect();

        // Verifica se o toque ainda está dentro dos limites do elemento
        if (
            touch.clientX < targetRect.left ||
            touch.clientX > targetRect.right ||
            touch.clientY < targetRect.top ||
            touch.clientY > targetRect.bottom
        ) {
            handleTouchCancel();
        }
    }

    function removeTouchListeners() {
        event.target.removeEventListener('touchend', handleTouchEnd);
        event.target.removeEventListener('touchcancel', handleTouchCancel);
        event.target.removeEventListener('touchmove', handleTouchMove);
    }

    // Adiciona event listeners para touchend, touchcancel e touchmove
    event.target.addEventListener('touchend', handleTouchEnd, { passive: true });
    event.target.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    event.target.addEventListener('touchmove', handleTouchMove, { passive: true });
}


// Função para lidar com o clique em um dia do mês atual (para computadores)
function handleDayClick(event) {
    // Se o botão pressionado do mouse não foi o esquerdo
    if (event.button !== 0) {
        return; // Não faz nada
    }

    const dayClicked = event.target.textContent;
    
    // Adiciona a cor de fundo ao pressionar o botão do mouse ou dedo
    event.target.style.backgroundColor = 'var(--days-clicked-bg-color)';

    // Remover a cor de fundo ao soltar o botão do mouse
    function handleMouseUp() {
        event.target.style.backgroundColor = 'var(--days-bg-color)'; // Volta à cor original
        // Chama a função para abrir o pop-up e passa a data
        openPopup(dayClicked, MONTH, YEAR);
        // Remove os event listeners após o clique
        event.target.removeEventListener('mouseup', handleMouseUp);
        event.target.removeEventListener('mouseleave', handleMouseLeave);
    }

    // Remove a cor de fundo se o mouse for movido para fora antes de soltar
    function handleMouseLeave() {
        event.target.style.backgroundColor = 'var(--days-bg-color)'; // Volta à cor original
        event.target.removeEventListener('mouseup', handleMouseUp);
        event.target.removeEventListener('mouseleave', handleMouseLeave);
    }

    event.target.addEventListener('mouseup', handleMouseUp);
    event.target.addEventListener('mouseleave', handleMouseLeave);
}


function showCalendar(day, month, year) {
    const calendarTitle = document.querySelector('.calendar-title');
    const monthElement = document.querySelector('.month');
    const daysCells = monthElement.querySelectorAll('.days');

    const dayOfWeek = getDayOfWeek(year, month, 1); // Dia da semana do primeiro dia do mês
    const daysInMonth = getDaysInMonth(year, month); // Total de dias no mês
    const daysInPreviousMonth = getDaysInMonth(year, month - 1); // Total de dias no mês anterior

    // Atualiza o título do calendário com o mês e o ano
    calendarTitle.textContent = `${getMonthName(month)} de ${year}`;

    let dayCounter = 1;

    // Limpa as células antes de preencher
    daysCells.forEach(cell => {
        // Remove o conteúdo anterior
        cell.textContent = '';
        // Remove os estilos anteriores
        cell.style.backgroundColor = '';
        cell.style.color = '';
        cell.style.border = '';
        cell.style.boxShadow = '';
        // Remove os escutadores de eventos antigos
        cell.removeEventListener('mousedown', handleDayClick);
        cell.removeEventListener('touchstart', handleDayTouch);
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
        if (dayCounter === day && month === MONTH && year === YEAR) {
            daysCells[i].style.border = '1px solid #899DD9';    // Borda azul clara para o dia atual
            daysCells[i].style.boxShadow = '0 0 0 2px #899DD9 inset';   // box-shadow interno para criar um efeito de borda ("engrossa" a borda sem afetar o layout)
        }

        // Adiciona um escutador de evento de segurar clique/ toque para os dias do mês atual
        daysCells[i].addEventListener('mousedown', handleDayClick);    // Mouse segurando
        daysCells[i].addEventListener('touchstart', handleDayTouch);    // Toque físico segurando (para celulares/ tablets)

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


function main() {
    // Inicialização das variáveis de controle do mês e ano
    let newCurrentMonth = MONTH; // Mês atual
    let newCurrentYear = YEAR; // Ano atual

    // Atualiza a exibição do calendário
    function updateCalendar() {
        showCalendar(DAY, newCurrentMonth, newCurrentYear); // Atualiza o calendário com os novos valores de mês e ano
    }

    // Evento de clique para o botão anterior
    previousButton.addEventListener('click', () => {
        if (newCurrentMonth === 1) {
            newCurrentMonth = 12; // Se estiver em janeiro, vai para dezembro
            newCurrentYear--; // Diminui o ano
        } else {
            newCurrentMonth--; // Apenas diminui o mês
        }
        updateCalendar(); // Atualiza o calendário
    });

    // Evento de clique para o botão seguinte
    nextButton.addEventListener('click', () => {
        if (newCurrentMonth === 12) {
            newCurrentMonth = 1; // Se estiver em dezembro, vai para janeiro
            newCurrentYear++; // Aumenta o ano
        } else {
            newCurrentMonth++; // Apenas aumenta o mês
        }
        updateCalendar(); // Atualiza o calendário
    });

    // Inicializa o calendário na primeira chamada com o mês e o ano atuais
    showCalendar(DAY, MONTH, YEAR);
}


// Chama a função main ao carregar o script
main();