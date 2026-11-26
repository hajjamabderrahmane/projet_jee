import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { api, ApiError, withPlaces } from '../api'
import { useAuth } from '../auth'
import {
  CATEGORIES, CATEGORY_LABEL, dayOf, eventImage, fullDate, fullName, initials, longDate, monthOf, safeUrl, timeOf,
  toApiDate, toInputDate, yearOf,
} from '../helpers'
import { useAsync } from '../hooks'
import { navigate } from '../router'
import { CommentDialog, type CommentDialogState } from '../components/CommentDialog'
import {
  DashboardSection, ErrorState, Icon, Loading, Logo, Modal, Stat, StatusBadge, toast,
} from '../components/ui'
import type { Categorie, Commentaire, EventView, Inscription, Statut, User } from '../types'

const TABS = [
  ['overview', 'Vue d’ensemble', 'grid'],
  ['evenements', 'Événements', 'calendar'],
  ['inscriptions', 'Inscriptions', 'users'],
  ['commentaires', 'Commentaires', 'message'],
  ['participants', 'Participants', 'profile'],
] as const

type ModalState =
  | null
  | { k: 'event'; e?: EventView }
  | { k: 'delete-event'; e: EventView }
  | { k: 'blocked'; msg: string }
  | { k: 'participant'; u: User }

/** Il n’existe pas d’endpoint « tout lister » : on agrège par événement côté client. */
function useAdminData() {
  return useAsync(async () => {
    const [events, participants] = await Promise.all([api.events.list().then(withPlaces), api.users.participants()])
    const [insc, comm] = await Promise.all([
      Promise.all(events.map((e) => api.inscriptions.byEvent(e.id))),
      Promise.all(events.map((e) => api.comments.byEvent(e.id))),
    ])
    return {
      events: [...events].sort((a, b) => a.date.localeCompare(b.date)),
      participants,
      inscriptions: insc.flat().sort((a, b) => a.dateInscription.localeCompare(b.dateInscription)),
      comments: comm.flat().sort((a, b) => b.dateCreation.localeCompare(a.dateCreation)),
    }
  }, [])
}

