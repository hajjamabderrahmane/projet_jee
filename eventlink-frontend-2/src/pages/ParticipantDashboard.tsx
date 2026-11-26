import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { dayOf, eventImage, fullName, initials, longDate, monthOf, timeOf } from '../helpers'
import { useAsync } from '../hooks'
import { navigate } from '../router'
import { CommentDialog, type CommentDialogState } from '../components/CommentDialog'
import {
  Comment, DashboardSection, Empty, ErrorState, Footer, Icon, Loading, Navbar, NotificationItem, Stat, StatusBadge, toast,
} from '../components/ui'

const TABS = [
  ['apercu', 'Aperçu', 'grid'],
  ['inscriptions', 'Mes inscriptions', 'calendar'],
  ['commentaires', 'Mes commentaires', 'message'],
  ['notifications', 'Notifications', 'bell'],
  ['profil', 'Mon profil', 'profile'],
] as const

export default function ParticipantDashboard({ tab }: { tab: string }) {
  const { user } = useAuth()
  const [dialog, setDialog] = useState<CommentDialogState | null>(null)
  const active = TABS.find((t) => t[0] === tab)?.[0] ?? 'apercu'

  const { data, loading, error, reload } = useAsync(async () => {
    const [inscriptions, comments, notifications] = await Promise.all([
      api.inscriptions.mine(), api.comments.mine(), api.notifications.mine(),
    ])
    return {
      inscriptions: [...inscriptions].sort((a, b) => b.dateInscription.localeCompare(a.dateInscription)),
      comments: [...comments].sort((a, b) => b.dateCreation.localeCompare(a.dateCreation)),
      notifications,
    }
  }, [])

  if (!user) return null
  const unread = data?.notifications.filter((n) => !n.lue).length ?? 0

  const markRead = (id: number) => api.notifications.read(id).then(reload).catch((e) => toast(e.message, 'error'))
  const markAll = () => api.notifications.readAll().then(() => { toast('Toutes les notifications sont lues'); reload() }).catch((e) => toast(e.message, 'error'))

  const renderRegistrations = (limit?: number) => {
    const rows = (data?.inscriptions ?? []).slice(0, limit)
    if (!rows.length) return <Empty title="Aucune inscription" text="Parcourez les événements à venir et envoyez votre première demande."><button className="button primary" onClick={() => navigate('/')}>Découvrir des événements</button></Empty>
    return <div className="registration-list">{rows.map((r) => (
      <div className="registration-item" key={r.id}>
        <img src={eventImage(r.evenement)} alt="" />
        <div className="registration-main"><b>{r.evenement.titre}</b>
          <span><Icon name="calendar" size={15} /> {dayOf(r.evenement.date)} {monthOf(r.evenement.date)} · {timeOf(r.evenement.date)}</span>
          <span><Icon name="pin" size={15} /> {r.evenement.adresse}</span></div>
        <div className="registration-status"><StatusBadge status={r.statut} /><small>Demandée le {longDate(r.dateInscription)}</small></div>
        <button className="icon-btn" aria-label="Voir l’événement" onClick={() => navigate(`/event/${r.evenement.id}`)}><Icon name="arrow" /></button>
      </div>))}</div>
  }

  const body = () => {
    if (loading && !data) return <Loading />
    if (error || !data) return error ? <ErrorState error={error} /> : null
    const count = (s: string) => data.inscriptions.filter((i) => i.statut === s).length

    if (active === 'apercu' || active === 'inscriptions') return <>
      <div className="welcome-row">
        <div><span className="eyebrow">ESPACE PARTICIPANT</span><h1>{active === 'apercu' ? `Bonjour ${user.prenom},` : 'Mes inscriptions'}</h1><p>{active === 'apercu' ? 'Voici où en sont vos prochaines expériences.' : 'Retrouvez toutes vos demandes et leur statut actuel.'}</p></div>
        <button className="button primary" onClick={() => navigate('/')}>Découvrir des événements</button>
      </div>
      <div className="stat-grid">
        <Stat label="Inscriptions" value={data.inscriptions.length} icon="calendar" />
        <Stat label="Validée" value={count('VALIDEE')} icon="check" tone="green" />
        <Stat label="En attente" value={count('EN_ATTENTE')} icon="users" tone="amber" />
        <Stat label="Refusée" value={count('REFUSEE')} icon="close" tone="red" />
      </div>
      <section className="panel">
        <div className="panel-heading"><div><h2>Mes inscriptions</h2><p>{active === 'apercu' ? 'Vos demandes les plus récentes' : 'Toutes vos demandes'}</p></div>
          {active === 'apercu' && <button className="text-button" onClick={() => navigate('/espace/inscriptions')}>Tout voir <Icon name="arrow" size={16} /></button>}</div>
        {renderRegistrations(active === 'apercu' ? 3 : undefined)}
      </section>
      {active === 'apercu' && <section className="panel notification-preview">
        <div className="panel-heading"><div><h2>Notifications récentes</h2><p>{unread} nouvelle{unread > 1 ? 's' : ''} notification{unread > 1 ? 's' : ''}</p></div>
          <button className="text-button" onClick={() => navigate('/espace/notifications')}>Tout voir <Icon name="arrow" size={16} /></button></div>
        {data.notifications.length ? data.notifications.slice(0, 2).map((n) => <NotificationItem key={n.id} n={n} onRead={() => markRead(n.id)} />) : <p className="empty-row">Aucune notification pour le moment.</p>}
      </section>}
    </>

    if (active === 'commentaires') return (
      <DashboardSection eyebrow="VOTRE ACTIVITÉ" title="Mes commentaires" text="Vous pouvez modifier ou supprimer uniquement vos propres commentaires.">
        <section className="panel comments-panel">
          {data.comments.length ? data.comments.map((c) => (
            <Comment key={c.id} c={c} context={c.evenement.titre} canEdit canDelete onEdit={() => setDialog({ kind: 'edit', c })} onDelete={() => setDialog({ kind: 'delete', c })} />
          )) : <Empty title="Aucun commentaire" text="Vos questions et avis publiés sur les événements apparaîtront ici." />}
        </section>
      </DashboardSection>
    )

    if (active === 'notifications') return (
      <DashboardSection eyebrow="RESTEZ INFORMÉ(E)" title="Notifications" text={`${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}`}
        action={<button className="button secondary" disabled={!unread} onClick={markAll}>Tout marquer comme lu</button>}>
        <section className="panel">{data.notifications.length ? data.notifications.map((n) => <NotificationItem key={n.id} n={n} onRead={() => markRead(n.id)} />) : <Empty title="Aucune notification" text="Vous serez prévenu(e) dès qu’une demande est traitée." />}</section>
      </DashboardSection>
    )

    return (
      <DashboardSection eyebrow="VOTRE COMPTE" title="Mon profil" text="Consultez les informations associées à votre compte.">
        <section className="panel profile-panel">
          <div className="profile-hero"><span className="avatar avatar-xl">{initials(user)}</span><div><h2>{fullName(user)}</h2><p>Participant EventLink</p></div></div>
          <div className="profile-fields">
            <label>Prénom<input value={user.prenom} readOnly /></label><label>Nom<input value={user.nom} readOnly /></label>
            <label>Adresse e-mail<input value={user.email} readOnly /></label><label>Rôle<input value="Participant" readOnly /></label>
          </div>
        </section>
      </DashboardSection>
    )
  }

  return <>
    <Navbar />
    <div className="dashboard-shell">
      <aside className="participant-nav">
        <div><span className="avatar avatar-lg">{initials(user)}</span><b>{fullName(user)}</b><span>{user.email}</span></div>
        {TABS.map(([slug, label, icon]) => (
          <button key={slug} className={active === slug ? 'active' : ''} onClick={() => navigate(`/espace/${slug}`)}>
            <Icon name={icon} />{label}{slug === 'notifications' && unread > 0 && <i>{unread}</i>}
          </button>
        ))}
      </aside>
      <main className="dashboard-main">
        <div className="mobile-tabs">{TABS.map(([slug, label]) => <button key={slug} className={active === slug ? 'active' : ''} onClick={() => navigate(`/espace/${slug}`)}>{label}</button>)}</div>
        {body()}
      </main>
    </div>
    {dialog && <CommentDialog state={dialog} onClose={() => setDialog(null)} onDone={reload} />}
  </>
}

