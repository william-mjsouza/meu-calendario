// Objeto que faz a correspondência entre a cor do marcador e a cor de fundo do grupo
const colorMapping = {
    "var(--red-marker-bg-color)": "var(--red-form-group-bg-color)",
    "var(--orange-marker-bg-color)": "var(--orange-form-group-bg-color)",
    "var(--yellow-marker-bg-color)": "var(--yellow-form-group-bg-color)",
    "var(--green-marker-bg-color)": "var(--green-form-group-bg-color)",
    "var(--blue-marker-bg-color)": "var(--blue-form-group-bg-color)",
    "var(--pink-marker-bg-color)": "var(--pink-form-group-bg-color)",
    "var(--black-marker-bg-color)": "var(--black-form-group-bg-color)",
    "var(--gray-marker-bg-color)": "var(--gray-form-group-bg-color)",
    "var(--white-marker-bg-color)": "var(--white-form-group-bg-color)"
};

const saveEventFormGroup1 = document.querySelector('.save-event-form-group1');
export const colorPickerButton = document.querySelector('#color-picker');
const colorPickerPopup = document.querySelector('.color-picker-popup');
const colorPickerSquare = document.querySelector('.color-picker-popup-square');
const colorPickerPopupButtons = document.querySelectorAll('.color-picker-button');

// Função para fechar o pop-up de selecionar a cor do evento
function closeColorPickerPopup() {
    // Remove os escutadores de evento
    colorPickerPopupButtons.forEach(button => {
        button.removeEventListener('click', changeGroupBackgroudColor);
    });

    // Esconde o pop-up
    colorPickerPopup.classList.remove('active');
}

// Função para trocar a cor de fundo do grupo a cada clique nos botões
function changeGroupBackgroudColor(event) {
    // Atualiza a cor de fundo do botão de edição de cor com a cor do botão clicado
    const markerColor = event.target.style.backgroundColor;
    colorPickerButton.style.backgroundColor = markerColor;
    
    // Atualiza a cor de fundo do grupo com a cor correspondente
    saveEventFormGroup1.style.backgroundColor = colorMapping[markerColor];

    // Fecha o pop-up
    closeColorPickerPopup();
}

// Função para abrir o pop-up de selecionar a cor do evento
export function openColorPickerPopup() {
    // Mostra o pop-up e a sobreposição
    colorPickerPopup.classList.add('active');

    // Adiciona o evento de clique nos botões para trocar a cor do grupo
    colorPickerPopupButtons.forEach(button => {
        button.addEventListener('click', changeGroupBackgroudColor);
    });

    // Adiciona o evento de clique na sobreposição para fechar o pop-up
    colorPickerPopup.addEventListener('click', closeColorPickerPopup)

    // Impede a propagação do clique no quadrado
    colorPickerSquare.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}