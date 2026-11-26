import type { Categorie, Evenement, User } from './types'

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC']
const d = (s: string) => new Date(s)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const dayOf = (s: string) => String(d(s).getDate()).padStart(2, '0')
export const monthOf = (s: string) => MONTHS[d(s).getMonth()]
export const timeOf = (s: string) => d(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const yearOf = (s: string) => d(s).getFullYear()
export const fullDate = (s: string) =>
  cap(d(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
export const longDate = (s: string) => d(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
export const dayMonth = (s: string) => d(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

export function relative(s: string) {
  const hours = Math.floor((Date.now() - d(s).getTime()) / 36e5)
  if (hours < 1) return 'À l’instant'
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return dayMonth(s)
}

export const fullName = (u: Pick<User, 'prenom' | 'nom'>) => `${u.prenom} ${u.nom}`
export const initials = (u: Pick<User, 'prenom' | 'nom'>) => `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase()

export const CATEGORIES: Categorie[] = ['CONFERENCE', 'HACKATHON', 'FORMATION', 'ATELIER', 'SEMINAIRE']
export const CATEGORY_LABEL: Record<Categorie, string> = {
  CONFERENCE: 'Conférence',
  HACKATHON: 'Hackathon',
  FORMATION: 'Formation',
  ATELIER: 'Atelier',
  SEMINAIRE: 'Séminaire',
}

// Le backend ne stocke pas d’image : on réutilise les visuels du design Figma selon la catégorie.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`
const IMAGES: Record<Categorie, string[]> = {
  CONFERENCE: ['/assets/eventlink-hero.png', u('1515187029135-18ee286d815b')],
  HACKATHON: [u('1504384308090-c894fdcc538d')],
  ATELIER: [u('1517048676732-d65bc937f952')],
  SEMINAIRE: [u('1540575467063-178a50c2df87')],
  FORMATION: [u('1552664730-d307ca884978')],
}
export const eventImage = (e: Pick<Evenement, 'id' | 'categorie'>) => {
  const list = IMAGES[e.categorie] ?? IMAGES.CONFERENCE
  return list[e.id % list.length]
}

/** N’autorise que http(s) pour les liens saisis par les utilisateurs (LinkedIn). */
export const safeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : '#')
export const isLinkedIn = (url: string) => /^https?:\/\/([a-z0-9-]+\.)?linkedin\.com\/\S+/i.test(url.trim())
export const toApiDate = (v: string) => (v.length === 16 ? `${v}:00` : v)
export const toInputDate = (s: string) => s.slice(0, 16)
