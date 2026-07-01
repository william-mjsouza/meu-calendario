# Meu Calendário

Uma aplicação de calendário web 100% customizável, construída do zero em **HTML, CSS e JavaScript puro** — sem frameworks, sem bibliotecas externas, sem dependências de runtime. Cada interação, animação e componente foi desenhado e implementado manualmente, com foco em **UX moderna**, **arquitetura modular** e **responsividade total** entre celulares (retrato e paisagem), tablets e computadores.

---

## Visão geral

Meu Calendário é mais do que um grid de dias: é um sistema completo de gerenciamento de eventos pessoais com marcadores coloridos, recorrência inteligente, edição em modo "popup-stack" e navegação rápida estilo Android. Toda a lógica de datas — dias da semana, meses, anos bissextos, recorrências semanais/quinzenais/mensais/anuais — é calculada internamente, sem depender de bibliotecas como Moment.js ou date-fns.

A interface segue um tema escuro consistente, com paleta de cores semânticas, tipografia limpa e micro-interações fluidas (ripple effect, transições suaves, feedback ao toque) — pensada para se sentir nativa tanto no mobile quanto no desktop.

---

## Funcionalidades

### 📅 Calendário principal
- **Visualização mensal** completa com os dias do mês anterior e seguinte renderizados em tom esmaecido para contexto temporal.
- **Destaque automático do dia atual** com borda azul-clara para localização instantânea.
- **Domingos e sábados** coloridos com tons distintos (vermelho/azul) seguindo o padrão visual brasileiro.
- **Navegação entre meses** por botões `◀ ▶` ou direto pelo título do mês.
- **Navegação rápida por mês/ano**: ao clicar em "Junho de 2026" (com **animação ripple**), abre um **date picker centralizado** estilo Android para saltar para qualquer mês desejado — incluindo seleção dedicada de ano com lista rolável.

### 🎨 Eventos com marcadores coloridos
- **9 cores semânticas** disponíveis (vermelho, laranja, amarelo, verde, azul, rosa, preto, cinza, branco) — cada uma com uma cor principal para o marcador e uma cor secundária harmonizada para o cabeçalho do formulário de edição.
- **Até 8 marcadores por dia** organizados automaticamente num grid 4×2, preenchendo a linha inferior primeiro e depois a superior — denso, mas legível.
- **Cor persistida** no objeto do evento de forma robusta: resolvida via `getComputedStyle` para evitar problemas de `var(--...)` não-aplicado no primeiro render.

### 🔁 Recorrência inteligente
- Suporte nativo a **seis frequências**: uma só vez, diariamente, semanalmente, quinzenalmente, mensalmente (no mesmo dia do mês) e anualmente (no mesmo dia e mês).
- **Marcação automática em todos os dias futuros** em que o evento se repete — o cálculo respeita data de início, data de término opcional, dia da semana original e dia do mês.
- **Ícone de recorrência** (`🔁` em Material Icons) exibido no pop-up de edição quando a frequência é diferente de "Uma só vez", proporcionando feedback visual imediato.
- **Tela de configuração dedicada** estilo Android, com opções dinâmicas que se adaptam à data escolhida (ex.: "Mensalmente (dia 25)", "Anualmente (25 de junho)").

### ⏳ Tempo relativo contextual
Na tela de configuração da repetição, a pílula "Quando" mostra de forma humana **quão distante** o evento está:
- `hoje`, `amanhã`, `ontem`
- `em N dias` — quando a próxima ocorrência ainda está por vir
- `N dias atrás` — quando o evento já passou e não há mais recorrências futuras

O cálculo considera a frequência e a data de término escolhidas, recalculando dinamicamente quando o usuário altera qualquer um desses campos.

### 📋 Lista de eventos do dia
- **Clique em qualquer dia** abre um pop-up com **todos os eventos daquele dia** (incluindo recorrências), listados como faixas coloridas — a borda esquerda de cada faixa reflete a cor do evento.
- **Rolagem vertical fina** estilo mobile, com track invisível e thumb translúcida.
- **Lista organizada do topo** (sem cortar itens quando há muitos eventos).
- Botões de ação por item: **excluir** (`×` vermelho) e **concluir** (`✓` verde).

