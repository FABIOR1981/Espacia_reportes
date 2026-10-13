// netlify/functions/get-backups.js
// Lee los resguardos JSON del repo de datos y los devuelve filtrados por fecha.
// El repo/carpeta/rama están fijos acá: el cliente NO puede elegirlos.

const PROPIETARIO = process.env.BACKUPS_OWNER || "fabior1981";
const REPOSITORIO = process.env.BACKUPS_REPO || "bd";
const RAMA = process.env.BACKUPS_BRANCH || "main";
const CARPETA = process.env.BACKUPS_FOLDER || "espacia/backups";

const TAMANO_LOTE = 20;          // descargas simultáneas
const PRESUPUESTO_MS = 8000;     // Netlify corta a los 10 s: cortamos antes y devolvemos lo que haya
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const responder = (statusCode, datos, extra = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...extra },
  body: JSON.stringify(datos)
});

const fechaDeNombre = (nombre) => {
  const m = nombre.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
};

// Lista los .json de la carpeta. Usa Git Trees (hasta 100.000 entradas);
// si falla, cae a la API de contents (tope de 1000 archivos).
async function listarArchivos(headers) {
  const urlTree =
    `https://api.github.com/repos/${PROPIETARIO}/${REPOSITORIO}/git/trees/${RAMA}:${CARPETA}`;
  const resTree = await fetch(urlTree, { headers });

  if (resTree.ok) {
    const tree = await resTree.json();
    if (tree.truncated) console.error("Git Trees devolvió una lista truncada");
    return (tree.tree || [])
      .filter(e => e.type === "blob" && e.path.endsWith(".json"))
      .map(e => ({
        name: e.path,
        url: `https://raw.githubusercontent.com/${PROPIETARIO}/${REPOSITORIO}/${RAMA}/${CARPETA}/${encodeURIComponent(e.path)}`
      }));
  }

  console.error("Git Trees falló (", resTree.status, "), uso contents como respaldo");
  const urlContents =
    `https://api.github.com/repos/${PROPIETARIO}/${REPOSITORIO}/contents/${CARPETA}?ref=${RAMA}`;
  const resContents = await fetch(urlContents, { headers });
  if (!resContents.ok) {
    console.error("GitHub respondió", resContents.status, await resContents.text());
    throw new Error("No se pudo leer el repositorio de datos");
  }
  const archivos = await resContents.json();
  return archivos
    .filter(a => a.type === "file" && a.name.endsWith(".json"))
    .map(a => ({ name: a.name, url: a.download_url }));
}

exports.handler = async function (event) {
  const inicio = Date.now();

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

  try {
    let archivos = await listarArchivos(headers);

    // 1) Filtrar por la fecha del nombre ANTES de descargar
    if (fechaInicio || fechaFin) {
      archivos = archivos.filter(a => {
        const f = fechaDeNombre(a.name);
        if (!f) return true;
        if (fechaInicio && f < fechaInicio) return false;
        if (fechaFin && f > fechaFin) return false;
        return true;
      });
    }

    // 2) Más recientes primero: si hay que cortar por tiempo, se pierden los más viejos
    archivos.sort((a, b) => (fechaDeNombre(b.name) || "").localeCompare(fechaDeNombre(a.name) || ""));

    const descargar = async (archivo) => {
      try {
        const res = await fetch(archivo.url, { headers });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        console.error("Error descargando", archivo.name, e.message);
        return null;
      }
    };

    // 3) Descargar en paralelo, por lotes, respetando el presupuesto de tiempo
    const resultados = [];
    let parcial = false;
    for (let i = 0; i < archivos.length; i += TAMANO_LOTE) {
      if (Date.now() - inicio > PRESUPUESTO_MS) {
        parcial = true;
        break;
      }
      const lote = archivos.slice(i, i + TAMANO_LOTE);
      resultados.push(...await Promise.all(lote.map(descargar)));
    }

    // 4) Filtro final por fechaReservas y descarte de resguardos vacíos
    const datos = resultados.filter(d => {
      if (!d || !Array.isArray(d.reservas) || d.reservas.length === 0) return false;
      const f = d.fechaReservas;
      if (f) {
        if (fechaInicio && f < fechaInicio) return false;
        if (fechaFin && f > fechaFin) return false;
      }
      return true;
    });

    return responder(200, datos, {
      "Cache-Control": "private, max-age=60",
      "X-Resultado-Parcial": parcial ? "true" : "false"
    });

  } catch (error) {
    console.error("Error en get-backups:", error);
    return responder(502, { error: "No se pudo leer el repositorio de datos" });
  }
};
