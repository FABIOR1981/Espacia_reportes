// netlify/functions/get-backups.js
// Lee los resguardos JSON del repo de datos y los devuelve filtrados por fecha.
// El repo/carpeta/rama están fijos acá: el cliente NO puede elegirlos.

const PROPIETARIO = process.env.BACKUPS_OWNER || "fabior1981";
const REPOSITORIO = process.env.BACKUPS_REPO || "bd";
const RAMA = process.env.BACKUPS_BRANCH || "main";
const CARPETA = process.env.BACKUPS_FOLDER || "espacia/backups";

const TAMANO_LOTE = 10; // descargas simultáneas
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const responder = (statusCode, datos, extra = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...extra },
  body: JSON.stringify(datos)
});

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return responder(405, { error: "Método no permitido" });
  }

  const { fechaInicio, fechaFin } = event.queryStringParameters || {};

  if ((fechaInicio && !REGEX_FECHA.test(fechaInicio)) ||
      (fechaFin && !REGEX_FECHA.test(fechaFin))) {
    return responder(400, { error: "Formato de fecha inválido (use AAAA-MM-DD)" });
  }

  const token = process.env.GITHUB_TOKEN_ESPACIA_REPORTES_BD;
  const headers = {
    "User-Agent": "Netlify-Serverless-App",
    "Accept": "application/vnd.github.v3+json"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const apiUrl =
    `https://api.github.com/repos/${PROPIETARIO}/${REPOSITORIO}/contents/${CARPETA}?ref=${RAMA}`;

  try {
    const respuesta = await fetch(apiUrl, { headers });
    if (!respuesta.ok) {
      console.error("GitHub respondió", respuesta.status, await respuesta.text());
      return responder(502, { error: "No se pudo leer el repositorio de datos" });
    }

    const archivos = await respuesta.json();

    // 1) Filtrar por nombre de archivo ANTES de descargar (ahorra llamadas)
    let jsonFiles = archivos.filter(a => a.type === "file" && a.name.endsWith(".json"));

    if (fechaInicio || fechaFin) {
      jsonFiles = jsonFiles.filter(a => {
        const m = a.name.match(/\d{4}-\d{2}-\d{2}/);
        if (!m) return true;
        const f = m[0];
        if (fechaInicio && f < fechaInicio) return false;
        if (fechaFin && f > fechaFin) return false;
        return true;
      });
    }

    // 2) Descargar en paralelo, por lotes
    const descargar = async (archivo) => {
      try {
        const res = await fetch(archivo.download_url, { headers });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        console.error("Error descargando", archivo.name, e.message);
        return null;
      }
    };

    const resultados = [];
    for (let i = 0; i < jsonFiles.length; i += TAMANO_LOTE) {
      const lote = jsonFiles.slice(i, i + TAMANO_LOTE);
      resultados.push(...await Promise.all(lote.map(descargar)));
    }

    // 3) Filtro final por fechaReservas y descarte de resguardos vacíos
    const datos = resultados.filter(d => {
      if (!d || !Array.isArray(d.reservas) || d.reservas.length === 0) return false;
      const f = d.fechaReservas;
      if (f) {
        if (fechaInicio && f < fechaInicio) return false;
        if (fechaFin && f > fechaFin) return false;
      }
      return true;
    });

    return responder(200, datos, { "Cache-Control": "private, max-age=60" });

  } catch (error) {
    console.error("Error en get-backups:", error);
    return responder(500, { error: "Error interno" });
  }
};
