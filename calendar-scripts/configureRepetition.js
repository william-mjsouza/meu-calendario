// Importa as novas funções que criei para manipular datas
import { getDayOfWeek, getMonthName, formatDate } from './newDateFunctions.js';

// Importa o pop-up customizado de escolha da data de término
import { openEndDatePicker } from './endDatePicker.js';

// Nomes completos dos dias da semana (formato exibido na tela de configuração de repetição)
const fullDayOfWeekNames = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"
];

// Importa o objeto que contém o estado atual do calendário
import { calendarState } from './showCalendar.js';

// Mapeamento das frequências para o texto legível exibido ao usuário
const frequencyLabels = {
    "once": "Uma só vez",
    "daily": "Diariamente",
    "weekly": "Semanalmente",
    "biweekly": "Quinzenalmente",
    "monthly": "Mensalmente",
    "yearly": "Anualmente"
};

// Estado temporário com a configuração de repetição escolhida para o evento que está sendo criado
// É lido pelo saveEvent.js no momento de salvar e resetado depois
export const repetitionState = {
    frequency: "once",  // Valor padrão: o evento ocorre uma única vez
    end_date: null      // Sem data de término por padrão ("Nunca")
};

// Data de término escolhida pelo picker mas ainda não confirmada via "Pronto"
// É lida em handleRepetitionSubmit e descartada se o usuário clicar em "Cancelar"
let tentativeEndDate = null;

// Seleciona o pop-up de configuração de repetição e seus elementos internos
const repetitionPopup = document.querySelector('.repetition-config-popup');
const repetitionForm = document.querySelector('.repetition-config-form');
const repetitionWhenWeekday = document.querySelector('.repetition-when-weekday');
const repetitionWhenDateText = document.querySelector('.repetition-when-date-text');
// Wrapper do dropdown customizado que substitui o <select> nativo
const repetitionFrequencyWrapper = document.querySelector('#repetition-frequency');
const repetitionFrequencyTrigger = repetitionFrequencyWrapper.querySelector('.custom-select-trigger');
const repetitionFrequencyValueEl = repetitionFrequencyWrapper.querySelector('.custom-select-value');
const repetitionFrequencyOptionsList = repetitionFrequencyWrapper.querySelector('.custom-select-options');
const repetitionFrequencyOptions = repetitionFrequencyWrapper.querySelectorAll('.custom-select-options li');
// Objeto-façade com API .value (get/set) para o resto do código continuar operando como se
// ainda fosse um <select> nativo
const repetitionFrequency = {
    get value() {
        return repetitionFrequencyWrapper.dataset.value || "once";
    },
    set value(newValue) {
        repetitionFrequencyWrapper.dataset.value = newValue;
        repetitionFrequencyValueEl.textContent = frequencyLabels[newValue] || frequencyLabels["once"];
        repetitionFrequencyOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === newValue);
        });
    },
    addEventListener(event, handler) {
        // Compatibilidade: repassa 'change' para um evento custom disparado quando o valor muda
        repetitionFrequencyWrapper.addEventListener(event, handler);
    },
    removeEventListener(event, handler) {
        repetitionFrequencyWrapper.removeEventListener(event, handler);
    }
};

const repetitionEnd = document.querySelector('.repetition-end');
const repetitionEndText = document.querySelector('.repetition-end-text');
const discardButton = document.querySelector('.discard-repetition-button');
const cancelButton = document.querySelector('.cancel-repetition-button');

// Função que retorna o rótulo legível de uma frequência
export function getFrequencyLabel(frequency) {
    return frequencyLabels[frequency] || frequencyLabels["once"];
}

// Função para resetar o estado de repetição para os valores padrão (chamada ao criar um novo evento)
export function resetRepetitionState() {
    repetitionState.frequency = "once";
    repetitionState.end_date = null;
}

