// app.js

// Datos de ejemplo precargados (Modo Demo)
const DEMO_DATA = [
  {
    "fechaDelBackup": "2026-09-23T03:00:19.379Z",
    "fechaReservas": "2026-09-22",
    "total": 15,
    "reservas": [
      {
        "id": "ifbajjh6s6l698lvaluq79qnlg",
        "summary": "C2: Rosa Israel",
        "description": [
          "Reserva para: Rosa Israel",
          "Email: rosai@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 09:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T09:00:00-03:00",
        "fin": "2026-09-22T10:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "enlgvgvkd4e5a1mq6tc1gfig58",
        "summary": "C2: Santiago Perdomo",
        "description": [
          "Reserva para: Santiago Perdomo",
          "Email: santiagop@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 14:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Santiago Perdomo"
        ],
        "inicio": "2026-09-22T14:00:00-03:00",
        "fin": "2026-09-22T15:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "8n1vd6b5bimvgvhvefveo4r1lc",
        "summary": "C3: Marcela Acuña",
        "description": [
          "Reserva para: Marcela Acuña",
          "Email: marcelaa@espacia.com.uy",
          "Consultorio: 3",
          "Fecha: 2026-09-22",
          "Hora: 14:30 hs. Intervalo: 90 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T14:30:00-03:00",
        "fin": "2026-09-22T16:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "r264qpqfs2vu6526kog8kbdc20",
        "summary": "Cancelada - C3: Marcela Acuña",
        "description": [
          "Reserva para: Marcela Acuña",
          "Email: marcelaa@espacia.com.uy",
          "Consultorio: 3",
          "Fecha: 2026-09-22",
          "Hora: 14:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1",
          "Reserva Cancelada por: Gestor1 el 22/9/2026, 11:54:40 a. m."
        ],
        "inicio": "2026-09-22T14:30:00-03:00",
        "fin": "2026-09-22T15:30:00-03:00",
        "estado": "cancelada"
      },
      {
        "id": "sm7q0q29bh17vkual49h36darg",
        "summary": "Cancelada - C2: Daniela Pereyra",
        "description": [
          "Reserva para: Daniela Pereyra",
          "Email: danielap@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 15:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1",
          "Reserva Cancelada por: Gestor1 el 21/9/2026, 8:12:29 p. m."
        ],
        "inicio": "2026-09-22T15:00:00-03:00",
        "fin": "2026-09-22T16:00:00-03:00",
        "estado": "cancelada"
      },
      {
        "id": "5p8khu56s26qd1qfo5u6um6s1c",
        "summary": "C4: Mery Cáceres",
        "description": [
          "Reserva para: Mery Cáceres",
          "Email: meryc@espacia.com.uy",
          "Consultorio: 4",
          "Fecha: 2026-09-22",
          "Hora: 15:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T15:30:00-03:00",
        "fin": "2026-09-22T16:30:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "l42r5bl9er9g6r8cj251lh4mc0",
        "summary": "C2: Daniela Pereyra",
        "description": [
          "Reserva para: Daniela Pereyra",
          "Email: danielap@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 16:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T16:00:00-03:00",
        "fin": "2026-09-22T17:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "84j2grh5h1v2ldhhrs3mvgjku4",
        "summary": "C4: Mery Cáceres",
        "description": [
          "Reserva para: Mery Cáceres",
          "Email: meryc@espacia.com.uy",
          "Consultorio: 4",
          "Fecha: 2026-09-22",
          "Hora: 16:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T16:30:00-03:00",
        "fin": "2026-09-22T17:30:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "pkqoimu1104522b64grcgm4vu4",
        "summary": "C2: Daniela Pereyra",
        "description": [
          "Reserva para: Daniela Pereyra",
          "Email: danielap@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 17:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T17:00:00-03:00",
        "fin": "2026-09-22T18:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "b50hj2r0dtgrbdojs4kkn3ldc4",
        "summary": "C3: Ana Saracho",
        "description": [
          "Reserva para: Ana Saracho",
          "Email: anas@espacia.com.uy",
          "Consultorio: 3",
          "Fecha: 2026-09-22",
          "Hora: 17:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Ana Saracho"
        ],
        "inicio": "2026-09-22T17:30:00-03:00",
        "fin": "2026-09-22T18:30:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "cfkjs7cout5s0lq1isf59dg3jc",
        "summary": "Cancelada - C2: Daniela Pereyra",
        "description": [
          "Reserva para: Daniela Pereyra",
          "Email: danielap@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 18:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1",
          "Reserva Cancelada por: Gestor1 el 21/9/2026, 8:11:52 p. m."
        ],
        "inicio": "2026-09-22T18:00:00-03:00",
        "fin": "2026-09-22T19:00:00-03:00",
        "estado": "cancelada"
      },
      {
        "id": "een3v4ck0pl5fbg3soc1tdo4fo",
        "summary": "C2: Daniela Pereyra",
        "description": [
          "Reserva para: Daniela Pereyra",
          "Email: danielap@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 18:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T18:00:00-03:00",
        "fin": "2026-09-22T19:00:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "jhice6htl4srq570f8fs5qeen8",
        "summary": "Cancelada - C2: Carla Bentancur",
        "description": [
          "Reserva para: Carla Bentancur",
          "Email: carlab@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 18:00 hs. Intervalo: 60 min",
          "Reserva realizada por: Carla Bentancur",
          "Reserva Cancelada por: Carla Bentancur el 19/9/2026, 1:54:47 p. m."
        ],
        "inicio": "2026-09-22T18:00:00-03:00",
        "fin": "2026-09-22T19:00:00-03:00",
        "estado": "cancelada"
      },
      {
        "id": "2fgpmhmccv6d845lc77k0f394c",
        "summary": "C3: Carla Bentancur",
        "description": [
          "Reserva para: Carla Bentancur",
          "Email: carlab@espacia.com.uy",
          "Consultorio: 3",
          "Fecha: 2026-09-22",
          "Hora: 18:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Gestor1"
        ],
        "inicio": "2026-09-22T18:30:00-03:00",
        "fin": "2026-09-22T19:30:00-03:00",
        "estado": "efectuada"
      },
      {
        "id": "jqsn3gsahslbuk31aeo48jriug",
        "summary": "Cancelada - C2: Carla Bentancur",
        "description": [
          "Reserva para: Carla Bentancur",
          "Email: carlab@espacia.com.uy",
          "Consultorio: 2",
          "Fecha: 2026-09-22",
          "Hora: 18:30 hs. Intervalo: 60 min",
          "Reserva realizada por: Carla Bentancur",
          "Reserva Cancelada por: Gestor1 el 21/9/2026, 11:22:07 a. m."
        ],
        "inicio": "2026-09-22T18:30:00-03:00",
        "fin": "2026-09-22T19:30:00-03:00",
        "estado": "cancelada"
      }
    ]
  }
];

let allReservas = [];
let charts = {};

document.addEventListener("DOMContentLoaded", () => {
  inicializarDatos();
});

async function inicializarDatos() {
  const statusBadge = document.getElementById("status-badge");
  allReservas = [];

  if (!CONFIG.usarGitHubReal) {
    // Modo Demo Activo
    statusBadge.textContent = "Modo Demo (Datos Precargados)";
    statusBadge.className = "px-4 py-2 bg-amber-50 text-amber-700 text-sm font-medium rounded-full";
    document.getElementById("toggleModeBtn").textContent = "Cambiar a GitHub Real";

    let archivosProcesados = 0;
    DEMO_DATA.forEach(fileData => {
      if (fileData.reservas && Array.isArray(fileData.reservas)) {
        allReservas.push(...fileData.reservas);
        archivosProcesados++;
      }
    });

    document.getElementById("kpi-files").textContent = archivosProcesados;
    processAndRenderData(allReservas);

  } else {
    // Modo GitHub Real
    statusBadge.textContent = "Conectando con GitHub...";
    statusBadge.className = "px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full";
    document.getElementById("toggleModeBtn").textContent = "Cambiar a Modo Demo";

    try {
      const apiUrl = `https://api.github.com/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/contents/${CONFIG.githubFolder}?ref=${CONFIG.githubBranch}`;
      const headers = {};
      if (CONFIG.githubToken) {
        headers["Authorization"] = `Bearer ${CONFIG.githubToken}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) throw new Error(`Error en API de GitHub: ${response.statusText}`);

      const files = await response.json();
      const jsonFiles = files.filter(file => file.type === "file" && file.name.endsWith(".json"));

      document.getElementById("kpi-files").textContent = jsonFiles.length;

      if (jsonFiles.length === 0) {
        statusBadge.textContent = "No hay archivos JSON en la ruta.";
        statusBadge.className = "px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-full";
        return;
      }

      for (const file of jsonFiles) {
        const res = await fetch(file.download_url);
        if (res.ok) {
          const data = await res.json();
          if (data.reservas && Array.isArray(data.reservas)) {
            allReservas.push(...data.reservas);
          }
        }
      }

      statusBadge.textContent = `GitHub Sincronizado (${jsonFiles.length} archivos)`;
      statusBadge.className = "px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full";
      processAndRenderData(allReservas);

    } catch (error) {
      console.error(error);
      statusBadge.textContent = "Error de conexión (Verifica config.js)";
      statusBadge.className = "px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-full";
    }
  }
}

function cambiarModoDemo() {
  CONFIG.usarGitHubReal = !CONFIG.usarGitHubReal;
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

  // Configurar Buscador
  const searchInput = document.getElementById("searchInput");
  // Clonar para limpiar eventos previos
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
  // Destruir gráficos anteriores si existen para evitar duplicados en memoria
  if (charts.estado) charts.estado.destroy();
  if (charts.consultorio) charts.consultorio.destroy();

  // Gráfico 1: Estado (Doughnut)
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

  // Gráfico 2: Consultorios (Bar)
  const consultorioCounts = {};
  reservas.forEach(r => {
    const descConsultorio = r.description.find(line => line.includes("Consultorio:"));
    const cons = descConsultorio ? descConsultorio.split(":")[1].trim() : "Desconocido";
    consultorioCounts[`Consultorio ${cons}`] = (consultorioCounts[`Consultorio ${cons}`] || 0) + 1;
  });

  const ctxConsultorio = document.getElementById("chartConsultorio").getContext("2d");
  charts.consultorio = new Chart(ctxConsultorio, {
    type: 'bar',
    data: {
      labels: Object.keys(consultorioCounts),
      datasets: [{
        label: 'Cantidad de Reservas',
        data: Object.values(consultorioCounts),
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
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No se encontraron registros</td></tr>`;
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