### ✏️ Edição inline de eventos
- **Clique em um evento da lista** abre o pop-up de edição com **todos os campos pré-preenchidos** (título, descrição, cor, frequência, término).
- O salvamento **atualiza o evento no lugar** (preservando a referência no array), sem criar duplicatas.
- **Clique em "Criar"** abre o mesmo pop-up, porém com campos vazios — uma única tela serve a dois fluxos sem ambiguidade.

### ✅ Marcação de eventos como concluídos
- **Clique no botão `✓`** marca o evento como concluído:
  - Título com **strikethrough** e opacidade reduzida (`0.55`) — padrão UX universal de "tarefa feita".
  - Botão `✓` também atenuado (`0.45`) para indicar que a ação já foi aplicada.
  - Botão `×` mantém-se em destaque, continuando acionável.
  - Fundo do item sutilmente escurecido para reforçar a hierarquia.
- **Recorrência cessada automaticamente**: a frequência muda para "Uma só vez" e a frequência original fica salva em `originalFrequency`, então as ocorrências futuras param de aparecer no calendário.
- **Estado persistido** no objeto do evento (`concluded: true`) — ao reabrir a caixa do dia, o evento continua marcado.
- **Toggle reversível**: clicar novamente em `✓` desmarca e **restaura a frequência original**, recuperando todas as ocorrências futuras.

### 🗑️ Validações inteligentes ao salvar
- **Título e descrição ambos vazios** → o evento é descartado silenciosamente, voltando ao calendário (não polui a lista).
- **Descrição sem título** → bloqueia o salvamento, foca o campo de título e exibe a mensagem inline _"Título obrigatório quando há descrição"_ como placeholder.
- **Demais combinações** são aceitas (título solo, título + descrição).

### 🗓️ Date picker customizado
- Componente próprio, **reutilizado em dois contextos**: escolher data de término da recorrência e navegar pelo calendário principal.
- **Visual inspirado no picker nativo do Android**, mas com a paleta do app: cabeçalho cinza-escuro com ano pequeno e data extensa em destaque, grade 7×N com círculos para os dias, dia selecionado em **círculo teal de acento**.
- **Lista de anos rolável**: clicar no ano abre uma lista de 200 anos centralizada no ano atual (que aparece destacado em maior em cor de acento).
- **Backdrop translúcido** que deixa o conteúdo de trás visível, igual ao pop-up de criar evento.
- **Cancelar** (ou clique fora do cartão) descarta a seleção; **OK** confirma e dispara o callback.

### ✨ Efeito ripple Material
- **Animação de ondulação** custom (não a do Material UI) com expansão durante o pressionar e colapso suave ao soltar fora — implementada do zero com `transition` e cálculo de coordenadas relativas.
- Aplicada ao botão **"Criar"** e ao **título do calendário** ("Junho de 2026") para sinalizar interatividade.
- Funciona com **mouse e toque**, sem disparar duas vezes em devices híbridos.

### 📱 Responsividade total
- **Retrato (celular vertical)**: layout em coluna, gestos otimizados, listas com altura ampla.
- **Paisagem (celular horizontal)**: layouts adaptados via media queries com `min-aspect-ratio`, paddings comprimidos, fontes reduzidas onde necessário.
- **Tablets** (`min-width: 600px`): pop-ups com proporção ajustada, itens da lista maiores.
- **Computadores** (`min-width: 900px`): cartões com largura máxima (`min(50%, 32rem)`), tipografia 1.25rem, paddings generosos.
- **Telas muito baixas** (`max-height: 480px`): variante extra-compacta para evitar rolagem.
- **Unidades relativas (rem, %, fr, min/max)** priorizadas em todo o CSS — sem larguras fixas em pixel.

---

## Stack & Arquitetura

