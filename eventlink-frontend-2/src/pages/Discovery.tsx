import { useEffect, useMemo, useState } from 'react'
import { api, ApiError, withPlaces } from '../api'
import { useAuth } from '../auth'
import { CATEGORIES, CATEGORY_LABEL, dayMonth } from '../helpers'
import { useAsync } from '../hooks'
import { navigate } from '../router'
import { Empty, ErrorState, EventCard, Footer, Icon, Loading, Navbar } from '../components/ui'

export default function Discovery({ cat }: { cat: string }) {
  const { session, user } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(cat || 'TOUS')
  useEffect(() => setCategory(cat || 'TOUS'), [cat])

  // GET /api/evenements/upcoming puis /places pour chaque événement
  const { data, loading, error } = useAsync(() => api.events.upcoming().then(withPlaces), [session?.token])

  const events = useMemo(() => [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [data])
  const filtered = useMemo(
    () => events.filter((e) => (category === 'TOUS' || e.categorie === category) && e.titre.toLowerCase().includes(query.toLowerCase().trim())),
    [events, query, category],
  )
  const featured = events[0]
  const locked = !!error && !session && error instanceof ApiError && (error.status === 401 || error.status === 403)

  return <>
    <Navbar />
    <main>
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow light">RENCONTREZ. APPRENEZ. CRÉEZ.</span>
          <h1>Des événements qui<br />font avancer.</h1>
          <p>Découvrez les conférences, ateliers et rencontres qui réunissent les idées et les talents de demain.</p>
          <div className="hero-search">
            <Icon name="search" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un événement par titre" />
            <button onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>Rechercher</button>
          </div>
        </div>
        {featured && (
          <div className="hero-feature">
            <span>À LA UNE</span><b>{featured.titre}</b><small>{dayMonth(featured.date)} · {featured.adresse}</small>
            <button onClick={() => navigate(`/event/${featured.id}`)}>Voir l’événement <Icon name="arrow" size={16} /></button>
          </div>
        )}
      </section>

      <section className="content-section" id="events">
        <div className="section-heading">
          <div><span className="eyebrow">PROCHAINS RENDEZ-VOUS</span><h2>Événements à venir</h2><p>Explorez des expériences pensées pour apprendre, partager et créer des liens.</p></div>
          {!locked && !error && <span className="event-count">{filtered.length} événement{filtered.length !== 1 ? 's' : ''}</span>}
        </div>
        <div className="filter-scroll">
          {['TOUS', ...CATEGORIES].map((c) => (
            <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
              {c === 'TOUS' ? 'Tous les événements' : CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}
            </button>
          ))}
        </div>

        {locked ? (
          <Empty title="Connectez-vous pour voir les événements" text="Le catalogue est réservé aux comptes EventLink. Connectez-vous ou créez un compte participant en quelques secondes.">
            <button className="button primary" onClick={() => navigate('/login')}>Se connecter</button>
            <button className="button secondary" onClick={() => navigate('/register')}>Créer un compte</button>
          </Empty>
        ) : loading && !data ? <Loading text="Chargement des événements…" />
          : error ? <ErrorState error={error} />
          : filtered.length ? <div className="event-grid">{filtered.map((e) => <EventCard key={e.id} event={e} onOpen={() => navigate(`/event/${e.id}`)} />)}</div>
          : <Empty title="Aucun événement trouvé" text="Essayez un autre titre ou une autre catégorie." />}
      </section>

      <section className="cta-strip">
        <div><span className="eyebrow light">VOTRE ESPACE</span><h2>Tout ce qui compte, au même endroit.</h2><p>Suivez vos inscriptions, vos commentaires et vos notifications depuis votre espace participant.</p></div>
        <button className="button white" onClick={() => navigate(user ? (user.role === 'ADMIN' ? '/admin' : '/espace') : '/login')}>
          {user ? 'Accéder à mon espace' : 'Se connecter'} <Icon name="arrow" size={17} />
        </button>
      </section>
    </main>
    <Footer />
  </>
}
