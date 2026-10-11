// config.js
const CONFIG = {
  // false = usa los datos de ejemplo precargados localmente
  // true = se conecta a la Netlify Function para leer el repositorio de GitHub real
  usarGitHubReal: true, 

  githubOwner: "fabior1981",     // Tu usuario o organización de GitHub
  githubRepo: "bd",         // El repositorio donde están los JSON
  githubBranch: "main",                         // La rama (ej: main o master)
  githubFolder: "espacia/backups/"              // La subcarpeta exacta dentro del repo
};