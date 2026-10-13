// js/config.js
export const CONFIG = {
  // false = usa datos de ejemplo locales (si aplica)
  // true = se conecta a la Netlify Function para leer el repositorio de GitHub real
  usarGitHubReal: true, 

  githubOwner: "fabior1981",     // Tu usuario de GitHub
  githubRepo: "bd",             // El repositorio donde están los JSON
  githubBranch: "main",         // La rama principal
  githubFolder: "espacia/backups" // Ruta exacta sin barra final '/'
};