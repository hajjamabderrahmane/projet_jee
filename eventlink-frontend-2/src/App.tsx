import { useEffect } from 'react'
import { useAuth } from './auth'
import { navigate, usePath } from './router'
import { Loading, Toaster } from './components/ui'
import AdminDashboard from './pages/AdminDashboard'
import Auth from './pages/Auth'
import Discovery from './pages/Discovery'
import EventDetail from './pages/EventDetail'
import ParticipantDashboard from './pages/ParticipantDashboard'

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to), [to])
  return null
}

// Routes (hash) : #/  #/event/:id  #/login  #/register  #/espace/:onglet  #/admin/:onglet
function Routes() {
  const { user, session, ready } = useAuth()
  const [pathname, qs = ''] = usePath().split('?')
  const [root, param] = pathname.split('/').filter(Boolean)

  if (root === 'login' || root === 'register') return <Auth mode={root} />

  if (root === 'espace' || root === 'admin') {
    if (!session) return <Redirect to="/login" />
    if (!ready || !user) return <Loading text="Chargement de votre espace…" />
    if (root === 'admin') return user.role === 'ADMIN' ? <AdminDashboard tab={param ?? 'overview'} /> : <Redirect to="/espace" />
    return user.role === 'PARTICIPANT' ? <ParticipantDashboard tab={param ?? 'apercu'} /> : <Redirect to="/admin" />
  }

  if (root === 'event' && Number.isInteger(Number(param))) return <EventDetail id={Number(param)} />
  return <Discovery cat={new URLSearchParams(qs).get('cat') ?? ''} />
}

export default function App() {
  return <>
    <Routes />
    <Toaster />
  </>
}