// Atualiza o texto exibido no campo "Término" a partir de uma data (ou "Nunca" se null)
function updateEndDateLabel(date) {
    if (date) {
        repetitionEndText.textContent = formatDate(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`);
    } else {
        repetitionEndText.textContent = "Nunca";
    }
}

// Zera horas/minutos de uma data para fazer comparações apenas pela parte de data
function toDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Encontra a próxima ocorrência do evento que seja >= hoje, com base na frequência informada
// Retorna null quando não houver mais ocorrências (frequência inválida ou "once" no passado)
function findNextOccurrence(start, today, frequency) {
    const DAY_MS = 1000 * 60 * 60 * 24;
    if (frequency === "daily") {
        return today; // Ocorre todos os dias
    }
    if (frequency === "weekly") {
        const daysAhead = (start.getDay() - today.getDay() + 7) % 7;
        return new Date(today.getTime() + daysAhead * DAY_MS);
    }
    if (frequency === "biweekly") {
        const diff = Math.ceil((today.getTime() - start.getTime()) / DAY_MS);
        const cyclesNeeded = Math.max(0, Math.ceil(diff / 14));
        return new Date(start.getTime() + cyclesNeeded * 14 * DAY_MS);
    }
    if (frequency === "monthly") {
        const candidate = new Date(today.getFullYear(), today.getMonth(), start.getDate());
        if (candidate < today) {
            candidate.setMonth(candidate.getMonth() + 1);
        }
        return candidate;
    }
    if (frequency === "yearly") {
        const candidate = new Date(today.getFullYear(), start.getMonth(), start.getDate());
        if (candidate < today) {
            candidate.setFullYear(candidate.getFullYear() + 1);
        }
        return candidate;
    }
    return null;
}

// Gera o rótulo de tempo relativo (ex.: "em 3 dias", "5 dias atrás", "hoje") para a próxima
// ocorrência do evento considerando a frequência e a data de término escolhidas
function getRelativeTimeLabel(startDate, frequency, endDate) {
    const today = toDateOnly(new Date());
    const start = toDateOnly(startDate);

    // Por padrão, compara contra a data de início do evento
    let target = start;

    // Para eventos recorrentes que começam no passado, busca a próxima ocorrência >= hoje
    if (frequency && frequency !== "once" && start < today) {
        const next = findNextOccurrence(start, today, frequency);
        // Se a próxima ocorrência está dentro do intervalo de término, usa-a; caso contrário, mantém a data inicial
        if (next && (!endDate || toDateOnly(next) <= toDateOnly(endDate))) {
            target = next;
        }
    }

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "amanhã";
    if (diffDays === -1) return "ontem";
    if (diffDays > 0) return `em ${diffDays} dias`;
    return `${Math.abs(diffDays)} dias atrás`;
}

// Atualiza a pílula da esquerda do grupo "Quando" com o tempo relativo
function updateRelativeTimeLabel() {
    const startDate = new Date(calendarState.year, calendarState.month - 1, calendarState.day);
    repetitionWhenWeekday.textContent = getRelativeTimeLabel(startDate, repetitionFrequency.value, tentativeEndDate);
}

// Reseta os campos do formulário para os valores padrão
function discardRepetitionFields() {
    repetitionFrequency.value = "once";
    tentativeEndDate = null;
    updateEndDateLabel(null);
    updateRelativeTimeLabel();
}

// Callback opcional executado ao fechar o pop-up (definido em openRepetitionConfigPopup)
let onCloseCallback = null;

// ---- Comportamento do dropdown customizado ----

function openFrequencyDropdown() {
    repetitionFrequencyWrapper.classList.add('open');
    repetitionFrequencyOptionsList.hidden = false;
}

function closeFrequencyDropdown() {
    repetitionFrequencyWrapper.classList.remove('open');
    repetitionFrequencyOptionsList.hidden = true;
}

function toggleFrequencyDropdown(event) {
    event.stopPropagation();
    if (repetitionFrequencyOptionsList.hidden) {
        openFrequencyDropdown();
    } else {
        closeFrequencyDropdown();
    }
}

function handleFrequencyOptionClick(event) {
    const li = event.target.closest('li[data-value]');
    if (!li) return;
    event.stopPropagation();
    repetitionFrequency.value = li.dataset.value;
    closeFrequencyDropdown();
    // Dispara um 'change' para os listeners registrados (ex.: updateRelativeTimeLabel)
    repetitionFrequencyWrapper.dispatchEvent(new Event('change'));
}

function handleOutsideFrequencyClick(event) {
    if (!repetitionFrequencyWrapper.contains(event.target)) {
        closeFrequencyDropdown();
    }
}

// Função para fechar o pop-up de configuração de repetição
function closeRepetitionConfigPopup() {
    // Esconde o pop-up
    repetitionPopup.classList.remove('active');

    // Remove os escutadores de evento
    repetitionForm.removeEventListener('submit', handleRepetitionSubmit);
    discardButton.removeEventListener('click', discardRepetitionFields);
    cancelButton.removeEventListener('click', closeRepetitionConfigPopup);
    repetitionEnd.removeEventListener('click', handleEndDateClick);
    repetitionFrequency.removeEventListener('change', updateRelativeTimeLabel);

    // Escutadores do dropdown customizado
    repetitionFrequencyTrigger.removeEventListener('click', toggleFrequencyDropdown);
    repetitionFrequencyOptionsList.removeEventListener('click', handleFrequencyOptionClick);
    document.removeEventListener('click', handleOutsideFrequencyClick);
    closeFrequencyDropdown();

    // Dispara o callback de fechamento, se houver
    if (typeof onCloseCallback === 'function') {
        onCloseCallback();
        onCloseCallback = null;
    }
}

// Abre o picker customizado de data de término; ao confirmar, atualiza a data tentativa e os rótulos
function handleEndDateClick() {
    openEndDatePicker(tentativeEndDate, (chosenDate) => {
        tentativeEndDate = chosenDate;
        updateEndDateLabel(chosenDate);
        updateRelativeTimeLabel(); // O término pode invalidar a próxima ocorrência futura
    });
}

// Função para tratar a confirmação ("Pronto") do formulário de configuração de repetição
function handleRepetitionSubmit(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Commita as escolhas tentativas no estado de repetição
    repetitionState.frequency = repetitionFrequency.value;
    repetitionState.end_date = tentativeEndDate;

    // Fecha o pop-up
    closeRepetitionConfigPopup();
}

// Função para abrir o pop-up de configuração de repetição
// Aceita um callback opcional que será chamado quando o pop-up for fechado (por Pronto ou Cancelar)
export function openRepetitionConfigPopup(onClose) {
    onCloseCallback = onClose || null;
    // Atualiza o grupo "Quando" com a data do evento que está sendo criado
    const dayOfWeek = getDayOfWeek(calendarState.year, calendarState.month, calendarState.day);
    repetitionWhenDateText.textContent = `${fullDayOfWeekNames[dayOfWeek]}, ${calendarState.day} de ${getMonthName(calendarState.month).toLowerCase()} de ${calendarState.year}`;
    // A pílula da esquerda do "Quando" agora mostra o tempo relativo (preenchida em updateRelativeTimeLabel)

    // (As opções do dropdown customizado têm textos curtos fixos no HTML — o dia/mês exato
    // já aparece na pílula "Quando" acima, então não precisamos alterá-los dinamicamente.)

    // Reflete o estado atual nos campos do formulário
    repetitionFrequency.value = repetitionState.frequency;
    tentativeEndDate = repetitionState.end_date ? new Date(repetitionState.end_date) : null;
    updateEndDateLabel(tentativeEndDate);
    updateRelativeTimeLabel(); // Calcula "em X dias" / "X dias atrás" para a configuração atual

    // Mostra o pop-up
    repetitionPopup.classList.add('active');

    // Adiciona os escutadores de evento
    repetitionForm.addEventListener('submit', handleRepetitionSubmit);
    discardButton.addEventListener('click', discardRepetitionFields);
    cancelButton.addEventListener('click', closeRepetitionConfigPopup);
    repetitionEnd.addEventListener('click', handleEndDateClick);
    repetitionFrequency.addEventListener('change', updateRelativeTimeLabel);

    // Escutadores do dropdown customizado
    repetitionFrequencyTrigger.addEventListener('click', toggleFrequencyDropdown);
    repetitionFrequencyOptionsList.addEventListener('click', handleFrequencyOptionClick);
    document.addEventListener('click', handleOutsideFrequencyClick);
}
