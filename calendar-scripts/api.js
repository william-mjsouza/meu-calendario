// Cliente HTTP compartilhado que fala com o backend Spring Boot
// Todas as chamadas incluem o token JWT armazenado em localStorage automaticamente

// Detecta o backend automaticamente:
//   - Localhost/127.0.0.1 (dev) → http://localhost:8080
//   - Qualquer outra origem (produção Vercel) → variável PRODUCTION_API_URL abaixo
// Troque PRODUCTION_API_URL pela URL pública do seu backend no Render depois do deploy.
const PRODUCTION_API_URL = "https://meu-calendario-api.onrender.com";

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
export const API_BASE_URL = isLocalHost ? "http://localhost:8080" : PRODUCTION_API_URL;

// Chaves usadas para persistir a sessão do usuário no localStorage
const TOKEN_KEY = "mc.token";
const USER_KEY = "mc.user";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function saveSession({ token, userId, name, email }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId, name, email }));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Decodifica o payload de um JWT (Base64Url → JSON) sem validar assinatura
// A validação de assinatura é responsabilidade do backend; aqui só lemos o campo exp
function parseJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch (_) {
        return null;
    }
}

// Retorna true se o token está expirado (ou inválido / sem campo exp)
// Aplica um "clock skew" de 30 segundos para tolerar pequenas diferenças de relógio
function isTokenExpired(token) {
    const payload = parseJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 <= Date.now() + 30_000;
}

export function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    // Token expirado é tratado como "não autenticado". Limpa o localStorage
    // para não deixar sessão fantasma que enganaria a próxima checagem.
    if (isTokenExpired(token)) {
        clearSession();
        return false;
    }
    return true;
}

// Wrapper de fetch que adiciona Content-Type e Authorization
async function request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    // Sessão expirada / inválida — força logout e redirect com aviso na tela de login
    if (response.status === 401 && auth) {
        clearSession();
        if (!location.pathname.endsWith("index.html") && location.pathname !== "/") {
            // Deixa uma mensagem para o auth.js exibir como toast na tela de login
            sessionStorage.setItem("mc.flash", JSON.stringify({
                message: "Sua sessão expirou. Entre novamente.",
                type: "error"
            }));
            location.href = "index.html";
        }
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    // Sem conteúdo (ex.: DELETE 204)
    if (response.status === 204) return null;

    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

    if (!response.ok) {
        const msg = (data && typeof data === "object" && data.message) ? data.message : `HTTP ${response.status}`;
        throw new Error(msg);
    }
    return data;
}

// ---- Endpoints de autenticação ----

export function register({ name, email, password }) {
    return request("/api/auth/register", { method: "POST", body: { name, email, password }, auth: false });
}

export function login({ email, password }) {
    return request("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
}

// ---- Conversores entre o formato do calendarState (frontend) e o da API (backend) ----

// Formata uma Date como "yyyy-MM-dd" (aceita null/undefined -> null)
function toIsoDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Converte "yyyy-MM-dd" para Date local, evitando bugs de timezone
function fromIsoDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Converte um evento do formato do backend (LocalDate/LocalTime/Frequency uppercase)
 *  para o formato do calendarState (Date + strings HH:MM + frequency lowercase). */
export function eventFromApi(dto) {
    return {
        id: dto.id,
        title: dto.title,
        description: dto.description,
        start_date: fromIsoDate(dto.start_date),
        end_event_date: fromIsoDate(dto.end_event_date),
        start_hour: dto.start_hour || null,
        end_hour: dto.end_hour || null,
        all_day: !!dto.all_day,
        frequency: dto.frequency ? dto.frequency.toLowerCase() : "once",
        end_date: fromIsoDate(dto.end_date),
        color: dto.color,
        formGroupColor: dto.formGroupColor,
        concluded: !!dto.concluded,
        originalFrequency: dto.originalFrequency ? dto.originalFrequency.toLowerCase() : undefined
    };
}

/** Converte um evento do calendarState para o formato aceito pela API. */
export function eventToApi(event) {
    return {
        title: event.title || "",
        description: event.description || "",
        start_date: toIsoDate(event.start_date),
        end_event_date: toIsoDate(event.end_event_date),
        start_hour: event.start_hour || null,
        end_hour: event.end_hour || null,
        all_day: !!event.all_day,
        frequency: (event.frequency || "once").toUpperCase(),
        end_date: toIsoDate(event.end_date),
        color: event.color || "",
        formGroupColor: event.formGroupColor || "",
        concluded: !!event.concluded,
        originalFrequency: event.originalFrequency ? event.originalFrequency.toUpperCase() : null
    };
}

// ---- Endpoints de eventos ----

export async function listEvents() {
    const list = await request("/api/events");
    return Array.isArray(list) ? list.map(eventFromApi) : [];
}

export async function createEvent(event) {
    const dto = await request("/api/events", { method: "POST", body: eventToApi(event) });
    return eventFromApi(dto);
}

export async function updateEvent(id, event) {
    const dto = await request(`/api/events/${id}`, { method: "PUT", body: eventToApi(event) });
    return eventFromApi(dto);
}

export function deleteEvent(id) {
    return request(`/api/events/${id}`, { method: "DELETE" });
}
