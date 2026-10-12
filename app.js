// app.js
let cacheBackups = [];
let charts = {};
let texturas = [];
const COLORES = ['#10B981', '#F43F5E', '#BE123C'];
// Tamaño en px de cada gráfico en la hoja A4 (debe coincidir con el CSS de impresión)
const TAMANOS_IMPRESION = { estado: [345, 260], consultorio: [345, 260], profesionales: [720, 420] };

function crearTextura(tipo) {
  const t = document.createElement("canvas");
  t.width = t.height = 10;
  const g = t.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 10, 10);
  g.strokeStyle = g.fillStyle = "#000000";
  g.lineWidth = 1.2;
  if (tipo === "puntos") {
    g.beginPath(); g.arc(5, 5, 1.2, 0, Math.PI * 2); g.fill();
  } else if (tipo === "rayas") {
    g.beginPath(); g.moveTo(-1, 11); g.lineTo(11, -1); g.stroke();
  } else if (tipo === "cuadricula") {
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-1, -1); g.lineTo(11, 11); g.moveTo(11, -1); g.lineTo(-1, 11); g.stroke();
  }
  return document.createElement("canvas").getContext("2d").createPattern(t, "repeat");
}

function aplicarEstiloGraficos(bn) {
  const fuente = bn ? texturas : COLORES;
  const ds = charts.estado.data.datasets[0];
  ds.backgroundColor = fuente;
  ds.borderColor = bn ? '#000000' : '#ffffff';
  ds.borderWidth = bn ? 1.5 : 2;
  [charts.consultorio, charts.profesionales].forEach(c => {
    c.data.datasets.forEach((d, i) => {
      d.backgroundColor = fuente[i];
      d.borderColor = bn ? '#000000' : 'transparent';
      d.borderWidth = bn ? 1.2 : 0;
    });
  });
}

// Se capturan los gráficos con textura como imágenes estáticas para no depender del redibujado durante la impresión
function generarImagenesBN() {
  aplicarEstiloGraficos(true);
  Object.entries(charts).forEach(([clave, c]) => {
    c.resize(...TAMANOS_IMPRESION[clave]);
    c.update('none');
    document.getElementById(`bn-${clave}`).src = c.toBase64Image('image/png', 1);
  });
  aplicarEstiloGraficos(false);
  Object.values(charts).forEach(c => { c.resize(); c.update('none'); });
}

function imprimirReporte(bn) {
  if (bn) {
    if (!charts.estado || !charts.consultorio || !charts.profesionales) return;
    generarImagenesBN();
  }
  document.body.classList.toggle('print-bn', bn);
  window.print();
}

window.addEventListener("beforeprint", () => {
  Object.entries(charts).forEach(([clave, c]) => c.resize(...TAMANOS_IMPRESION[clave]));
  document.getElementById("print-fecha").textContent =
    `Generado: ${new Date().toLocaleString("es-UY")}`;
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove('print-bn');
  Object.values(charts).forEach(c => { c.resize(); c.update('none'); });
});

document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hoy.getDate() - 7);

  const formatDate = (date) => date.toISOString().split('T')[0];

  document.getElementById("filtroFechaInicio").value = formatDate(hace7Dias);
  document.getElementById("filtroFechaFin").value = formatDate(hoy);

  inicializarDatos();
});

