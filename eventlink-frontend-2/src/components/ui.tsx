import { ReactNode, useEffect, useState, useSyncExternalStore } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import {
  CATEGORY_LABEL, dayOf, eventImage, fullName, initials, monthOf, relative, timeOf,
} from '../helpers'
import { navigate, usePath } from '../router'
import type { Commentaire, EventView, Notif, Statut } from '../types'

/* ───────── Icônes (identiques au design) ───────── */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h7v18h-7" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  )
}

/* ───────── Toasts ───────── */
type ToastItem = { id: number; msg: string; kind: 'ok' | 'error' }
let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(msg: string, kind: 'ok' | 'error' = 'ok') {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, msg, kind }]
  emit()
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit() }, 3800)
}

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => toasts,
  )
  return <div className="toast-stack" role="status">{list.map((t) => <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>{t.msg}</div>)}</div>
}

/* ───────── Briques simples ───────── */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <button className={`logo ${inverse ? 'logo-inverse' : ''}`} onClick={() => navigate('/')}>
      <span className="logo-mark"><span /></span><span>Event<span>Link</span></span>
    </button>
  )
}

export function StatusBadge({ status }: { status: Statut }) {
  const labels = { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REFUSEE: 'Refusée' }
  return <span className={`status status-${status.toLowerCase()}`}><span />{labels[status]}</span>
}

export const Avatar = ({ u, className = '' }: { u: { prenom: string; nom: string }; className?: string }) =>
  <span className={`avatar ${className}`}>{initials(u)}</span>

export const Loading = ({ text = 'Chargement…' }: { text?: string }) => <div className="empty loading">{text}</div>

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return <div className="empty"><span><Icon name="search" /></span><h3>{title}</h3><p>{text}</p>{children}</div>
}

export const ErrorState = ({ error }: { error: Error }) =>
  <Empty title="Impossible de charger les données" text={error.message} />

export function Stat({ label, value, icon, tone = 'navy' }: { label: string; value: string | number; icon: string; tone?: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} /></span><div><b>{value}</b><span>{label}</span></div></div>
}

export function DashboardSection({ eyebrow, title, text, action, children }: { eyebrow: string; title: string; text: string; action?: ReactNode; children: ReactNode }) {
  return <><div className="welcome-row"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>{children}</>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button></div>
        {children}
      </div>
    </div>
  )
}

/* ───────── Navbar ───────── */
export function Navbar() {
  const { user, logout } = useAuth()
  const path = usePath()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (user && !isAdmin) api.notifications.count().then((r) => setUnread(r.nonLues)).catch(() => setUnread(0))
    else setUnread(0)
  }, [user, isAdmin, path])

  const go = (p: string) => { navigate(p); setOpen(false) }

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Logo />
        <nav className={open ? 'open' : ''}>
          <button onClick={() => go('/')}>Découvrir</button>
          {user && !isAdmin && <>
            <button onClick={() => go('/espace/inscriptions')}>Mes inscriptions</button>
            <button onClick={() => go('/espace/commentaires')}>Mes commentaires</button>
          </>}
          {isAdmin && <button onClick={() => go('/admin')}>Administration</button>}
          {!user && <button onClick={() => go('/login')}>Connexion</button>}
        </nav>
        <div className="nav-actions">
          {!user && <>
            <button className="button secondary hide-sm" onClick={() => go('/login')}>Connexion</button>
            <button className="button primary" onClick={() => go('/register')}>Créer un compte</button>
          </>}
          {user && !isAdmin && (
            <button className="icon-btn notification" aria-label="Notifications" onClick={() => go('/espace/notifications')}>
              <Icon name="bell" />{unread > 0 && <span />}
            </button>
          )}
          {user && (
            <button className="avatar-button" onClick={() => go(isAdmin ? '/admin' : '/espace')}>
              <span>{initials(user)}</span>
              <span className="avatar-copy"><b>{fullName(user)}</b><small>{isAdmin ? 'Administrateur' : 'Participant'}</small></span>
            </button>
          )}
          {user && <button className="icon-btn" aria-label="Se déconnecter" onClick={() => { logout(); navigate('/') }}><Icon name="logout" /></button>}
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? 'close' : 'menu'} /></button>
        </div>
      </div>
    </header>
  )
}