- **HTML5** semântico (uso de `<aside>`, `<header>`, `<table>` com `<caption>`, atributos ARIA).
- **CSS3** modular: um arquivo por componente (`calendar.css`, `createEventPopup.css`, `saveEventPopup.css`, `repetitionConfigPopup.css`, `endDatePicker.css`) + um arquivo central de variáveis (`variables.css`) com a paleta, fontes e regras globais.
- **JavaScript ES Modules** (sem bundler) organizado por responsabilidade:
  - `showCalendar.js` — render do calendário e estado global (`calendarState`).
  - `createEvent.js` — pop-up de listagem de eventos do dia + render dinâmico.
  - `saveEvent.js` — pop-up de criar/editar evento, validações e persistência.
  - `markDays.js` — cálculo de quais eventos ocorrem em cada dia (resolve recorrências).
  - `configureRepetition.js` — tela de configuração de frequência e término.
  - `endDatePicker.js` — date picker customizado reutilizável.
  - `selectEventColor.js` — escolha de cor com mapeamento marker→form-group.
  - `newDateFunctions.js` — helpers de manipulação de datas (sem libs externas).
  - `animations/rippleEffect.js` — efeito ripple custom.

---

## Estrutura de pastas

```
meu-calendario/
├── calendar.html                       # Documento principal
├── calendar-styles/
│   ├── variables.css                   # Paleta, fontes e resets globais
│   ├── calendar.css                    # Grid principal do calendário
│   ├── createEventPopup.css            # Lista de eventos do dia
│   ├── saveEventPopup.css              # Formulário de criar/editar evento
│   ├── repetitionConfigPopup.css       # Tela de configuração de repetição
│   └── endDatePicker.css               # Date picker customizado
├── calendar-scripts/
│   ├── showCalendar.js                 # Estado global + render do calendário
│   ├── newDateFunctions.js             # Funções de data sem dependências
│   ├── markDays.js                     # Resolução de recorrências
│   ├── createEvent.js                  # Pop-up "add-event"
│   ├── saveEvent.js                    # Pop-up "save-event"
│   ├── configureRepetition.js          # Pop-up de repetição
│   ├── endDatePicker.js                # Componente date picker
│   ├── selectEventColor.js             # Seletor de cor
│   └── animations/
│       └── rippleEffect.js             # Efeito ripple custom
├── README.md
└── LICENSE
```

---

## Como executar

A aplicação não precisa de build, `npm install` nem servidor de produção. Basta servi-la por um servidor HTTP local — necessário porque os módulos ES (`import/export`) exigem origem HTTP:

```bash
# Opção 1 — Python (já vem no Windows/macOS/Linux)
python -m http.server 8000

# Opção 2 — Node (qualquer um destes)
npx serve .
npx http-server .

# Opção 3 — VS Code: extensão "Live Server" → "Open with Live Server" no calendar.html
```

Depois, abra no navegador:

```
http://localhost:8000/calendar.html
```

---

## Diferenciais técnicos

- **Zero dependências de runtime** — nenhum `node_modules`, nenhum framework, nenhum bundler. Roda direto no navegador.
- **Cálculo de datas custom** — todas as funções (`getDayOfWeek`, `getDaysInMonth`, `getMonthName`, `formatDate`) implementadas manualmente em ~50 linhas, sem Moment/date-fns.
- **Resolução de recorrências em O(n) por dia** — cada célula do calendário consulta `getEventsForDay(d, m, y)` que filtra os eventos uma única vez por render.
- **Arquitetura modular** com responsabilidade única por arquivo — cada pop-up é seu próprio módulo, cada estilo é seu próprio CSS.
- **Cores resolvidas via `getComputedStyle`** no momento da persistência — evita o bug clássico de `var(--...)` armazenado como string literal não-aplicada.
- **Animações performáticas** com `will-change`, `transform`/`opacity` e `requestAnimationFrame` — sem reflow durante a interação.
- **Acessibilidade** com `aria-label`, `aria-labelledby`, `role="dialog"` e atributo `hidden` respeitado em todos os pop-ups.

---

