// netlify/functions/get-backups.js
exports.handler = async function(event, context) {
  const owner = event.queryStringParameters.owner;
  const repo = event.queryStringParameters.repo;
  const branch = event.queryStringParameters.branch || 'main';
  const folder = event.queryStringParameters.folder;

  if (!owner || !repo || !folder) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Faltan parámetros obligatorios" })
    };
  }

  const token = process.env.GITHUB_TOKEN_ESPACIA_REPORTES_BD;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}?ref=${branch}`;
  
  const headers = {
    "User-Agent": "Netlify-Serverless-App",
    "Accept": "application/vnd.github.v3+json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // 1. Obtener la lista de archivos de la carpeta en GitHub
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorData = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
    }

    const files = await response.json();
    const jsonFiles = files.filter(file => file.type === "file" && file.name.endsWith(".json"));

    // 2. Descargar el contenido de cada archivo JSON de forma interna en Netlify
    const allBackupsData = [];
    for (const file of jsonFiles) {
      const fileRes = await fetch(file.download_url, { headers });
      if (fileRes.ok) {
        const jsonData = await fileRes.json();
        allBackupsData.push(jsonData);
      }
    }

    // 3. Retornar todos los JSON ya procesados al frontend
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allBackupsData)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};