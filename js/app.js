// js/app.js - Lógica principal y flujo de la aplicación
import { ApiService } from './apiService.js';
import { extraerProfesional, clasificarReserva } from './utils.js';
import { charts, TAMANOS_IMPRESION, renderizarGraficos, generarImagenesBN } from './charts.js';

let cacheBackups = [];
let paginaActualArchivos = 1;
const elementosPorPagina = 10;
let backupsFiltradosActuales = [];

window.imprimirReporte = function(bn) {
  if (!bn) {
    document.body.classList.remove('print-bn');
    window.print();
    return;
  }
  if (!charts.estado || !charts.consultorio) return;
  generarImagenesBN();
  const imgs = [...document.querySelectorAll('.img-bn')];
  Promise.all(imgs.map(img => img.decode())).then(() => {
    document.body.classList.add('print-bn');
    window.print();
  });
};

window.addEventListener("beforeprint", () => {
  Object.entries(charts).forEach(([clave, c]) => {
    if (TAMANOS_IMPRESION[clave]) c.resize(...TAMANOS_IMPRESION[clave]);
  });
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

window.aplicarFiltroFechas = function() {
  inicializarDatos();
};

async function inicializarDatos() {
  const statusBadge = document.getElementById("status-badge");
  const fechaInicio = document.getElementById("filtroFechaInicio").value;
  const fechaFin = document.getElementById("filtroFechaFin").value;
  cacheBackups = [];

  const fmt = (iso) => iso ? iso.split('-').reverse().join('/') : '—';
  document.getElementById("print-periodo").textContent =
    `Período: ${fmt(fechaInicio)} al ${fmt(fechaFin)}`;

  statusBadge.textContent = "Sincronizando con base de datos...";
  statusBadge.className = "px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full";

  try {
    cacheBackups = await ApiService.obtenerResguardos(fechaInicio, fechaFin);
    
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
    statusBadge.textContent = "Error de conexión con la fuente de datos";
    statusBadge.className = "px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-full";
  }
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
  const efecUser = todasLasReservas.filter(r => r._tipoClasificado === "efectuada_user").length;
  const efecAdmin = todasLasReservas.filter(r => r._tipoClasificado === "efectuada_admin").length;
  const cancUser = todasLasReservas.filter(r => r._tipoClasificado === "cancelada_user").length;
  const cancAdmin = todasLasReservas.filter(r => r._tipoClasificado === "cancelada_admin").length;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-efec-user").textContent = efecUser;
  document.getElementById("kpi-efec-admin").textContent = efecAdmin;
  document.getElementById("kpi-canc-user").textContent = cancUser;
  document.getElementById("kpi-canc-admin").textContent = cancAdmin;

  renderizarGraficos(efecUser, efecAdmin, cancUser, cancAdmin, todasLasReservas, backupsArray);

  backupsFiltradosActuales = [...backupsArray].sort((a, b) => b.fechaReservas.localeCompare(a.fechaReservas));
  paginaActualArchivos = 1;
  renderArchivosTablePaginated();

  const searchInput = document.getElementById("searchInput");
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);

  newSearchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    backupsFiltradosActuales = backupsArray.filter(b => 
      b.fechaReservas.toLowerCase().includes(term) ||
      b.fechaDelBackup.toLowerCase().includes(term)
    ).sort((a, b) => b.fechaReservas.localeCompare(a.fechaReservas));
    
    paginaActualArchivos = 1;
    renderArchivosTablePaginated();
  });
}

function renderArchivosTablePaginated() {
  const tbody = document.getElementById("tabla-archivos");
  tbody.innerHTML = "";

  const totalRegistros = backupsFiltradosActuales.length;
  if (totalRegistros === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400">No se encontraron archivos de respaldo</td></tr>`;
    document.getElementById("paginacion-info").textContent = "Mostrando 0 de 0 registros";
    document.getElementById("paginacion-actual").textContent = "Página 1 de 1";
    document.getElementById("btn-pagina-anterior").disabled = true;
    document.getElementById("btn-pagina-siguiente").disabled = true;
    return;
  }

  const totalPaginas = Math.ceil(totalRegistros / elementosPorPagina);
  if (paginaActualArchivos > totalPaginas) paginaActualArchivos = totalPaginas;
  if (paginaActualArchivos < 1) paginaActualArchivos = 1;

  const inicio = (paginaActualArchivos - 1) * elementosPorPagina;
  const fin = Math.min(inicio + elementosPorPagina, totalRegistros);
  const paginaItems = backupsFiltradosActuales.slice(inicio, fin);

  paginaItems.forEach((fileData) => {
    const reservas = fileData.reservas || [];
    const efecU = reservas.filter(r => clasificarReserva(r) === "efectuada_user").length;
    const efecA = reservas.filter(r => clasificarReserva(r) === "efectuada_admin").length;
    const cUser = reservas.filter(r => clasificarReserva(r) === "cancelada_user").length;
    const cAdmin = reservas.filter(r => clasificarReserva(r) === "cancelada_admin").length;
    const totalReservas = reservas.length;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="p-4 font-semibold text-indigo-900">${fileData.fechaReservas}</td>
      <td class="p-4 text-gray-500 text-xs">${new Date(fileData.fechaDelBackup).toLocaleString()}</td>
      <td class="p-4 text-center font-bold text-gray-700">${totalReservas}</td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">${efecU}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-900 text-white">${efecA}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">${cUser}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-900">${cAdmin}</span></td>
      <td class="p-4 text-center">
        <button onclick="verDetalleArchivo('${fileData.fechaReservas}')" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors">
          🔍 Ver Detalle
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("paginacion-info").textContent = `Mostrando registros ${inicio + 1} al ${fin} de ${totalRegistros}`;
  document.getElementById("paginacion-actual").textContent = `Página ${paginaActualArchivos} de ${totalPaginas}`;
  document.getElementById("btn-pagina-anterior").disabled = paginaActualArchivos === 1;
  document.getElementById("btn-pagina-siguiente").disabled = paginaActualArchivos === totalPaginas;
}

window.cambiarPaginaArchivos = function(direccion) {
  paginaActualArchivos += direccion;
  renderArchivosTablePaginated();
};

window.verDetalleArchivo = function(fechaReservas) {
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
      let badgeText = "EFECTUADA (USUARIO)";
      if (tipo === "efectuada_admin") {
        badgeClass = "bg-emerald-900 text-white";
        badgeText = "EFECTUADA (ADMIN)";
      } else if (tipo === "cancelada_user") {
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
};

window.cerrarModal = function() {
  document.getElementById("modalDetalle").classList.remove("flex");
  document.getElementById("modalDetalle").classList.add("hidden");
};