export default function AdminDashboard({ tab }: { tab: string }) {
  const { user, logout } = useAuth()
  const active = TABS.find((t) => t[0] === tab) ?? TABS[0]
  const { data, loading, error, reload } = useAdminData()
  const [modal, setModal] = useState<ModalState>(null)
  const [commentDialog, setCommentDialog] = useState<CommentDialogState | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | Statut>('EN_ATTENTE')

  const pending = useMemo(() => (data?.inscriptions ?? []).filter((i) => i.statut === 'EN_ATTENTE'), [data])
  const upcoming = useMemo(() => (data?.events ?? []).filter((e) => new Date(e.date) > new Date()), [data])
  const q = search.toLowerCase().trim()

  if (!user) return null

  async function decide(i: Inscription, action: 'valider' | 'refuser') {
    try {
      await api.inscriptions[action](i.id)
      toast(action === 'valider' ? 'Inscription validée' : 'Inscription refusée')
      reload()
    } catch (e) { toast((e as Error).message, 'error'); reload() }
  }

  const goTab = (slug: string) => { setSearch(''); navigate(slug === 'overview' ? '/admin' : `/admin/${slug}`) }

  /* ───── Tableaux ───── */
  const RegistrationTable = ({ rows }: { rows: Inscription[] }) => rows.length === 0
    ? <p className="empty-row">Aucune inscription à afficher.</p>
    : <div className="table-wrap"><table><thead><tr><th>Participant</th><th>Événement</th><th>Demande</th><th>LinkedIn</th><th>Statut</th><th>Actions</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}>
        <td><div className="person-cell"><span className="avatar">{initials(r.user)}</span><div><b>{fullName(r.user)}</b><span>{r.user.email}</span></div></div></td>
        <td><b>{r.evenement.titre}</b></td>
        <td>{longDate(r.dateInscription)}</td>
        <td><a href={safeUrl(r.lienLinkedIn)} target="_blank" rel="noreferrer">Voir le profil ↗</a></td>
        <td><StatusBadge status={r.statut} /></td>
        <td>{r.statut === 'EN_ATTENTE'
          ? <div className="row-actions"><button className="approve" title="Approuver" onClick={() => decide(r, 'valider')}><Icon name="check" /></button><button className="reject" title="Refuser" onClick={() => decide(r, 'refuser')}><Icon name="close" /></button></div>
          : <span>Traitée</span>}</td>
      </tr>)}
    </tbody></table></div>

  const EventsTable = ({ rows }: { rows: EventView[] }) => rows.length === 0
    ? <p className="empty-row">Aucun événement à afficher.</p>
    : <div className="table-wrap"><table><thead><tr><th>Événement</th><th>Date</th><th>Catégorie</th><th>Capacité validée</th><th>Actions</th></tr></thead><tbody>
      {rows.map((e) => <tr key={e.id}>
        <td><div className="event-cell"><img src={eventImage(e)} alt="" /><b>{e.titre}</b></div></td>
        <td>{dayOf(e.date)} {monthOf(e.date)} {yearOf(e.date)} · {timeOf(e.date)}</td>
        <td><span className="simple-badge">{CATEGORY_LABEL[e.categorie].toUpperCase()}</span></td>
        <td><b>{e.validees}</b> / {e.capacite}</td>
        <td><div className="row-actions">
          <button className="plain" title="Modifier" onClick={() => setModal({ k: 'event', e })}><Icon name="edit" /></button>
          <button className="plain danger-text" title="Supprimer" onClick={() => setModal({ k: 'delete-event', e })}><Icon name="trash" /></button>
        </div></td>
      </tr>)}
    </tbody></table></div>

  /* ───── Contenu par onglet ───── */
  const content = () => {
    if (loading && !data) return <Loading />
    if (error || !data) return error ? <ErrorState error={error} /> : null

    if (active[0] === 'overview') return <>
      <div className="welcome-row"><div><span className="eyebrow">{fullDate(new Date().toISOString()).toUpperCase()}</span><h1>Bonjour, {user.prenom}</h1><p>Voici ce qui se passe aujourd’hui sur EventLink.</p></div>
        <button className="button primary" onClick={() => setModal({ k: 'event' })}><Icon name="plus" size={17} /> Créer un événement</button></div>
      <div className="stat-grid admin-stats">
        <Stat label="Événements à venir" value={upcoming.length} icon="calendar" />
        <Stat label="Participants" value={data.participants.length} icon="users" tone="green" />
        <Stat label="Demandes en attente" value={pending.length} icon="bell" tone="amber" />
      </div>
      <section className="panel"><div className="panel-heading"><div><h2>Demandes en attente</h2><p>À examiner par ordre d’arrivée</p></div><button className="text-button" onClick={() => goTab('inscriptions')}>Tout voir <Icon name="arrow" size={16} /></button></div><RegistrationTable rows={pending.slice(0, 5)} /></section>
      <section className="panel"><div className="panel-heading"><div><h2>Événements à venir</h2><p>Les prochaines dates publiées</p></div><button className="text-button" onClick={() => goTab('evenements')}>Gérer les événements <Icon name="arrow" size={16} /></button></div><EventsTable rows={upcoming.slice(0, 4)} /></section>
    </>

    if (active[0] === 'evenements') {
      const rows = data.events.filter((e) => e.titre.toLowerCase().includes(q) && (!catFilter || e.categorie === catFilter))
      return <DashboardSection eyebrow="GESTION" title="Événements" text="Créez, modifiez et suivez vos événements."
        action={<button className="button primary" onClick={() => setModal({ k: 'event' })}><Icon name="plus" size={17} /> Nouvel événement</button>}>
        <section className="panel"><div className="table-tools">
          <div className="small-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un événement" /></div>
          <select className="table-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}><option value="">Toutes les catégories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select>
        </div><EventsTable rows={rows} /></section>
      </DashboardSection>
    }

    if (active[0] === 'inscriptions') {
      const rows = data.inscriptions.filter((i) => (!statusFilter || i.statut === statusFilter) && `${fullName(i.user)} ${i.evenement.titre}`.toLowerCase().includes(q))
      return <DashboardSection eyebrow="VALIDATION" title="Inscriptions" text="Approuvez ou refusez les demandes en attente. La capacité est revérifiée à chaque validation.">
        <section className="panel"><div className="table-tools">
          <div className="small-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Participant ou événement" /></div>
          <select className="table-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | Statut)}>
            <option value="">Tous les statuts</option><option value="EN_ATTENTE">En attente</option><option value="VALIDEE">Validées</option><option value="REFUSEE">Refusées</option>
          </select>
        </div><RegistrationTable rows={rows} /></section>
      </DashboardSection>
    }

    if (active[0] === 'commentaires') {
      const rows: Commentaire[] = data.comments.filter((c) => `${c.contenu} ${fullName(c.user)} ${c.evenement.titre}`.toLowerCase().includes(q))
      return <DashboardSection eyebrow="MODÉRATION" title="Commentaires" text="Consultez les échanges et supprimez les contenus inappropriés.">
        <section className="panel admin-comments">
          <div className="table-tools"><div className="small-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Auteur, événement ou texte" /></div><span>{rows.length} commentaire{rows.length > 1 ? 's' : ''}</span></div>
          {rows.length === 0 ? <p className="empty-row">Aucun commentaire à modérer.</p> : rows.map((c) => (
            <div className="moderation-row" key={c.id}>
              <span className="avatar">{initials(c.user)}</span>
              <div><b>{fullName(c.user)}</b><span>{c.evenement.titre} · {longDate(c.dateCreation)}</span><p>{c.contenu}</p></div>
              <button className="danger-icon" aria-label="Supprimer le commentaire" onClick={() => setCommentDialog({ kind: 'delete', c, admin: true })}><Icon name="trash" /></button>
            </div>
          ))}
        </section>
      </DashboardSection>
    }

    const rows = data.participants.filter((p) => `${fullName(p)} ${p.email}`.toLowerCase().includes(q))
    return <DashboardSection eyebrow="UTILISATEURS" title="Participants" text="Consultez et gérez les comptes participants.">
      <section className="panel"><div className="table-tools">
        <div className="small-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou adresse e-mail" /></div>
        <span>{data.participants.length} participant{data.participants.length > 1 ? 's' : ''}</span>
      </div>
        {rows.length === 0 ? <p className="empty-row">Aucun participant trouvé.</p> : <div className="table-wrap"><table><thead><tr><th>Participant</th><th>Dernière demande</th><th>Inscriptions</th><th>Rôle</th><th>Actions</th></tr></thead><tbody>
          {rows.map((p) => {
            const mine = data.inscriptions.filter((i) => i.user.id === p.id)
            const last = mine.length ? mine[mine.length - 1].dateInscription : null
            return <tr key={p.id}>
              <td><div className="person-cell"><span className="avatar">{initials(p)}</span><div><b>{fullName(p)}</b><span>{p.email}</span></div></div></td>
              <td>{last ? longDate(last) : '—'}</td><td>{mine.length}</td><td><span className="simple-badge">PARTICIPANT</span></td>
              <td><button className="plain danger-text" title="Supprimer" onClick={() => setModal({ k: 'participant', u: p })}><Icon name="trash" /></button></td>
            </tr>
          })}
        </tbody></table></div>}
      </section>
    </DashboardSection>
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Logo inverse /><span className="admin-label">ADMINISTRATION</span>
      <nav>{TABS.map(([slug, label, icon]) => (
        <button key={slug} className={active[0] === slug ? 'active' : ''} onClick={() => goTab(slug)}>
          <Icon name={icon} />{label}{slug === 'inscriptions' && pending.length > 0 && <i>{pending.length}</i>}
        </button>))}</nav>
      <div className="admin-user"><span className="avatar">{initials(user)}</span><div><b>{fullName(user)}</b><span>Administrateur</span></div><button aria-label="Se déconnecter" onClick={() => { logout(); navigate('/') }}><Icon name="logout" /></button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><button className="admin-mobile-logo"><Logo /></button><div><span>Administration</span><b>{active[1]}</b></div>
        <div><button className="icon-btn" aria-label="Voir le site" onClick={() => navigate('/')}><Icon name="calendar" /></button><span className="avatar">{initials(user)}</span></div></header>
      <div className="admin-content">{content()}</div>
    </main>

    {modal?.k === 'event' && <Modal title={modal.e ? 'Modifier l’événement' : 'Créer un événement'} onClose={() => setModal(null)}>
      <EventForm event={modal.e} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload() }} /></Modal>}

    {modal?.k === 'delete-event' && <DeleteEvent event={modal.e} onClose={() => setModal(null)} onBlocked={(msg) => setModal({ k: 'blocked', msg })} onDone={() => { setModal(null); reload() }} />}

    {modal?.k === 'blocked' && <Modal title="Suppression impossible" onClose={() => setModal(null)}>
      <div className="modal-alert"><Icon name="close" /><div><b>Cet événement ne peut pas être supprimé.</b><p>{modal.msg} Conservez-le pour préserver l’historique associé.</p></div></div>
      <button className="button primary wide" onClick={() => setModal(null)}>J’ai compris</button></Modal>}

    {modal?.k === 'participant' && <DeleteParticipant user={modal.u} onClose={() => setModal(null)} onDone={() => { setModal(null); reload() }} />}

    {commentDialog && <CommentDialog state={commentDialog} onClose={() => setCommentDialog(null)} onDone={reload} />}
  </div>
}

