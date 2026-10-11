// app.js
let allReservas = [];
let charts = {};

document.addEventListener("DOMContentLoaded", () => {
  // Establecer por defecto los últimos 7 días
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
  allReservas = [];

  statusBadge.textContent = "Sincronizando con GitHub...";
  statusBadge.className = "px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full";

  try {
    let functionUrl = `/.netlify/functions/get-backups?owner=${CONFIG.githubOwner}&repo=${CONFIG.githubRepo}&branch=${CONFIG.githubBranch}&folder=${CONFIG.githubFolder}`;
    
    if (fechaInicio) functionUrl += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) functionUrl += `&fechaFin=${fechaFin}`;

    const response = await fetch(functionUrl);
    if (!response.ok) throw new Error(`Error en Netlify Function: ${response.statusText}`);

    const backupsArray = await response.json();
    
    document.getElementById("kpi-files").textContent = backupsArray.length;

    if (backupsArray.length === 0) {
      statusBadge.textContent = "No hay archivos en el período seleccionado.";
      statusBadge.className = "px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-full";
      processAndRenderData([]);
      return;
    }

    backupsArray.forEach(data => {
      if (data.reservas && Array.isArray(data.reservas)) {
        allReservas.push(...data.reservas);
      }
    });

    statusBadge.textContent = `Sincronizado (${backupsArray.length} archivos)`;
    statusBadge.className = "px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full";
    processAndRenderData(allReservas);

  } catch (error) {
    console.error(error);
    statusBadge.textContent = "Error de conexión con la función";
    statusBadge.className = "px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-full";
  }
}

function aplicarFiltroFechas() {
  inicializarDatos();
}

function processAndRenderData(reservas) {
  const total = reservas.length;
  const efectuadas = reservas.filter(r => r.estado === "efectuada").length;
  const canceladas = reservas.filter(r => r.estado === "cancelada").length;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-efectuadas").textContent = efectuadas;
  document.getElementById("kpi-canceladas").textContent = canceladas;

  renderCharts(efectuadas, canceladas, reservas);
  renderTable(reservas);

  const searchInput = document.getElementById("searchInput");
  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);

  newSearchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = reservas.filter(r => 
      r.summary.toLowerCase().includes(term) ||
      r.estado.toLowerCase().includes(term) ||
      r.description.some(line => line.toLowerCase().includes(term))
    );
    renderTable(filtered);
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

  // 1. Agrupar conteo por consultorio
  const consultorioCounts = {};
  reservas.forEach(r => {
    const descConsultorio = r.description.find(line => line.includes("Consultorio:"));
    const cons = descConsultorio ? descConsultorio.split(":")[1].trim() : "Desconocido";
    const key = `Consultorio ${cons}`;
    consultorioCounts[key] = (consultorioCounts[key] || 0) + 1;
  });

  // 2. Ordenar las claves de los consultorios de forma natural (Consultorio 1, 2, 3...)
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

function renderTable(reservas) {
  const tbody = document.getElementById("tabla-reservas");
  tbody.innerHTML = "";

  if (reservas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No se encontraron registros para este período</td></tr>`;
    return;
  }

  reservas.forEach(r => {
    const emailLine = r.description.find(l => l.toLowerCase().includes("email:")) || "";
    const email = emailLine.split(":")[1] ? emailLine.split(":")[1].trim() : "-";
    const consultorioLine = r.description.find(l => l.toLowerCase().includes("consultorio:")) || "";
    const consultorio = consultorioLine ? consultorioLine.split(":")[1].trim() : "-";

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="p-4 text-gray-600">${r.fechaReservas || r.inicio.split("T")[0]}</td>
      <td class="p-4 font-medium text-gray-800">C${consultorio}</td>
      <td class="p-4 text-gray-800 font-medium">${r.summary}</td>
      <td class="p-4 text-gray-500">${email}</td>
      <td class="p-4 text-gray-600">${r.inicio.split("T")[1].substring(0,5)} - ${r.fin.split("T")[1].substring(0,5)}</td>
      <td class="p-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
          r.estado === 'efectuada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }">
          ${r.estado}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}