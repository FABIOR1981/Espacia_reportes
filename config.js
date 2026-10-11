// config.js
const CONFIG = {
  // Cambia a true para usar los datos del repositorio de GitHub configurado abajo
  // Cambia a false para usar el modo demo precargado con el JSON de ejemplo
  usarGitHubReal: false, 

  githubOwner: "tu-usuario-o-organizacion",     // Ej: "tu-cuenta-github"
  githubRepo: "nombre-del-repositorio",         // Ej: "espacia-backups"
  githubBranch: "main",                         // Rama del repositorio (ej: main o master)
  githubFolder: "backups/reservas",             // Subcarpeta donde están los archivos .json
  githubToken: ""                               // Token opcional si el repo es privado
};