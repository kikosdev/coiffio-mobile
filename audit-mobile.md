# AUDIT — État des lieux salon-mobile (BLACK BOX) — surface OWNER

## 1. Structure & navigation

**Groupes de routes Expo Router dans `app/`** :

| Groupe | Existe | Écrans |
|---|---|---|
| `(auth)` | ✅ | `login.tsx`, `create-account.tsx` |
| `(client)` | ✅ | home, search, booking/*, appointments/*, profile/*, salon/[id], barber/[id], offers, choose-location |
| `(staff)` | ✅ | today, schedule, caisse, clients/*, appointment/[id], earnings, services, profile, settings, personal-info, change-password |
| `(owner)` | ✅ | hq, caisse, salons, salon/[id], team, team/[id], team/invite, analytics, settings, change-password |

Le groupe OWNER **existe** et est complet côté fichiers (`app/(owner)/_layout.tsx` + 10 écrans).

**Résolution du rôle après login** — `app/(auth)/login.tsx:154-168` :
```ts
async function handleSignIn() {
  const user = await login(identifier.trim(), password);
  // Redirect by the account's real role, not the login variant the user tapped
  const surface = mapBackendRoleToSurface(user.role);
  setRole(surface);
  router.replace(ROLE_AUTH[surface].home as never);
}
```
`mapBackendRoleToSurface` ([src/features/auth/roleConfig.ts:9-13](src/features/auth/roleConfig.ts)) : `owner→owner`, `manager|stylist|colorist→staff`, sinon `client`. `ROLE_AUTH.owner.home = '/(owner)/hq'`.

Au démarrage de l'app, `app/_layout.tsx:38-45` réhydrate `useAuthStore` puis resynchronise `useRoleStore` (pas de redirect automatique ici — c'est chaque `(group)/_layout.tsx` qui fait office de garde via `useRoleGuard`, cf. §6).

**Bottom-tabs owner** — définis dans `app/(owner)/_layout.tsx:27-56` : **6 onglets** — HQ, Caisse, Salons, Team, Analytics, Settings. Routes additionnelles sans tab (`href: null`) : `team/[id]`, `team/invite`, `salon/[id]`, `change-password`.

Note : ceci diffère d'une observation antérieure (mémoire projet) qui listait 5 onglets sans "Salons" — l'onglet Salons a été ajouté depuis.

## 2. Couche API (`src/api/`)

Seulement **3 fichiers** dans `src/api/` — aucun n'est dédié au domaine owner.

| Fichier | Fonction | Endpoint appelé | Notes |
|---|---|---|---|
| `client.ts` | `api.get/post/patch/del`, `setAuthToken`, `ApiError` | (wrapper `fetch` générique) | Pas d'Axios malgré la mémoire projet — implémentation `fetch` maison |
| `salons.ts` | `listSalons()` | `GET /public/salons` | Discovery publique |
| `salons.ts` | `getSalon(id)` | `GET /public/salons/:id` | |
| `booking.ts` | `fetchCatalog()` | `GET /book/services` | Cache 5 min |
| `booking.ts` | `fetchBookableStylists()` | `GET /public/salons/:slug/team` | Cache 5 min |
| `booking.ts` | `fetchAvailability()` | `GET /availability` | |
| `booking.ts` | `fetchTimeline()` | `GET /availability/timeline` | |
| `booking.ts` | `fetchAvailableStylistIds()` | (dérivé de `fetchTimeline`) | Pas d'appel réseau propre |
| `booking.ts` | `createAppointment()` | `POST /appointments` | |

**Tous les appels owner passent par `api.get/post/patch/del` directement depuis les hooks** (`src/hooks/owner/*.ts`), sans passer par un module `src/api/owner.ts`. C'est une absence de convention, pas un endpoint manquant.

`src/api/client.ts` vérifié (`client.ts:1-101`) :
- Base URL : `EXPO_PUBLIC_API_URL`, fallback `https://coif-backend.onrender.com/api` (log `console.warn` si absente au build)
- Injection Bearer : variable module `authToken` (pas lu depuis SecureStore à chaque requête — `setAuthToken()` est appelé une fois par `authStore.hydrate()`/`login()`)
- Unwrap enveloppe : `return (json?.data ?? null) as T` (`client.ts:74`)
- Handler 401 : **ABSENT** — aucun code ne vérifie `res.status === 401` pour déclencher une déconnexion globale ; seul `authStore.hydrate()` gère le cas token invalide au démarrage (catch → purge SecureStore). Une requête 401 en cours de session ne délogue pas l'utilisateur automatiquement.

## 3. Stores (`src/stores/`)

| Store | État | Actions principales | API réelle ou dummy |
|---|---|---|---|
| `auth.ts` | `status`, `user`, `error` | `login`, `registerClient`, `updateProfile`, `changePassword`, `deactivateAccount`, `hydrate` | Réelle (`/auth/*`) |
| `appointments.ts` | `upcomingItems`, `historyItems` | `fetchUpcoming`, `fetchHistory`, `cancelAppointment` | Réelle (`/appointments/mine`, `/appointments/:id/cancel`) — usage **client**, pas owner |
| `bookingDraft.ts` | brouillon de réservation (services, slot, contact) | `init`, `addService`, `setSlot`, `total()`… | Pas d'API — état local pur (draft) |
| `home.ts` | `latestVisit`, `nearby`, `salons` | `fetchLatestVisit`, `fetchNearby`, `fetchSalons` | Réelle — usage client |
| `profile.ts` | profil client | `fetchProfile`, `updateField`, `changePassword` | Réelle (`/auth/me`) — usage client |
| `search.ts` | catégories, résultats, offerings | `fetchLanding`, `searchServices`, `fetchOfferings` | Réelle — usage client |
| `settings.ts` | `searchRadiusKm` | `setSearchRadiusKm` | Local pur, pas d'API |

**Aucun store Zustand n'est dédié au domaine owner.** Les données owner (`useMySalon`, `useAnalytics`, `useCaisseOverview`, `useBarberDetail`) sont gérées par des hooks `useState`/`useEffect` locaux dans `src/hooks/owner/`, pas par un store partagé — ce qui explique pourquoi `hq.tsx`, `team.tsx` et `salon/[id].tsx` déclenchent chacun leur propre `GET /owner/hq` au lieu de partager un cache.

## 4. Données mock (`src/data/`)

- `src/data/` : **ABSENT** — ce dossier n'existe pas dans le repo actuel.
- Marqueurs `// SWAP:` : **ABSENT** — aucune occurrence trouvée (grep exhaustif sur `.ts`/`.tsx`).
- Marqueurs `dummy` / `mock` / `getMock` / `BB-12345` / `hardcod*` : **ABSENT** — aucune occurrence.

Conclusion factuelle : la surface owner ne contient **aucune donnée mockée résiduelle** au sens littéral. Les écrans non câblés sont des stubs UI (formulaire qui ne poste rien, bouton `disabled`) plutôt que des écrans à données fictives — cf. §5 et §7.

## 5. Écrans owner — inventaire par domaine

| Domaine | État | Fichier | Source de données |
|---|---|---|---|
| **Overview / HQ** | ✅ EXISTE | `app/(owner)/hq.tsx` | API réelle via `useMySalon()` → `GET /owner/hq` |
| **Team** | ⚠️ PARTIEL | `app/(owner)/team.tsx`, `team/[id].tsx`, `team/invite.tsx` | Liste + détail : API réelle (`GET /team`, `GET /team/:id/stats` via `useBarberDetail`). **Création (invite) : stub UI non câblé** — `team/invite.tsx:24-27` a un commentaire `// TODO: POST /team/invite { fullName, mobile }` et `handleSend()` ne fait que `router.back()`, aucun appel réseau. Édition/suppression : **ABSENT** (aucun bouton, aucun appel `PATCH`/`DELETE /team/:id`). |
| **Horaires** | ❌ ABSENT | — | Aucun écran horaires salon, aucun écran horaires par staff, aucune gestion congés. `settings.tsx:15` liste "Salon hours & services" mais `onPress: undefined` (item désactivé, non cliquable). |
| **Appointments** | ❌ ABSENT | — | Aucun écran agenda/RDV dans `(owner)/`. Aucune référence à `/appointments` dans tout le groupe owner (vérifié par grep). |
| **Stock** | ❌ ABSENT | — | Aucun fichier, aucune route, aucun appel `/products` ou `/stock` nulle part dans le repo mobile. |
| **Ventes retail** | ❌ ABSENT | — | Aucun appel `/sales` dans tout le repo mobile. |
| **Caisse / Finance** | ⚠️ PARTIEL | `app/(owner)/caisse.tsx` | Overview câblé (`useCaisseOverview()` → `GET /caisse/overview`). Pas d'encaissement RDV côté owner (le paiement se fait côté staff, `src/hooks/staff/*`). Dépenses / refund : **ABSENT** côté owner. |
| **Orders** | ❌ ABSENT | — | Aucun appel `/orders` nulle part dans le repo mobile. |

Écran bonus non listé dans les 7 domaines : **Analytics** (`analytics.tsx`, API réelle `GET /reports?period=month` via `useAnalytics()`) et **Salons** (`salons.tsx`, `salon/[id].tsx` — vue mono-salon, avec un modal "Add Location" verrouillé par `ComingNextLock`).

## 6. Conventions

**`useTheme()`** : utilisé systématiquement dans tous les écrans/composants owner inspectés. Violations hex hardcodées trouvées :

| Fichier | Ligne | Hex |
|---|---|---|
| `app/(owner)/hq.tsx:63` | gradient dégradé | `['#23201B', '#141210']` |
| `app/(owner)/hq.tsx:70` | `borderColor` | `#34302A` |
| `app/(owner)/hq.tsx:88` | `backgroundColor` (pill) | `#1F1810` |
| `app/(owner)/team/[id].tsx:65` | `borderColor` | `#34302A` |
| `src/components/kit.tsx:162,462,470,503-509` | plusieurs | `#FFFFFF`, `#34302A`, `#1F1810`, `#444444` |

Ce sont des accents décoratifs (dégradés, glow, statut par défaut) plutôt que des couleurs de fond/texte principales, mais ils contournent le système de tokens (`t.color.*`) et ne suivront pas un futur re-theming.

**Utils format** :
- `src/utils/formatMoney.ts` — existe, `formatMoney(tnd)` → `"X.XXX TND"` (3 décimales). Utilisé systématiquement dans les écrans owner.
- `src/utils/salonTime.ts` — existe, avec `formatSalonDate`, `formatSalonTime`, `salonDateKey`, `nowAsSalonTime`. Pas de fichier `src/lib/format.ts` (chemin cité en mémoire, obsolète — le vrai chemin est `src/utils/`).
- `toISOString()`/`toFixed()` sauvages : trouvés dans `src/hooks/staff/useMyEarnings.ts`, `useSchedule.ts`, et des écrans **client/staff** (`home.tsx`, `profile.tsx`, `today.tsx`) — **aucune occurrence dans le groupe owner**, qui reste propre sur ce point.

**Gating owner** : `useRoleGuard(surface)` ([src/hooks/useRoleGuard.ts](src/hooks/useRoleGuard.ts)) — hook réutilisable, appelé dans `app/(owner)/_layout.tsx:8`. Redirige vers `/` si pas hydraté/pas le bon rôle.

**State machine loading/error/empty/ready** : **pas de composant générique** — chaque écran gère `isLoading`/`error`/liste-vide à la main avec un `if (!salon) return (...)` ou une ternaire (`hq.tsx`, `caisse.tsx`, `salon/[id].tsx`, `team/[id].tsx`). `Screen`/`ScreenHeader`/`ProfileScreen` (`src/components/kit.tsx`) ne sont que des wrappers de mise en page, sans logique d'état intégrée. Le pattern est cohérent d'un écran à l'autre mais dupliqué, pas factorisé.

## 7. Matrice d'écart vs backend

| Domaine | Endpoint backend | Consommé mobile ? | Fichier api | Écran |
|---|---|---|---|---|
| Overview | `GET /overview` | ⚠️ Oui mais sous un autre chemin — `GET /owner/hq` | `src/hooks/owner/useMySalon.ts:41` | `hq.tsx`, `salons.tsx`, `salon/[id].tsx`, `team.tsx` |
| Team | `GET /team` | ✅ Oui (dans `useBarberDetail`, pas une liste dédiée) | `src/hooks/owner/useBarberDetail.ts:41` | `team/[id].tsx` (liste owner vient en fait de `useMySalon().team`, pas de `GET /team` direct) |
| Team | `POST /team` | ❌ NON câblé (stub UI, TODO) | — | `team/invite.tsx` |
| Team | `GET/PATCH/DELETE /team/:id` | ❌ NON câblé (GET stats seulement, pas d'édition/suppression) | `useBarberDetail.ts` (GET stats only) | `team/[id].tsx` |
| Schedule | `GET/PATCH /team/:id/schedule` | ❌ NON câblé | — | — |
| Horaires salon | `GET /salons/:salonId/hours` | ❌ NON câblé | — | — |
| Appointments | `GET/POST/PATCH /appointments` | ❌ NON câblé côté owner | — | — |
| Services | `GET /services` | ❌ NON câblé côté owner (utilisé côté staff seulement) | `src/hooks/staff/useAppointment.ts`, `useMyServices.ts` | — |
| Stock | `GET/POST /products` · `PATCH/DELETE /products/:id` · `GET /stock/moves` | ❌ NON câblé | — | — |
| Sales | `POST/GET /sales` · `GET /sales/best-sellers` · `DELETE /sales/:id` | ❌ NON câblé | — | — |
| Caisse | `GET /caisse/overview` | ✅ Oui | `src/hooks/owner/useCaisseOverview.ts:32` | `caisse.tsx` |
| Caisse | `POST /payments` · `POST /payments/:id/refund` | ❌ NON câblé côté owner (`POST /payments` existe côté **staff** dans `useAppointment.ts`, `useDayCaisse.ts`, `useTodayBoard.ts`) | — | — |
| Dépenses | `GET/POST/PATCH/DELETE /expenses` | ❌ NON câblé | — | — |
| Reports | `GET /reports?period=` | ✅ Oui | `src/hooks/owner/useAnalytics.ts:33` | `analytics.tsx` |
| Orders | `GET /orders` · `GET /orders/stats` · `GET /orders/:id` · `PATCH /orders/:id/status` | ❌ NON câblé | — | — |
| Notifications | `GET /notifications` | ✅ Oui | `src/hooks/useNotifications.ts:60` | `hq.tsx` (badge cloche), `app/notifications.tsx` |
| Notifications | `GET /notifications/unread-count` | ⚠️ Pas appelé tel quel — `unreadCount` est **dérivé côté client** en filtrant la liste complète (`useNotifications.ts:73`) | — | `hq.tsx` |
| Notifications | `PATCH /notifications/:id/read` | ✅ Oui (`POST`, pas `PATCH` — à vérifier avec le backend) | `useNotifications.ts:78` | `app/notifications.tsx` |

## 8. Synthèse finale

- **% de la surface owner câblée à l'API** : sur les 7 domaines demandés, 2 sont pleinement câblés (Overview, Caisse-overview), 2 sont partiels (Team lecture seule, rien en écriture), 3 sont totalement absents (Horaires, Appointments, Stock, Ventes, Orders — soit 4 sur 7 en réalité). Estimation grossière : **~25-30 % de la surface owner attendue est réellement câblée**.
- **Top 3 trous les plus bloquants** : (1) aucun écran Appointments/agenda côté owner — impossible de voir/gérer le planning salon depuis ce rôle ; (2) Stock, Ventes retail et Orders sont **totalement absents** (zéro fichier, zéro appel) malgré des endpoints backend existants ; (3) Team en écriture est un stub — `team/invite.tsx` a un TODO explicite et ne poste rien, aucune édition/suppression de staff.
- **Risques repérés** : pas de mock silencieux (aucun `src/data/` ni marqueur `dummy`/`mock` — bon point) ; en revanche des **stubs UI silencieux** qui ressemblent à des features finies (bouton "Send invite" qui fonctionne visuellement mais ne fait rien) ; endpoint Overview nommé différemment du spec (`/owner/hq` vs `/overview` attendu) ; pas de handler 401 global côté client HTTP ; quelques hex hardcodés en JSX (accents décoratifs uniquement).
- **Endpoints backend cités par le mobile mais non vérifiables directement dans ce repo (à confirmer côté backend)** : `// SWAP: à confirmer` → `GET /owner/hq` (nom exact, correspond-il au spec `/overview` ?), `POST /notifications/:id/read` (le mobile fait un `POST`, le spec `§7` attend un `PATCH`), `POST /notifications/read-all` (non listé dans le spec fourni).

AUDIT TERMINÉ — aucun fichier modifié.
