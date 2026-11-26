import { FormEvent, useState } from 'react'
import { api } from '../api'
import type { Commentaire } from '../types'
import { Modal, toast } from './ui'

export type CommentDialogState =
  | { kind: 'add'; evenementId: number }
  | { kind: 'edit'; c: Commentaire }
  | { kind: 'delete'; c: Commentaire; admin?: boolean }

/** Ajout / modification / suppression d’un commentaire (POST, PUT, DELETE, DELETE …/admin). */
export function CommentDialog({ state, onClose, onDone }: { state: CommentDialogState; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState(state.kind === 'edit' ? state.c.contenu : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setError('')
    try { await fn(); toast(ok); onDone(); onClose() }
    catch (e) { setError((e as Error).message); setBusy(false) }
  }

  if (state.kind === 'delete') {
    const { c, admin } = state
    return (
      <Modal title="Supprimer ce commentaire ?" onClose={onClose}>
        <p className="confirm-copy">Cette action supprimera définitivement le commentaire sélectionné.</p>
        {error && <div className="form-error" style={{ marginTop: 14 }}>{error}</div>}
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="button secondary" onClick={onClose}>Annuler</button>
          <button className="button danger" disabled={busy} onClick={() => run(() => (admin ? api.comments.removeAdmin(c.id) : api.comments.remove(c.id)), 'Commentaire supprimé')}>Confirmer la suppression</button>
        </div>
      </Modal>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const contenu = text.trim()
    if (!contenu) return setError('Le commentaire ne peut pas être vide.')
    if (state.kind === 'add') run(() => api.comments.add(state.evenementId, contenu), 'Commentaire publié')
    else run(() => api.comments.edit(state.c.id, contenu), 'Commentaire modifié')
  }

  return (
    <Modal title={state.kind === 'add' ? 'Ajouter un commentaire' : 'Modifier le commentaire'} onClose={onClose}>
      <form className="comment-form" onSubmit={submit}>
        <textarea rows={5} maxLength={1000} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Partagez votre question ou votre avis…" />
        <small>{text.length}/1000</small>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Annuler</button>
          <button className="button primary" disabled={busy}>{state.kind === 'add' ? 'Publier' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
