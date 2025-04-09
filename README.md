# Chess Analysis

<p align="center">
  <img src="src/assets/logo.png" alt="Chess Analysis Logo" width="350">
</p>

Chess Analysis est une application web développée avec Angular permettant d'analyser vos parties d'échecs provenant de Chess.com et Lichess.org.

## 📋 Fonctionnalités

- **Multi-plateforme** : Analyse des parties depuis Chess.com et Lichess.org
- **Statistiques ELO** : Suivi de l'évolution de votre ELO dans le temps
- **Analyse d'ouvertures** : Découvrez vos ouvertures les plus performantes
- **Fréquence de jeu** : Visualisez votre activité au fil des mois
- **Analyse des fins de parties** : Statistiques sur vos victoires, défaites et nulles
- **Recommandations de puzzles** : Suggestions d'exercices basées sur vos faiblesses

## 🚀 Installation

### Prérequis

- Node.js (v16.x ou supérieur)
- npm (v8.x ou supérieur)
- Angular CLI (v16.x ou supérieur)

### Étapes d'installation

1. Cloner ce dépôt
```bash
git clone https://github.com/VotreUsername/chess-analysis.git
cd chess-analysis
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer l'application en mode développement
```bash
ng serve
```

4. Ouvrir votre navigateur à l'adresse `http://localhost:4200`

## 🖥️ Utilisation

1. **Page d'accueil** : Saisissez votre nom d'utilisateur Chess.com ou Lichess
2. **Statistiques** : Consultez vos statistiques d'ELO, d'ouvertures et de jeu
3. **Filtres** : Affinez les statistiques par période (semaine, mois, année) ou par type de jeu (blitz, rapide, etc.)

## 📊 Visualisations disponibles

- **Graphique d'évolution ELO** : Suivez votre progression au fil du temps
- **Fréquence de jeu** : Nombre de parties jouées par mois
- **Statistiques d'ouvertures** : Vos performances avec différentes ouvertures
- **Fins de partie** : Analyse des différentes façons dont vos parties se terminent

## 🧩 Structure du projet

- `src/app` : Composants Angular de l'application
- `src/api` : Services d'intégration avec les APIs Chess.com et Lichess
- `src/analyse` : Services d'analyse des parties et des puzzles
- `src/assets` : Ressources statiques (images, données locales)

## 🛠️ Technologies utilisées

- **Frontend** : Angular 16+
- **Graphiques** : Chart.js
- **APIs** : Chess.com API, Lichess API
- **Analyse d'échecs** : chess.js
