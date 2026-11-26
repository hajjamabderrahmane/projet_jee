import type {
  Categorie, Commentaire, EvenementInput, Evenement, EventView, Inscription, Notif, Role, User,
} from './types'

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080').replace(/\/$/, '')
const KEY = 'eventlink.session'

/* ───────── Session (JWT) ───────── */
export interface Session { token: string; role: Role; userId: number }

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}
export function clearSession() {
  localStorage.removeItem(KEY)
  sessionStorage.removeItem(KEY)
}
export function saveSession(s: Session, remember: boolean) {
  clearSession()
  ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s))
}

/* ───────── Client HTTP ───────── */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// GlobalExceptionHandler renvoie { timestamp, status, error, message } ; message est une String,
// ou une Map champ → message pour les erreurs @Valid.
function messageOf(body: unknown, fallback: string): string {
  const m = (body as { message?: unknown } | null)?.message
  if (typeof m === 'string') return m
  if (m && typeof m === 'object') return Object.values(m as Record<string, string>).join(' ')
  return fallback
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = loadSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* corps non JSON */ }

  if (!res.ok) {
    const fallback =
      res.status === 401 || res.status === 403
        ? 'Accès refusé. Connectez-vous ou vérifiez vos droits.'
        : 'Une erreur est survenue.'
    throw new ApiError(res.status, messageOf(data, fallback))
  }
  return data as T
}

const get = <T>(p: string) => request<T>('GET', p)
const post = <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {})
const put = <T>(p: string, b?: unknown) => request<T>('PUT', p, b)
const del = (p: string) => request<void>('DELETE', p)

/* ───────── Endpoints (1 pour 1 avec les controllers) ───────── */
export const api = {
  auth: {
    login: (email: string, password: string) =>
      post<{ token: string; role: Role; userId: string }>('/api/auth/login', { email, password }),
    register: (d: { nom: string; prenom: string; email: string; password: string }) =>
      post<User>('/api/auth/register', d),
  },
  users: {
    me: () => get<User>('/api/users/me'),
    participants: () => get<User[]>('/api/users/participants'), // ADMIN
    remove: (id: number) => del(`/api/users/${id}`), // ADMIN
  },
  events: {
    list: () => get<Evenement[]>('/api/evenements'),
    upcoming: () => get<Evenement[]>('/api/evenements/upcoming'),
    get: (id: number) => get<Evenement>(`/api/evenements/${id}`),
    search: (titre: string) => get<Evenement[]>(`/api/evenements/search?titre=${encodeURIComponent(titre)}`),
    byCategorie: (c: Categorie) => get<Evenement[]>(`/api/evenements/categorie/${c}`),
    places: (id: number) => get<number>(`/api/evenements/${id}/places`),
    create: (e: EvenementInput) => post<Evenement>('/api/evenements', e), // ADMIN
    update: (id: number, e: EvenementInput) => put<Evenement>(`/api/evenements/${id}`, e), // ADMIN
    remove: (id: number) => del(`/api/evenements/${id}`), // ADMIN
  },
  inscriptions: {
    create: (evenementId: number, lienLinkedIn: string) =>
      post<Inscription>('/api/inscriptions', { evenementId: String(evenementId), lienLinkedIn }),
    mine: () => get<Inscription[]>('/api/inscriptions/me'),
    byEvent: (id: number) => get<Inscription[]>(`/api/inscriptions/evenement/${id}`), // ADMIN
    valider: (id: number) => put<Inscription>(`/api/inscriptions/${id}/valider`), // ADMIN
    refuser: (id: number) => put<Inscription>(`/api/inscriptions/${id}/refuser`), // ADMIN
  },
  comments: {
    // Le controller lit un Map<String,String> : les ids sont envoyés en chaînes.
    add: (evenementId: number, contenu: string) =>
      post<Commentaire>('/api/commentaires', { evenementId: String(evenementId), contenu }),
    byEvent: (id: number) => get<Commentaire[]>(`/api/commentaires/evenement/${id}`),
    mine: () => get<Commentaire[]>('/api/commentaires/me'),
    edit: (id: number, contenu: string) => put<Commentaire>(`/api/commentaires/${id}`, { contenu }),
    remove: (id: number) => del(`/api/commentaires/${id}`),
    removeAdmin: (id: number) => del(`/api/commentaires/${id}/admin`), // ADMIN
  },
  notifications: {
    mine: () => get<Notif[]>('/api/notifications/me'),
    count: () => get<{ nonLues: number }>('/api/notifications/me/count'),
    read: (id: number) => put<Notif>(`/api/notifications/${id}/lue`),
    readAll: () => put<void>('/api/notifications/me/toutes-lues'),
  },
}

/** Ajoute les places restantes (capacité − inscriptions VALIDEE) à chaque événement. */
export function withPlaces(list: Evenement[]): Promise<EventView[]> {
  return Promise.all(
    list.map(async (e) => {
      const restantes = await api.events.places(e.id).catch(() => e.capacite)
      return { ...e, restantes, validees: e.capacite - restantes }
    }),
  )
}
