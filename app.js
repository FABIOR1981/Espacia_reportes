// app.js
let cacheBackups = []; // Almacena todos los objetos JSON descargados
let charts = {};

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

function processAndRenderData(backupsArray) {
  let todasLasReservas = [];

  backupsArray.forEach(fileData => {
    if (fileData.reservas && Array.isArray(fileData.reservas)) {
      todasLasReservas.push(...fileData.reservas);
    }
  });

  const total = todasLasReservas.length;
  const efectuadas = todasLasReservas.filter(r => r.estado === "efectuada").length;
  const canceladas = todasLasReservas.filter(r => r.estado === "cancelada").length;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-efectuadas").textContent = efectuadas;
  document.getElementById("kpi-canceladas").textContent = canceladas;

  renderCharts(efectuadas, canceladas, todasLasReservas);
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

function renderCharts(efectuadas, canceladas, reservas) {
  if (charts.estado) charts.estado.destroy();
  if (charts.consultorio) charts.consultorio.destroy();

  const ctxEstado = document.getElementById("chartEstado").getContext("2d");
  charts.estado = new Chart(ctxEstado, {
    type: 'doughnut',
    data: {
      labels: ['Efectuadas', 'Canceladas'],
      datasets: [{
        data: [efectuadas, canceladas],
        backgroundColor: ['#10B981', '#F43F5E'],
        borderWidth: 2
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const consultorioCounts = {};
  reservas.forEach(r => {
    const descConsultorio = r.description.find(line => line.includes("Consultorio:"));
    const cons = descConsultorio ? descConsultorio.split(":")[1].trim() : "Desconocido";
    const key = `Consultorio ${cons}`;
    consultorioCounts[key] = (consultorioCounts[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(consultorioCounts).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
  const sortedValues = sortedKeys.map(key => consultorioCounts[key]);

  const ctxConsultorio = document.getElementById("chartConsultorio").getContext("2d");
  charts.consultorio = new Chart(ctxConsultorio, {
    type: 'bar',
    data: {
      labels: sortedKeys,
      datasets: [{
        label: 'Cantidad de Reservas',
        data: sortedValues,
        backgroundColor: '#6366F1',
        borderRadius: 6
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderArchivosTable(backupsArray) {
  const tbody = document.getElementById("tabla-archivos");
  tbody.innerHTML = "";

  if (backupsArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No se encontraron archivos de respaldo</td></tr>`;
    return;
  }

  // Ordenar archivos por fecha de reserva descendente
  const sortedBackups = [...backupsArray].sort((a, b) => b.fechaReservas.localeCompare(a.fechaReservas));

  sortedBackups.forEach((fileData, index) => {
    const reservas = fileData.reservas || [];
    const efec = reservas.filter(r => r.estado === "efectuada").length;
    const canc = reservas.filter(r => r.estado === "cancelada").length;
    const totalReservas = reservas.length;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="p-4 font-semibold text-indigo-900">${fileData.fechaReservas}</td>
      <td class="p-4 text-gray-500 text-xs">${new Date(fileData.fechaDelBackup).toLocaleString()}</td>
      <td class="p-4 text-center font-bold text-gray-700">${totalReservas}</td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">${efec}</span></td>
      <td class="p-4 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">${canc}</span></td>
      <td class="p-4 text-center">
        <button onclick="verDetalleArchivo(${index})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors">
          🔍 Ver Detalle
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function verDetalleArchivo(index) {
  const fileData = cacheBackups[index];
  if (!fileData) return;

  document.getElementById("modalTitulo").textContent = `Resguardo del día: ${fileData.fechaReservas}`;
  document.getElementById("modalSubtitulo").textContent = `Backup generado el: ${new Date(fileData.fechaDelBackup).toLocaleString()} — Total registros: ${fileData.total}`;

  const contenedor = document.getElementById("modalContenido");
  contenedor.innerHTML = "";

  if (!fileData.reservas || fileData.reservas.length === 0) {
    contenedor.innerHTML = `<p class="text-center text-gray-400 py-6">No hay reservas registradas en este archivo.</p>`;
  } else {
    fileData.reservas.forEach(r => {
      const emailLine = r.description.find(l => l.toLowerCase().includes("email:")) || "";
      const email = emailLine.split(":")[1] ? emailLine.split(":")[1].trim() : "No especificado";
      const consultorioLine = r.description.find(l => l.toLowerCase().includes("consultorio:")) || "";
      const consultorio = consultorioLine ? consultorioLine.split(":")[1].trim() : "-";

      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded-xl border shadow-sm space-y-2";
      card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
          <div>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Consultorio ${consultorio}</span>
            <span class="font-bold text-gray-800 ml-2">${r.summary}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            r.estado === 'efectuada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }">
            ${r.estado.toUpperCase()}
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
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