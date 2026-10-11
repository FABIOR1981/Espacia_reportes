// netlify/functions/get-backups.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const owner = event.queryStringParameters.owner;
  const repo = event.queryStringParameters.repo;
  const branch = event.queryStringParameters.branch || 'main';
  const folder = event.queryStringParameters.folder;

  if (!owner || !repo || !folder) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Faltan parámetros obligatorios (owner, repo, folder)" })
    };
  }

  // Token seguro almacenado en las variables de entorno de Netlify
  const token = process.env.GITHUB_TOKEN_ESPACIA_REPORTES_BD;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}?ref=${branch}`;
  
  const headers = {
    "User-Agent": "Netlify-Serverless-App"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorData = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Error desde GitHub: ${response.statusText}`, details: errorData })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en la función", details: error.message })
    };
  }
};