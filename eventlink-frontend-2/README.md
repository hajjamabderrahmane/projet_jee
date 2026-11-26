# EventLink — Frontend (React + Vite)

Frontend du backend Spring Boot **EventLink**. Même design que la maquette Figma Make (le CSS `src/index.css` est conservé tel quel), branché sur l’API réelle (JWT, rôles ADMIN / PARTICIPANT).

## Démarrage

```bash
pnpm install        # ou npm install
cp .env.example .env   # adapter VITE_API_URL si besoin (défaut : http://localhost:8080)
pnpm dev            # http://localhost:5173
```

Le port **5173** est imposé : c’est la seule origine autorisée par `CorsConfig.java`.

## Structure

| Fichier | Rôle |
|---|---|
| `src/api.ts` | Client HTTP + tous les endpoints (1 pour 1 avec les controllers), gestion du JWT et des erreurs `GlobalExceptionHandler` |
| `src/auth.tsx` | Contexte d’authentification (login, register, logout, `/api/users/me`) |
| `src/router.ts` | Mini routeur par hash (`#/event/3`, `#/espace/inscriptions`, `#/admin/evenements`) |
| `src/pages/*` | Discovery, EventDetail, Auth, ParticipantDashboard, AdminDashboard |
| `src/components/*` | Navbar, Footer, EventCard, Modal, dialogues de commentaires… |

## Correspondance design ↔ backend

- **Découvrir** : `GET /api/evenements/upcoming` + `GET /api/evenements/{id}/places` (places restantes = capacité − inscriptions VALIDEE).
- **Détail** : événement, commentaires, `POST /api/inscriptions` (champ LinkedIn obligatoire), statut lu via `GET /api/inscriptions/me`.
- **Espace participant** : inscriptions, commentaires (modifier / supprimer les siens), notifications (`/lue`, `/toutes-lues`), profil via `/api/users/me`.
- **Espace admin** : CRUD événements, valider / refuser les inscriptions, modération des commentaires (`/{id}/admin`), liste et suppression des participants.
- Les erreurs métier du backend (événement complet, doublon, capacité < validées, suppression bloquée…) s’affichent telles quelles.

## Points d’attention côté backend

1. **Catalogue public** : dans `SecurityConfig`, `anyRequest().authenticated()` oblige à être connecté pour voir les événements. Le front affiche alors un écran « Connectez-vous ». Pour une page d’accueil publique, ajouter :
   ```java
   .requestMatchers(HttpMethod.GET, "/api/evenements/**").permitAll()
   ```
2. **Pas d’endpoint « liste globale »** (toutes les inscriptions / tous les commentaires) : l’admin les agrège en interrogeant chaque événement.
3. **Images** : l’entité `Evenement` n’a pas d’image, le front choisit un visuel du design selon la catégorie.
4. **Sérialisation JSON** : `Inscription` et `Commentaire` exposent `user` et `evenement` en `LAZY`. Si vous obtenez une erreur `ByteBuddyInterceptor` / `hibernateLazyInitializer`, ajoutez `@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})` sur les entités ou `spring.jackson.serialization.fail-on-empty-beans=false`.
