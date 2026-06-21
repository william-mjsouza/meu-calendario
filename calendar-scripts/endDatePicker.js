// Importa as novas funções que criei para manipular datas
import { getDayOfWeek, getDaysInMonth, getMonthName } from './newDateFunctions.js';

// Nomes abreviados dos dias da semana, usados no cabeçalho do picker
const weekdayShort = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."];
// Nomes abreviados dos meses, usados na exibição da data selecionada
const monthShort = [
    "jan.", "fev.", "mar.", "abr.", "mai.", "jun.",
    "jul.", "ago.", "set.", "out.", "nov.", "dez."
];

// Estado interno do picker
let viewYear = 0;       // Ano do mês exibido na grade
let viewMonth = 0;      // Mês (1-indexado) exibido na grade
let selectedDate = null; // Data atualmente selecionada (Date | null)
let onConfirmCallback = null; // Callback invocado ao clicar em OK

// Seleciona os elementos do pop-up
const popup = document.querySelector('.end-date-picker-popup');
const yearLabel = document.querySelector('.end-date-picker-year');
const selectedLabel = document.querySelector('.end-date-picker-selected');
const monthTitle = document.querySelector('.end-date-picker-month-title');
const grid = document.querySelector('.end-date-picker-grid');
const prevButton = document.querySelector('.end-date-picker-prev');
const nextButton = document.querySelector('.end-date-picker-next');
const cancelButton = document.querySelector('.end-date-picker-cancel');
const okButton = document.querySelector('.end-date-picker-ok');

// Atualiza o cabeçalho (ano e data selecionada por extenso, ex.: "Dom., 21 de jun.")
function updateHeader() {
    if (selectedDate) {
        yearLabel.textContent = selectedDate.getFullYear();
        const weekday = weekdayShort[selectedDate.getDay()];
        const day = selectedDate.getDate();
        const month = monthShort[selectedDate.getMonth()];
        selectedLabel.textContent = `${weekday}, ${day} de ${month}`;
    } else {
        yearLabel.textContent = viewYear;
        selectedLabel.textContent = 'Selecionar data';
    }
}

// Renderiza a grade de dias do mês atualmente em visualização
function renderGrid() {
    monthTitle.textContent = `${getMonthName(viewMonth).toLowerCase()} de ${viewYear}`;
    grid.innerHTML = '';

    const firstDayOfWeek = getDayOfWeek(viewYear, viewMonth, 1);
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);

    // Células vazias antes do dia 1 (para alinhar o primeiro dia ao dia da semana correto)
    for (let i = 0; i < firstDayOfWeek; i++) {
        const empty = document.createElement('button');
        empty.type = 'button';
        empty.classList.add('end-date-picker-day', 'empty');
        empty.disabled = true;
        grid.appendChild(empty);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.classList.add('end-date-picker-day');
        dayButton.textContent = day;

        // Destaca o dia selecionado quando for o mês/ano visualizado
        if (
            selectedDate &&
            selectedDate.getFullYear() === viewYear &&
            selectedDate.getMonth() === viewMonth - 1 &&
            selectedDate.getDate() === day
        ) {
            dayButton.classList.add('selected');
        }

        dayButton.addEventListener('click', () => {
            selectedDate = new Date(viewYear, viewMonth - 1, day);
            updateHeader();
            renderGrid(); // Re-renderiza para atualizar o destaque do dia selecionado
        });

        grid.appendChild(dayButton);
    }
}

// Vai para o mês anterior
function goToPreviousMonth() {
    if (viewMonth === 1) {
        viewMonth = 12;
        viewYear--;
    } else {
        viewMonth--;
    }
    renderGrid();
}

// Vai para o próximo mês
function goToNextMonth() {
    if (viewMonth === 12) {
        viewMonth = 1;
        viewYear++;
    } else {
        viewMonth++;
    }
    renderGrid();
}

// Fecha o pop-up e remove os escutadores de evento
function closeEndDatePicker() {
    popup.classList.remove('active');
    prevButton.removeEventListener('click', goToPreviousMonth);
    nextButton.removeEventListener('click', goToNextMonth);
    cancelButton.removeEventListener('click', handleCancel);
    okButton.removeEventListener('click', handleOk);
    popup.removeEventListener('click', handleBackdropClick);
    onConfirmCallback = null;
}

// Cancela a seleção: fecha sem chamar o callback
function handleCancel() {
    closeEndDatePicker();
}

// Confirma a seleção: chama o callback com a data escolhida (ou null se nenhuma)
function handleOk() {
    if (typeof onConfirmCallback === 'function') {
        onConfirmCallback(selectedDate);
    }
    closeEndDatePicker();
}

// Clique no backdrop (fora do cartão) também cancela
function handleBackdropClick(event) {
    if (event.target === popup) {
        closeEndDatePicker();
    }
}

// Função para abrir o pop-up de escolha da data de término
// initialDate: Date ou null com a data inicialmente selecionada
// onConfirm: callback invocado com a data escolhida ao clicar em OK (recebe Date ou null)
export function openEndDatePicker(initialDate, onConfirm) {
    onConfirmCallback = onConfirm;
    selectedDate = initialDate ? new Date(initialDate) : null;

    // Inicializa a visualização no mês da data selecionada (ou no mês atual se nada estiver selecionado)
    const reference = selectedDate || new Date();
    viewYear = reference.getFullYear();
    viewMonth = reference.getMonth() + 1;

    updateHeader();
    renderGrid();

    popup.classList.add('active');

    // Adiciona os escutadores de evento
    prevButton.addEventListener('click', goToPreviousMonth);
    nextButton.addEventListener('click', goToNextMonth);
    cancelButton.addEventListener('click', handleCancel);
    okButton.addEventListener('click', handleOk);
    popup.addEventListener('click', handleBackdropClick);
}
