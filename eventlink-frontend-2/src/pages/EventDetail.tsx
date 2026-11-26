import { FormEvent, useState } from 'react'
import { api, ApiError, withPlaces } from '../api'
import { useAuth } from '../auth'
import { CATEGORY_LABEL, dayOf, eventImage, fullDate, isLinkedIn, monthOf, timeOf, yearOf } from '../helpers'
import { useAsync } from '../hooks'
import { navigate } from '../router'
import type { Inscription } from '../types'
import { CommentDialog, type CommentDialogState } from '../components/CommentDialog'
import { Comment, Empty, ErrorState, EventCard, Footer, Icon, Loading, Navbar, StatusBadge, toast } from '../components/ui'

export default function EventDetail({ id }: { id: number }) {
  const { user, session } = useAuth()
  const isParticipant = user?.role === 'PARTICIPANT'
  const isAdmin = user?.role === 'ADMIN'

  const main = useAsync(async () => {
    const [e, restantes] = await Promise.all([api.events.get(id), api.events.places(id)])
    return { ...e, restantes, validees: e.capacite - restantes }
  }, [id, session?.token])
  const comments = useAsync(() => api.comments.byEvent(id), [id, session?.token])
  const mine = useAsync(() => (isParticipant ? api.inscriptions.mine() : Promise.resolve([] as Inscription[])), [user?.id])
  const related = useAsync(() => api.events.upcoming().then((l) => withPlaces(l.filter((e) => e.id !== id).slice(0, 3))), [id, session?.token])

  const [linkedin, setLinkedin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<CommentDialogState | null>(null)

  const event = main.data
  const myInscription = mine.data?.find((i) => i.evenement.id === id)

  async function request(e: FormEvent) {
    e.preventDefault()
    if (!isLinkedIn(linkedin)) return setError('Saisissez une URL LinkedIn valide (https://www.linkedin.com/in/…).')
    setBusy(true); setError('')
    try {
      await api.inscriptions.create(id, linkedin.trim())
      toast('Demande d’inscription envoyée')
      mine.reload(); main.reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally { setBusy(false) }
  }

  if (main.loading && !event) return <><Navbar /><main className="detail-page"><Loading text="Chargement de l’événement…" /></main><Footer /></>
  if (main.error || !event) {
    const forbidden = main.error instanceof ApiError && (main.error.status === 401 || main.error.status === 403) && !session
    return <><Navbar /><main className="detail-page">
      <button className="back-link" onClick={() => navigate('/')}>← Retour aux événements</button>
      {forbidden
        ? <Empty title="Connexion requise" text="Connectez-vous pour consulter cet événement et demander une inscription."><button className="button primary" onClick={() => navigate('/login')}>Se connecter</button></Empty>
        : main.error ? <ErrorState error={main.error} /> : null}
    </main><Footer /></>
  }

  const full = event.restantes <= 0
  const list = comments.data ?? []

  return <>
    <Navbar />
    <main className="detail-page">
      <button className="back-link" onClick={() => navigate('/')}>← Retour aux événements</button>
      <div className="detail-cover" style={{ backgroundImage: `url("${eventImage(event)}")` }}><span className="category-pill">{CATEGORY_LABEL[event.categorie].toUpperCase()}</span></div>
      <div className="detail-grid">
        <article className="detail-copy">
          <div className="detail-title-row"><div><span className="eyebrow">{dayOf(event.date)} {monthOf(event.date)} {yearOf(event.date)} · {timeOf(event.date)}</span><h1>{event.titre}</h1></div></div>
          <div className="detail-meta">
            <div className="meta-icon"><Icon name="calendar" /></div><div><b>{fullDate(event.date)}</b><span>À partir de {timeOf(event.date)}</span></div>
            <div className="meta-icon"><Icon name="pin" /></div><div><b>{event.adresse}</b><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.adresse)}`} target="_blank" rel="noreferrer">Voir l’itinéraire</a></div>
          </div>
          <hr />
          <h2>À propos de cet événement</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{event.description}</p>

          <div className="comments-heading">
            <div><h2>Commentaires</h2><span>{list.length} contribution{list.length !== 1 ? 's' : ''}</span></div>
            {user && <button className="button secondary" onClick={() => setDialog({ kind: 'add', evenementId: id })}>Ajouter un commentaire</button>}
          </div>
          {comments.loading && !comments.data ? <Loading />
            : comments.error ? <p className="field-error">{comments.error.message}</p>
            : list.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 12, padding: '20px 0' }}>Aucun commentaire pour le moment. Soyez le premier à poser une question.</p>
            : list.map((c) => {
              const own = c.user.id === user?.id
              return <Comment key={c.id} c={c} canEdit={own} canDelete={own || isAdmin}
                onEdit={() => setDialog({ kind: 'edit', c })}
                onDelete={() => setDialog({ kind: 'delete', c, admin: !own && isAdmin })} />
            })}
        </article>

        <aside className="registration-card">
          <div className="remaining">
            <div className="remaining-ring"><b>{Math.max(0, event.restantes)}</b><span>places</span></div>
            <div><b>{full ? 'Événement complet' : 'Places disponibles'}</b><span>{event.validees} participants validés sur {event.capacite}</span></div>
          </div>
          <div className="capacity-track large"><span style={{ width: `${Math.min(100, (event.validees / event.capacite) * 100)}%` }} /></div>

          {!user && (
            <div className="login-hint">
              <p>Connectez-vous avec votre compte participant pour demander une inscription à cet événement.</p>
              <button className="button primary wide" onClick={() => navigate('/login')}>Se connecter</button>
              <button className="button secondary wide" style={{ marginTop: 8 }} onClick={() => navigate('/register')}>Créer un compte</button>
            </div>
          )}
          {isAdmin && <div className="request-state"><Icon name="users" /><h3>Espace administrateur</h3><p>Gérez les inscriptions de cet événement depuis le tableau de bord.</p><button className="button secondary wide" onClick={() => navigate('/admin/inscriptions')}>Voir les inscriptions</button></div>}

          {isParticipant && mine.loading && !mine.data && <Loading text="Vérification de votre inscription…" />}
          {isParticipant && myInscription && (
            <div className={`request-state ${myInscription.statut === 'EN_ATTENTE' ? 'amber-state' : ''}`}>
              <Icon name={myInscription.statut === 'REFUSEE' ? 'close' : myInscription.statut === 'VALIDEE' ? 'check' : 'calendar'} />
              <StatusBadge status={myInscription.statut} />
              <h3>{myInscription.statut === 'EN_ATTENTE' ? 'Votre demande est en cours d’examen' : myInscription.statut === 'VALIDEE' ? 'Votre inscription est validée' : 'Votre demande a été refusée'}</h3>
              <p>{myInscription.statut === 'EN_ATTENTE' ? 'Vous recevrez une notification dès qu’un administrateur aura pris une décision.' : myInscription.statut === 'VALIDEE' ? 'Votre place est réservée. Rendez-vous le jour J !' : 'Vous ne pouvez pas déposer une nouvelle demande pour cet événement.'}</p>
              <button className="button secondary wide" onClick={() => navigate('/espace/inscriptions')}>Voir mes inscriptions</button>
            </div>
          )}
          {isParticipant && !mine.loading && !myInscription && !full && (
            <form onSubmit={request}>
              <h3>Demander une inscription</h3>
              <p>Votre demande sera examinée par un administrateur. Seules les inscriptions validées réservent une place.</p>
              <label>Profil LinkedIn <span>*</span><input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/..." /></label>
              {error && <div className="field-error">{error}</div>}
              <button className="button primary wide" disabled={busy}>Envoyer ma demande</button>
              <small>La demande sera créée avec le statut En attente.</small>
            </form>
          )}
          {isParticipant && !mine.loading && !myInscription && full && <div className="request-state"><Icon name="users" /><h3>Cet événement est complet</h3><p>Toutes les places disponibles sont actuellement attribuées.</p></div>}
        </aside>
      </div>

      {(related.data?.length ?? 0) > 0 && (
        <section className="related"><span className="eyebrow">À DÉCOUVRIR AUSSI</span><h2>Vous aimerez peut-être</h2>
          <div className="event-grid small-grid">{related.data!.map((e) => <EventCard key={e.id} event={e} onOpen={() => navigate(`/event/${e.id}`)} />)}</div>
        </section>
      )}
    </main>
    <Footer />
    {dialog && <CommentDialog state={dialog} onClose={() => setDialog(null)} onDone={() => comments.reload()} />}
  </>
}
