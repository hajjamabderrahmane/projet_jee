import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { navigate } from '../router'
import { Icon, Logo } from '../components/ui'

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register'
  const { user, login, register: signUp } = useAuth()
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => { setError('') }, [mode])
  useEffect(() => { if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/') }, [user])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (register) await signUp({ prenom: form.prenom.trim(), nom: form.nom.trim(), email: form.email, password: form.password })
      const role = await login(form.email, form.password, register ? true : remember)
      navigate(role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      setError((err as Error).message)
    } finally { setBusy(false) }
  }

  return <div className="auth-shell">
    <div className="auth-visual"><div className="auth-image" /><div className="auth-overlay" /><Logo inverse /><div className="auth-quote"><span className="eyebrow light">EVENTLINK</span><h2>Les idées prennent vie quand les personnes se rencontrent.</h2><p>Rejoignez une communauté qui apprend, partage et avance ensemble.</p></div><span className="auth-caption">Future of AI Summit · Paris</span></div>
    <div className="auth-form-wrap"><div className="auth-mobile-logo"><Logo /></div><div className="auth-form">
      <span className="eyebrow">{register ? 'CRÉER VOTRE ESPACE' : 'HEUREUX DE VOUS REVOIR'}</span>
      <h1>{register ? 'Rejoignez EventLink' : 'Connectez-vous'}</h1>
      <p>{register ? 'Créez votre compte participant pour découvrir et rejoindre les prochains événements.' : 'Accédez à vos inscriptions, commentaires et notifications.'}</p>
      <form onSubmit={submit}>
        {register && <div className="form-row"><label>Prénom<input required value={form.prenom} onChange={set('prenom')} placeholder="Camille" /></label><label>Nom<input required value={form.nom} onChange={set('nom')} placeholder="Martin" /></label></div>}
        <label>Adresse e-mail<input required type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="vous@universite.fr" /></label>
        <label>Mot de passe<input required type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} value={form.password} onChange={set('password')} placeholder="8 caractères minimum" /></label>
        {!register && <div className="form-options"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Se souvenir de moi</label></div>}
        {error && <div className="form-error">{error}</div>}
        <button className="button primary wide" disabled={busy}>{busy ? 'Veuillez patienter…' : register ? 'Créer mon compte participant' : 'Se connecter'}</button>
      </form>
      {register && <div className="role-note"><Icon name="profile" /><p><b>Compte participant</b><span>Chaque nouveau compte est créé avec le rôle Participant.</span></p></div>}
      <div className="auth-switch">{register ? 'Vous avez déjà un compte ?' : 'Nouveau sur EventLink ?'} <button onClick={() => navigate(register ? '/login' : '/register')}>{register ? 'Se connecter' : 'Créer un compte'}</button></div>
      <button className="back-home" onClick={() => navigate('/')}>← Retour à l’accueil</button>
    </div></div>
  </div>
}
