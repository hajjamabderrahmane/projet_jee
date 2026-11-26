// Types alignés sur les entités Spring (eventlink.dao.entities)
export type Role = 'ADMIN' | 'PARTICIPANT'
export type Categorie = 'CONFERENCE' | 'HACKATHON' | 'FORMATION' | 'ATELIER' | 'SEMINAIRE'
export type Statut = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'

export interface User {
  id: number
  nom: string
  prenom: string
  email: string
  role: Role
}

export interface Evenement {
  id: number
  titre: string
  description: string
  categorie: Categorie
  date: string // LocalDateTime ISO, ex. "2026-06-07T18:00:00"
  adresse: string
  capacite: number
}

/** Evenement + places calculées via GET /api/evenements/{id}/places */
export interface EventView extends Evenement {
  restantes: number
  validees: number
}

export interface Inscription {
  id: number
  dateInscription: string
  statut: Statut
  lienLinkedIn: string
  user: User
  evenement: Evenement
}

export interface Commentaire {
  id: number
  contenu: string
  dateCreation: string
  user: User
  evenement: Evenement
}

export interface Notif {
  id: number
  message: string
  dateCreation: string
  lue: boolean
}

export type EvenementInput = Omit<Evenement, 'id'>