function EventForm({ event, onClose, onSaved }: { event?: EventView; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    titre: event?.titre ?? '', categorie: (event?.categorie ?? 'CONFERENCE') as Categorie, date: event ? toInputDate(event.date) : '',
    adresse: event?.adresse ?? '', capacite: String(event?.capacite ?? ''), description: event?.description ?? '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const on = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const body = { ...f, titre: f.titre.trim(), adresse: f.adresse.trim(), description: f.description.trim(), date: toApiDate(f.date), capacite: Number(f.capacite) }
    try {
      if (event) await api.events.update(event.id, body); else await api.events.create(body)
      toast(event ? 'Événement mis à jour' : 'Événement créé')
      onSaved()
    } catch (err) { setError((err as Error).message); setBusy(false) }
  }

  return <form className="event-form" onSubmit={submit}>
    <label className="span-2">Titre<input required value={f.titre} onChange={on('titre')} placeholder="Nom de l’événement" /></label>
    <label>Catégorie<select value={f.categorie} onChange={on('categorie')}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
    <label>Date et heure<input required type="datetime-local" value={f.date} onChange={on('date')} /></label>
    <label className="span-2">Adresse<input required value={f.adresse} onChange={on('adresse')} placeholder="Lieu ou adresse complète" /></label>
    <label>Capacité<input required type="number" min="1" value={f.capacite} onChange={on('capacite')} placeholder="100" /><small>Ne peut pas être inférieure au nombre d’inscriptions validées{event ? ` (${event.validees})` : ''}.</small></label>
    <label className="span-2">Description<textarea required rows={4} value={f.description} onChange={on('description')} placeholder="Présentez le programme et les objectifs…" /></label>
    {error && <div className="form-error span-2">{error}</div>}
    <div className="modal-actions span-2"><button type="button" className="button secondary" onClick={onClose}>Annuler</button><button className="button primary" disabled={busy}>{event ? 'Enregistrer' : 'Créer l’événement'}</button></div>
  </form>
}

