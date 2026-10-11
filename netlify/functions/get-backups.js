// netlify/functions/get-backups.js
exports.handler = async function(event, context) {
  const owner = event.queryStringParameters.owner;
  const repo = event.queryStringParameters.repo;
  const branch = event.queryStringParameters.branch || 'main';
  const folder = event.queryStringParameters.folder;
  const fechaInicio = event.queryStringParameters.fechaInicio;
  const fechaFin = event.queryStringParameters.fechaFin;

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
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorData = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
    }

    const files = await response.json();
    let jsonFiles = files.filter(file => file.type === "file" && file.name.endsWith(".json"));

    // Filtrar archivos según el rango de fechas en su nombre (ej: reservas-YYYY-MM-DD.json)
    if (fechaInicio || fechaFin) {
      jsonFiles = jsonFiles.filter(file => {
        const match = file.name.match(/\d{4}-\d{2}-\d{2}/);
        if (!match) return true; 
        const fileDate = match[0];
        
        if (fechaInicio && fileDate < fechaInicio) return false;
        if (fechaFin && fileDate > fechaFin) return false;
        return true;
      });
    }

    const allBackupsData = [];
    for (const file of jsonFiles) {
      const fileRes = await fetch(file.download_url, { headers });
      if (fileRes.ok) {
        const jsonData = await fileRes.json();
        
        if (fechaInicio || fechaFin) {
          const fReserva = jsonData.fechaReservas;
          if (fReserva) {
            if (fechaInicio && fReserva < fechaInicio) continue;
            if (fechaFin && fReserva > fechaFin) continue;
          }
        }

        allBackupsData.push(jsonData);
      }
    }

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