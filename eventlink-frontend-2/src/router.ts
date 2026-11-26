import { useSyncExternalStore } from 'react'

// Mini routeur sur le hash (#/event/3, #/espace/inscriptions…) : aucune dépendance en plus.
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snapshot = () => location.hash.replace(/^#/, '') || '/'

export const usePath = () => useSyncExternalStore(subscribe, snapshot)

export function navigate(path: string) {
  if (snapshot() === path) window.scrollTo(0, 0)
  else location.hash = path
}
window.addEventListener('hashchange', () => window.scrollTo(0, 0))
