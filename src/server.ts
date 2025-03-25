import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors'; // Importation du middleware CORS

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Configurer CORS pour autoriser les requêtes de n'importe quelle origine
app.use(cors({
  origin: '*', // Accepter toutes les origines, ou spécifie une origine comme 'http://localhost:4200'
  methods: ['GET', 'POST'], // Méthodes autorisées
  allowedHeaders: ['Content-Type'], // En-têtes autorisés
}));

/**
 * Exemple de points d'API REST Express peut être défini ici.
 * Décommente et définis les points d'API au besoin.
 *
 * Exemple :
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Gérer la requête API
 * });
 * ```
 */

/**
 * Servir les fichiers statiques depuis /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Gérer toutes les autres requêtes en rendant l'application Angular.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Démarrer le serveur si ce module est le point d'entrée principal.
 * Le serveur écoute sur le port défini par la variable d'environnement `PORT`, ou par défaut sur le port 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Le gestionnaire de requêtes utilisé par le CLI Angular (serveur de développement et lors de la construction).
 */
export const reqHandler = createNodeRequestHandler(app);
