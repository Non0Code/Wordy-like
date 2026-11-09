# Parla — apprendre l'italien en immersion

Application web mobile-first (installable, utilisable hors ligne) pour apprendre l'italien depuis le français, du niveau A1 au C2.
Elle reprend le concept de Wordy (apprendre avec des scènes de films et de séries, un mot touché = une fiche) avec sa propre identité
visuelle, et y ajoute un système de mémorisation plus poussé et un vrai dictionnaire personnel.

## Démarrage

```bash
npm install
npm run dev          # application (http://localhost:5173) + API (http://localhost:8787)
npm test             # 38 tests (répétition espacée, morphologie, phonétique, sens contextuel, serveur, synchro…)
npm run build && npm start   # production : le serveur Node sert l'API et l'application sur le port 8787
```

Node ≥ 22.13 requis (SQLite intégré à Node, sans dépendance native).

### Activer le professeur IA (facultatif)

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # côté serveur uniquement, jamais exposée au navigateur
npm run dev
```

Modèle utilisé : `claude-opus-5-5` (modifiable via `PARLA_AI_MODEL`). **Sans clé**, l'application ne simule rien : le professeur
passe en « mode démo » signalé partout dans l'interface (correcteur à règles, fiches de grammaire, conversations scénarisées).

## Fonctionnalités

| Domaine | Ce qui est opérationnel |
|---|---|
| Navigation | Accueil · Apprendre · Films · Vocabulaire · Progrès (barre basse sur mobile, latérale sur ordinateur), réglages, thème clair/sombre |
| Parcours | 6 niveaux CECRL, 16 chapitres, 36 leçons (découverte des mots → exercices → phrases en situation → note de grammaire). Les mots déjà maîtrisés sont ignorés ; test de positionnement à l'arrivée |
| Répétition espacée | J0 → J1 → J3 → J7 → J14 → J30 → J60 → J90 puis croissance × facilité ; réponses Facile / Correct / Difficile / Oublié ; facilité propre à chaque mot ; les mots oubliés reviennent dans 10 min (`src/core/srs.ts`) |
| Tableau de bord | Mots dus aujourd'hui, en retard, maîtrisés, nouveaux disponibles, temps estimé ; badge sur l'onglet, compteur dans le titre, notification quotidienne (si autorisée) |
| Vocabulaire | Une fiche par mot (les formes fléchies « vado », « andato »… renvoient à « andare » : aucun doublon), tous les contextes rencontrés, historique de révisions, statut modifiable, recherche, filtres (niveau, catégorie, statut, date), tris (alphabétique, plus difficiles, prochaine révision), ajout manuel |
| Films et séries | Lecteur vidéo, sous-titres italiens synchronisés et cliquables, traduction française, réplique précédente/suivante, répétition d'une réplique, boucle, pause automatique, vitesse 0,5–1,25×, transcription complète à côté (ou dessous sur mobile), nouveaux mots de la scène, ciné-quiz, filtres (type, niveau, thème, durée, difficulté du vocabulaire) |
| Fiche de mot | Traduction **dans le contexte de la phrase** (« magari » = peut-être / si seulement / volontiers), autres sens, API + syllabe accentuée, audio, catégorie, genre, pluriel, conjugaison (7 temps), usage, exemples, statut, ajout |
| Exercices | Traduction, QCM, écriture, construction de phrase, compréhension orale, prononciation, compréhension ciné, conversation — priorité aux mots dus puis inconnus |
| Professeur | Questions, correction structurée (forme correcte, explication de chaque erreur, exercices), conversation selon un scénario, adaptation au niveau, réutilisation des mots les plus fragiles |
| Prononciation | Modèle (normal/lent), enregistrement et réécoute de sa voix, reconnaissance vocale it-IT, score, diagnostic mot par mot (consonnes doubles, gli, gn, ch/ci, sc, voyelles finales, accent), répétition de répliques de films |
| Statistiques | Mots par statut, appris cette semaine, réussite, temps, séries, progression par niveau, courbes d'évolution, XP |
| Motivation | XP, niveaux, série, objectifs du jour, défis hebdomadaires, 18 badges — discrets (toasts courts) |
| Compte | Inscription/connexion, synchronisation multi-appareils, export/restauration JSON, effacement |

## Architecture

```
src/
  core/        logique pure et testée : srs, morphologie (conjugaison, lemmatisation), phonétique,
               analyse de phrase + choix du sens, exercices, prononciation, sous-titres, gamification
  content/     packs de langue (it/ : dictionnaire ~500 entrées, parcours, scènes) — ajouter une langue = un dossier
  db/          IndexedDB (Dexie) : base locale persistante, dépôt, séances, synchronisation
  speech/      synthèse (voix de l'appareil + audio de secours) et reconnaissance vocale
  ai/          client API + professeur démo (à règles)
  pages/ components/   interface React
server/        Express + SQLite (node:sqlite) : comptes (scrypt), sessions, synchronisation, proxy IA
scripts/generate-media.ts   génération des vidéos et audios de démonstration (espeak-ng + ffmpeg)
```

- **Local d'abord** : tout fonctionne sans serveur ni réseau ; la synchronisation fusionne par « dernière écriture gagnante ».
- **Ajouter du contenu** : une scène = un objet `Scene` (`src/content/it/scenes.ts`) + une vidéo et des horodatages ; ou bien
  importer depuis l'interface une vidéo personnelle avec ses sous-titres `.srt`/`.vtt`.
- **Ajouter des mots** : une ligne par mot dans `src/content/it/dictionary-*.ts` (format décrit dans `dsl.ts`).

## Dépendances externes et limites (à connaître)

- **Catalogue vidéo** : aucun extrait de film protégé n'est fourni ni téléchargé. Les 7 scènes intégrées sont des **dialogues
  originaux** voix de synthèse (régénérables avec `npm run media`, nécessite `espeak-ng` et `ffmpeg`). Pour de vrais films : API
  licenciée (à brancher dans `src/db/scenes.ts`) ou vidéos importées par l'utilisateur (stockées uniquement sur son appareil).
- **Professeur IA** : nécessite `ANTHROPIC_API_KEY` sur le serveur (facturation à l'usage). Sans clé : mode démo clairement signalé.
- **Reconnaissance vocale** : Web Speech API (Chrome, Edge, Safari ; absente de Firefox, signalé dans l'interface). Le retour porte
  sur ce qui a été reconnu (mots, lettres, sons typiques), pas sur une analyse acoustique fine.
- **Voix** : la voix italienne de l'appareil est utilisée si elle existe ; sinon audio de secours (espeak, qualité robotique).
- **Notifications** : rappel quotidien à l'ouverture / en arrière-plan ; un vrai push application fermée exigerait un service push.
- **Dictionnaire** : ~500 entrées soignées ; un mot absent peut être ajouté avec sa traduction (ou suggestion IA si connectée).
- **Prononciation des e/o ouverts** et du s/z sonore : simplifiées dans la transcription API automatique.

## Feuille de route suggérée

1. Brancher un catalogue vidéo licencié. 2. Service push pour les rappels. 3. Évaluation acoustique (alignement phonétique côté
serveur). 4. Agrandir le dictionnaire (import d'un lexique sous licence libre). 5. Nouvelles langues via `src/content/<code>/`.