/* ───────── Footer ───────── */
export function Footer() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  return (
    <footer>
      <div className="footer-main">
        <div><Logo inverse /><p>Des événements qui rapprochent les idées, les talents et les opportunités.</p></div>
        <div>
          <b>Explorer</b>
          <button onClick={() => navigate('/')}>Tous les événements</button>
          <button onClick={() => navigate('/?cat=CONFERENCE')}>Conférences</button>
          <button onClick={() => navigate('/?cat=ATELIER')}>Ateliers</button>
        </div>
        <div>
          <b>Votre espace</b>
          <button onClick={() => navigate(user ? (isAdmin ? '/admin' : '/espace/inscriptions') : '/login')}>{isAdmin ? 'Administration' : 'Mes inscriptions'}</button>
          {!isAdmin && <button onClick={() => navigate(user ? '/espace/notifications' : '/login')}>Notifications</button>}
        </div>
        <div>
          <b>Compte</b>
          {user
            ? <button onClick={() => { logout(); navigate('/') }}>Déconnexion</button>
            : <><button onClick={() => navigate('/login')}>Connexion</button><button onClick={() => navigate('/register')}>Créer un compte</button></>}
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} EventLink</span><span>Projet universitaire · Tous droits réservés</span></div>
    </footer>
  )
}

/* ───────── Carte événement ───────── */
export function EventCard({ event, onOpen }: { event: EventView; onOpen: () => void }) {
  const full = event.restantes <= 0
  return (
    <article className="event-card" onClick={onOpen}>
      <div className="event-image" style={{ backgroundImage: `url("${eventImage(event)}")` }}>
        <span className="category-pill">{CATEGORY_LABEL[event.categorie].toUpperCase()}</span>
        {full && <span className="full-pill">Complet</span>}
      </div>
      <div className="event-card-body">
        <div className="date-block"><b>{dayOf(event.date)}</b><span>{monthOf(event.date)}</span></div>
        <div className="event-card-copy">
          <h3>{event.titre}</h3>
          <p><Icon name="calendar" size={16} /> {timeOf(event.date)}</p>
          <p><Icon name="pin" size={16} /> {event.adresse}</p>
          <div className="capacity-row"><span>{full ? 'Liste complète' : `${event.restantes} place${event.restantes > 1 ? 's' : ''} restante${event.restantes > 1 ? 's' : ''}`}</span><span>{event.validees}/{event.capacite}</span></div>
          <div className="capacity-track"><span style={{ width: `${Math.min(100, (event.validees / event.capacite) * 100)}%` }} /></div>
        </div>
      </div>
    </article>
  )
}

/* ───────── Commentaire ───────── */
export function Comment({ c, context, canEdit, canDelete, onEdit, onDelete }: {
  c: Commentaire; context?: string; canEdit?: boolean; canDelete?: boolean; onEdit?: () => void; onDelete?: () => void
}) {
  return (
    <div className="comment">
      <Avatar u={c.user} />
      <div>
        <div className="comment-top">
          <b>{fullName(c.user)}</b><span>{context ? `${context} · ` : ''}{relative(c.dateCreation)}</span>
          {(canEdit || canDelete) && (
            <div className="comment-actions">
              {canEdit && <button onClick={onEdit}><Icon name="edit" size={16} /> Modifier</button>}
              {canDelete && <button onClick={onDelete}><Icon name="trash" size={16} /> Supprimer</button>}
            </div>
          )}
        </div>
        <p>{c.contenu}</p>
      </div>
    </div>
  )
}

/* ───────── Notification ───────── */
export function NotificationItem({ n, onRead }: { n: Notif; onRead: () => void }) {
  // Le backend ne fournit que `message` : on déduit le titre du texte.
  const title = /validée/i.test(n.message) ? 'Inscription validée' : /refusée/i.test(n.message) ? 'Inscription refusée' : 'Notification'
  return (
    <div className={`notification-item ${!n.lue ? 'unread' : ''}`}>
      <span className="notification-icon"><Icon name="bell" /></span>
      <div><b>{title}</b><p>{n.message}</p><small>{relative(n.dateCreation)}</small></div>
      {!n.lue && <button onClick={onRead}>Marquer comme lu</button>}
    </div>
  )
}