async function inicializarDatos() {
  const statusBadge = document.getElementById("status-badge");
  const fechaInicio = document.getElementById("filtroFechaInicio").value;
  const fechaFin = document.getElementById("filtroFechaFin").value;
  cacheBackups = [];

  const fmt = (iso) => iso ? iso.split('-').reverse().join('/') : '—';
  document.getElementById("print-periodo").textContent =
    `Período: ${fmt(fechaInicio)} al ${fmt(fechaFin)}`;

  statusBadge.textContent = "Sincronizando con GitHub...";
  statusBadge.className = "px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full";

  try {
    let functionUrl = `/.netlify/functions/get-backups?owner=${CONFIG.githubOwner}&repo=${CONFIG.githubRepo}&branch=${CONFIG.githubBranch}&folder=${CONFIG.githubFolder}`;
    
    if (fechaInicio) functionUrl += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) functionUrl += `&fechaFin=${fechaFin}`;

    const response = await fetch(functionUrl);
    if (!response.ok) throw new Error(`Error en Netlify Function: ${response.statusText}`);

    cacheBackups = await response.json();
    
    document.getElementById("kpi-files").textContent = cacheBackups.length;

    if (cacheBackups.length === 0) {
      statusBadge.textContent = "No hay archivos en el período seleccionado.";
      statusBadge.className = "px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-full";
      processAndRenderData([]);
      return;
    }

    statusBadge.textContent = `Sincronizado (${cacheBackups.length} archivos)`;
    statusBadge.className = "px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full";
    processAndRenderData(cacheBackups);

  } catch (error) {
    console.error(error);
    statusBadge.textContent = "Error de conexión con la función";
    statusBadge.className = "px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-full";
  }
}

function aplicarFiltroFechas() {
  inicializarDatos();
}

// Extraer el nombre del profesional desde el summary o description
function extraerProfesional(r) {
  // Ejemplo de summary: "C2: Rosa Israel" o "Cancelada - C3: Marcela Acuña"
  let summaryClean = r.summary.replace("Cancelada - ", "").trim();
  if (summaryClean.includes(":")) {
    const parts = summaryClean.split(":");
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  // Si falló, intentar buscar en la línea de descripción "Reserva para:"
  const lineaPara = r.description.find(l => l.toLowerCase().includes("reserva para:"));
  if (lineaPara) {
    return lineaPara.split(":")[1].trim();
  }
  return "Desconocido";
}

function clasificarReserva(r) {
  if (r.estado !== "cancelada") return "efectuada";
  
  const descCancelacion = r.description.find(l => l.toLowerCase().includes("cancelada por:")) || "";
  const textoLower = descCancelacion.toLowerCase();
  
  if (textoLower.includes("gestor") || textoLower.includes("admin") || textoLower.includes("administracion")) {
    return "cancelada_admin";
  }
  return "cancelada_user";
}

function processAndRenderData(backupsArray) {
  let todasLasReservas = [];

  backupsArray.forEach(fileData => {
    if (fileData.reservas && Array.isArray(fileData.reservas)) {
      fileData.reservas.forEach(r => {
        r._tipoClasificado = clasificarReserva(r);
        r._profesional = extraerProfesional(r);
        todasLasReservas.push(r);
      });
    }
  });

  const total = todasLasReservas.length;
  const efectuadas = todasLasReservas.filter(r => r._tipoClasificado === "efectuada").length;
  const cancUser = todasLasReservas.filter(r => r._tipoClasificado === "cancelada_user").length;
  const cancAdmin = todasLasReservas.filter(r => r._tipoClasificado === "cancelada_admin").length;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-efectuadas").textContent = efectuadas;
  document.getElementById("kpi-canc-user").textContent = cancUser;
  document.getElementById("kpi-canc-admin").textContent = cancAdmin;

  renderCharts(efectuadas, cancUser, cancAdmin, todasLasReservas);
  renderArchivosTable(backupsArray);

  const searchInput = document.getElementById("searchInput");
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);

  newSearchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = backupsArray.filter(b => 
      b.fechaReservas.toLowerCase().includes(term) ||
      b.fechaDelBackup.toLowerCase().includes(term)
    );
    renderArchivosTable(filtered);
  });
}