function DeleteEvent({ event, onClose, onBlocked, onDone }: { event: EventView; onClose: () => void; onBlocked: (msg: string) => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  async function confirm() {
    setBusy(true)
    try { await api.events.remove(event.id); toast('Événement supprimé'); onDone() }
    catch (e) {
      // 400 = InvalidRequestException (inscriptions ou commentaires existants)
      if (e instanceof ApiError && e.status === 400) onBlocked(e.message)
      else { toast((e as Error).message, 'error'); setBusy(false) }
    }
  }
  return <Modal title="Supprimer cet événement ?" onClose={onClose}>
    <p className="confirm-copy">« {event.titre} » sera supprimé définitivement s’il n’a ni inscriptions ni commentaires.</p>
    <div className="modal-actions" style={{ marginTop: 20 }}><button className="button secondary" onClick={onClose}>Annuler</button><button className="button danger" disabled={busy} onClick={confirm}>Confirmer la suppression</button></div>
  </Modal>
}

function DeleteParticipant({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  async function confirm() {
    setBusy(true)
    try { await api.users.remove(user.id); toast('Participant supprimé'); onDone() }
    catch (e) { toast((e as Error).message, 'error'); setBusy(false) }
  }
  return <Modal title="Supprimer ce participant ?" onClose={onClose}>
    <p className="confirm-copy">Le compte de {fullName(user)} et ses données associées (inscriptions, commentaires, notifications) seront supprimés. Cette action est irréversible.</p>
    <div className="modal-actions" style={{ marginTop: 20 }}><button className="button secondary" onClick={onClose}>Annuler</button><button className="button danger" disabled={busy} onClick={confirm}>Confirmer la suppression</button></div>
  </Modal>
}
