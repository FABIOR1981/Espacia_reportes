// config.js
const CONFIG = {
  // false = usa los datos de ejemplo precargados localmente
  // true = se conecta a la Netlify Function para leer el repositorio de GitHub real
  usarGitHubReal: true, 

  githubOwner: "tu-usuario-o-organizacion",     // Tu usuario o organización de GitHub
  githubRepo: "nombre-del-repositorio",         // El repositorio donde están los JSON
  githubBranch: "main",                         // La rama (ej: main o master)
  githubFolder: "backups/reservas"              // La subcarpeta exacta dentro del repo
};