function renderCharts(efectuadas, cancUser, cancAdmin, reservas) {
  if (charts.estado) charts.estado.destroy();
  if (charts.consultorio) charts.consultorio.destroy();
  if (charts.profesionales) charts.profesionales.destroy();

  texturas = [crearTextura("puntos"), crearTextura("rayas"), crearTextura("cuadricula")];

  // 1. Gráfico de Anillo
  const ctxEstado = document.getElementById("chartEstado").getContext("2d");
  charts.estado = new Chart(ctxEstado, {
    type: 'doughnut',
    data: {
      labels: ['Efectuadas', 'Canceladas por Usuario', 'Canceladas por Admin'],
      datasets: [{
        data: [efectuadas, cancUser, cancAdmin],
        backgroundColor: COLORES,
        borderWidth: 2
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: false }
  });

  // 2. Gráfico de Consultorios (Apilado)
  const consultoriosMap = {};
  reservas.forEach(r => {
    const descConsultorio = r.description.find(line => line.includes("Consultorio:"));
    const cons = descConsultorio ? descConsultorio.split(":")[1].trim() : "Desconocido";
    const key = `Consultorio ${cons}`;

    if (!consultoriosMap[key]) {
      consultoriosMap[key] = { efectuada: 0, cancelada_user: 0, cancelada_admin: 0 };
    }
    consultoriosMap[key][r._tipoClasificado]++;
  });

  const sortedConsKeys = Object.keys(consultoriosMap).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const ctxConsultorio = document.getElementById("chartConsultorio").getContext("2d");
  charts.consultorio = new Chart(ctxConsultorio, {
    type: 'bar',
    data: {
      labels: sortedConsKeys,
      datasets: [
        { label: 'Efectuadas', data: sortedConsKeys.map(k => consultoriosMap[k].efectuada), backgroundColor: '#10B981', borderRadius: 4 },
        { label: 'Canceladas por Usuario', data: sortedConsKeys.map(k => consultoriosMap[k].cancelada_user), backgroundColor: '#F43F5E', borderRadius: 4 },
        { label: 'Canceladas por Admin', data: sortedConsKeys.map(k => consultoriosMap[k].cancelada_admin), backgroundColor: '#BE123C', borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      animation: false,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // 3. Nuevo Gráfico por Profesional (Barras Horizontales Apiladas)
  const profMap = {};
  reservas.forEach(r => {
    const prof = r._profesional;
    if (!profMap[prof]) {
      profMap[prof] = { efectuada: 0, cancelada_user: 0, cancelada_admin: 0 };
    }
    profMap[prof][r._tipoClasificado]++;
  });

  // Ordenar profesionales por volumen total de reservas descendente
  const sortedProfs = Object.keys(profMap).sort((a, b) => {
    const totalA = profMap[a].efectuada + profMap[a].cancelada_user + profMap[a].cancelada_admin;
    const totalB = profMap[b].efectuada + profMap[b].cancelada_user + profMap[b].cancelada_admin;
    return totalB - totalA;
  });

  const ctxProf = document.getElementById("chartProfesionales").getContext("2d");
  charts.profesionales = new Chart(ctxProf, {
    type: 'bar',
    data: {
      labels: sortedProfs,
      datasets: [
        { label: 'Efectuadas', data: sortedProfs.map(p => profMap[p].efectuada), backgroundColor: '#10B981', borderRadius: 4 },
        { label: 'Canceladas por Usuario', data: sortedProfs.map(p => profMap[p].cancelada_user), backgroundColor: '#F43F5E', borderRadius: 4 },
        { label: 'Canceladas por Admin', data: sortedProfs.map(p => profMap[p].cancelada_admin), backgroundColor: '#BE123C', borderRadius: 4 }
      ]
    },
    options: { 
      indexAxis: 'y', // Barras horizontales para ver cómodamente los nombres de los profesionales
      responsive: true, 
      maintainAspectRatio: false,
      animation: false,
      scales: { 
        x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }, 
        y: { stacked: true } 
      }
    }
  });
}

function renderArchivosTable(backupsArray) {
  const tbody = document.getElementById("tabla-archivos");
  tbody.innerHTML = "";

  if (backupsArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-400">No se encontraron archivos de respaldo</td></tr>`;
    return;
  }

  const sortedBackups = [...backupsArray].sort((a, b) => b.fechaReservas.localeCompare(a.fechaReservas));

  sortedBackups.forEach((fileData) => {
    const reservas = fileData.reservas || [];
    const efec = reservas.filter(r => r._tipoClasificado === "efectuada").length;
    const cUser = reservas.filter(r => r._tipoClasificado === "cancelada_user").length;
    const cAdmin = reservas.filter(r => r._tipoClasificado === "cancelada_admin").length;
    const totalReservas = reservas.length;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="p-4 font-semibold text-indigo-900">${fileData.fechaReservas}</td>
      <td class="p-4 text-gray-500 text-xs">${new Date(fileData.fechaDelBackup).toLocaleString()}</td>
      <td class="p-4 text-center font-bold text-gray-700">${totalReservas}</td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">${efec}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">${cUser}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">${cAdmin}</span></td>
      <td class="p-4 text-center">
        <button onclick="verDetalleArchivo('${fileData.fechaReservas}')" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors">
          🔍 Ver Detalle
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verDetalleArchivo(fechaReservas) {
  const fileData = cacheBackups.find(b => b.fechaReservas === fechaReservas);
  if (!fileData) return;

  document.getElementById("modalTitulo").textContent = `Resguardo del día: ${fileData.fechaReservas}`;
  document.getElementById("modalSubtitulo").textContent = `Backup generado el: ${new Date(fileData.fechaDelBackup).toLocaleString()} — Total registros: ${fileData.total}`;

  const contenedor = document.getElementById("modalContenido");
  contenedor.innerHTML = "";

  if (!fileData.reservas || fileData.reservas.length === 0) {
    contenedor.innerHTML = `<p class="text-center text-gray-400 py-6">No hay reservas registradas en este archivo.</p>`;
  } else {
    fileData.reservas.forEach(r => {
      const tipo = clasificarReserva(r);
      const prof = extraerProfesional(r);
      const emailLine = r.description.find(l => l.toLowerCase().includes("email:")) || "";
      const email = emailLine.split(":")[1] ? emailLine.split(":")[1].trim() : "No especificado";
      const consultorioLine = r.description.find(l => l.toLowerCase().includes("consultorio:")) || "";
      const consultorio = consultorioLine ? consultorioLine.split(":")[1].trim() : "-";

      let badgeClass = "bg-emerald-100 text-emerald-800";
      let badgeText = "EFECTUADA";
      if (tipo === "cancelada_user") {
        badgeClass = "bg-rose-100 text-rose-800";
        badgeText = "CANC. USUARIO";
      } else if (tipo === "cancelada_admin") {
        badgeClass = "bg-red-100 text-red-900";
        badgeText = "CANC. ADMIN";
      }

      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded-xl border shadow-sm space-y-2";
      card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
          <div>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Consultorio ${consultorio}</span>
            <span class="font-bold text-gray-800 ml-2">${r.summary}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}">
            ${badgeText}
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          <div>👤 <strong>Profesional:</strong> ${prof}</div>
          <div>📧 <strong>Email:</strong> ${email}</div>
          <div>🕒 <strong>Horario:</strong> ${r.inicio.split("T")[1].substring(0,5)} - ${r.fin.split("T")[1].substring(0,5)} hs</div>
        </div>
        <div class="text-[11px] text-gray-400 pt-1 border-t space-y-0.5">
          ${r.description.map(line => `<div>• ${line}</div>`).join('')}
        </div>
      `;
      contenedor.appendChild(card);
    });
  }

  document.getElementById("modalDetalle").classList.remove("hidden");
  document.getElementById("modalDetalle").classList.add("flex");
}

function cerrarModal() {
  document.getElementById("modalDetalle").classList.remove("flex");
  document.getElementById("modalDetalle").classList.add("hidden");
}