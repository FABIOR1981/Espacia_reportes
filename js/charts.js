// js/charts.js - Gestión de gráficos Chart.js y estilos B/N
import { crearTextura, clasificarReserva } from './utils.js';

export let charts = {};
const COLORES = ['#10B981', '#047857', '#F43F5E', '#BE123C'];

export const TAMANOS_IMPRESION = { 
  estado: [345, 260], 
  consultorio: [345, 260],
  evolucion: [725, 280] 
};

export function aplicarEstiloGraficos(bn) {
  const fuente = bn ? [crearTextura("puntos"), crearTextura("rayas"), crearTextura("cuadricula"), crearTextura("diagonal")] : COLORES;
  
  if (charts.estado) {
    const ds = charts.estado.data.datasets[0];
    ds.backgroundColor = fuente;
    ds.borderColor = bn ? '#000000' : '#ffffff';
    ds.borderWidth = bn ? 1.5 : 2;
  }
  if (charts.consultorio) {
    charts.consultorio.data.datasets.forEach((d, i) => {
      d.backgroundColor = fuente[i];
      d.borderColor = bn ? '#000000' : 'transparent';
      d.borderWidth = bn ? 1.2 : 0;
    });
  }
  if (charts.evolucion) {
    charts.evolucion.data.datasets.forEach((d, i) => {
      d.backgroundColor = fuente[i];
      d.borderColor = bn ? '#000000' : 'transparent';
      d.borderWidth = bn ? 1.2 : 0;
    });
  }
  Object.keys(charts).forEach(clave => {
    if (clave.startsWith('profesionales_')) {
      charts[clave].data.datasets.forEach((d, i) => {
        d.backgroundColor = fuente[i];
        d.borderColor = bn ? '#000000' : 'transparent';
        d.borderWidth = bn ? 1.2 : 0;
      });
    }
  });
}

export function generarImagenesBN() {
  aplicarEstiloGraficos(true);
  Object.entries(charts).forEach(([clave, c]) => {
    if (TAMANOS_IMPRESION[clave]) {
      c.resize(...TAMANOS_IMPRESION[clave]);
      c.update('none');
      const imgElem = document.getElementById(`bn-${clave}`);
      if (imgElem) imgElem.src = c.toBase64Image('image/png', 1);
    } else if (clave.startsWith('profesionales_')) {
      c.resize(725, 380);
      c.update('none');
      const imgElem = document.getElementById(`bn-${clave}`);
      if (imgElem) imgElem.src = c.toBase64Image('image/png', 1);
    }
  });
  aplicarEstiloGraficos(false);
  Object.values(charts).forEach(c => { c.resize(); c.update('none'); });
}

export function renderizarGraficos(efecUser, efecAdmin, cancUser, cancAdmin, reservas, backupsArray) {
  if (charts.estado) charts.estado.destroy();
  if (charts.consultorio) charts.consultorio.destroy();
  if (charts.evolucion) charts.evolucion.destroy();

  Object.keys(charts).forEach(k => {
    if (k.startsWith('profesionales_')) {
      charts[k].destroy();
      delete charts[k];
    }
  });

  // 1. Gráfico de Anillo (Estado)
  const ctxEstado = document.getElementById("chartEstado").getContext("2d");
  charts.estado = new Chart(ctxEstado, {
    type: 'doughnut',
    data: {
      labels: ['Efectuadas (Usuario)', 'Efectuadas (Admin)', 'Canceladas por Usuario', 'Canceladas por Admin'],
      datasets: [{
        data: [efecUser, efecAdmin, cancUser, cancAdmin],
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
      consultoriosMap[key] = { efectuada_user: 0, efectuada_admin: 0, cancelada_user: 0, cancelada_admin: 0 };
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
        { label: 'Efectuadas (Usuario)', data: sortedConsKeys.map(k => consultoriosMap[k].efectuada_user), backgroundColor: '#10B981', borderRadius: 4 },
        { label: 'Efectuadas (Admin)', data: sortedConsKeys.map(k => consultoriosMap[k].efectuada_admin), backgroundColor: '#047857', borderRadius: 4 },
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

  // 3. Gráfico de Evolución Temporal (Mes a Mes)
  const evolucionMap = {};
  backupsArray.forEach(fileData => {
    if (!fileData.fechaReservas) return;
    const mesKey = fileData.fechaReservas.substring(0, 7); // YYYY-MM
    if (!evolucionMap[mesKey]) {
      evolucionMap[mesKey] = { efectuada_user: 0, efectuada_admin: 0, cancelada_user: 0, cancelada_admin: 0 };
    }
    if (fileData.reservas && Array.isArray(fileData.reservas)) {
      fileData.reservas.forEach(r => {
        const tipo = clasificarReserva(r);
        if (evolucionMap[mesKey][tipo] !== undefined) {
          evolucionMap[mesKey][tipo]++;
        }
      });
    }
  });

  const sortedMeses = Object.keys(evolucionMap).sort();
  const mesesLabels = sortedMeses.map(m => {
    const [anio, mes] = m.split('-');
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombresMeses[parseInt(mes, 10) - 1]} ${anio}`;
  });

  const ctxEvolucion = document.getElementById("chartEvolucion").getContext("2d");
  charts.evolucion = new Chart(ctxEvolucion, {
    type: 'bar',
    data: {
      labels: mesesLabels.length > 0 ? mesesLabels : ['Sin datos'],
      datasets: [
        { label: 'Efectuadas (Usuario)', data: sortedMeses.map(m => evolucionMap[m].efectuada_user), backgroundColor: '#10B981', borderRadius: 4 },
        { label: 'Efectuadas (Admin)', data: sortedMeses.map(m => evolucionMap[m].efectuada_admin), backgroundColor: '#047857', borderRadius: 4 },
        { label: 'Canceladas por Usuario', data: sortedMeses.map(m => evolucionMap[m].cancelada_user), backgroundColor: '#F43F5E', borderRadius: 4 },
        { label: 'Canceladas por Admin', data: sortedMeses.map(m => evolucionMap[m].cancelada_admin), backgroundColor: '#BE123C', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // 4. Gráficos de Profesionales divididos en bloques de 10
  const profMap = {};
  reservas.forEach(r => {
    const prof = r._profesional;
    if (!profMap[prof]) {
      profMap[prof] = { efectuada_user: 0, efectuada_admin: 0, cancelada_user: 0, cancelada_admin: 0 };
    }
    profMap[prof][r._tipoClasificado]++;
  });

  const sortedProfs = Object.keys(profMap).sort((a, b) => {
    const totalA = profMap[a].efectuada_user + profMap[a].efectuada_admin + profMap[a].cancelada_user + profMap[a].cancelada_admin;
    const totalB = profMap[b].efectuada_user + profMap[b].efectuada_admin + profMap[b].cancelada_user + profMap[b].cancelada_admin;
    return totalB - totalA;
  });

  const containerProfs = document.getElementById("profesionales-container");
  containerProfs.innerHTML = "";

  if (sortedProfs.length === 0) return;

  const tamBloque = 10;
  const totalBloques = Math.ceil(sortedProfs.length / tamBloque);

  for (let i = 0; i < totalBloques; i++) {
    const inicio = i * tamBloque;
    const fin = Math.min(inicio + tamBloque, sortedProfs.length);
    const bloqueProfs = sortedProfs.slice(inicio, fin);
    const chartKey = `profesionales_${i}`;

    const cardDiv = document.createElement("div");
    cardDiv.className = "prof-card bg-white p-6 rounded-xl shadow";
    cardDiv.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-700 mb-1">Actividad por Profesional (Ranking ${inicio + 1} al ${fin})</h3>
      <p class="text-xs text-gray-500 mb-4">Bloque ${i + 1} de ${totalBloques} — Efectuadas (Usuario/Admin) y Cancelaciones</p>
      <div class="relative h-96">
        <canvas id="chart-${chartKey}"></canvas>
        <img id="bn-${chartKey}" class="img-bn" alt="Actividad por Profesional Bloque ${i + 1}">
      </div>
    `;
    containerProfs.appendChild(cardDiv);

    const ctxProf = document.getElementById(`chart-${chartKey}`).getContext("2d");
    charts[chartKey] = new Chart(ctxProf, {
      type: 'bar',
      data: {
        labels: bloqueProfs,
        datasets: [
          { label: 'Efectuadas (Usuario)', data: bloqueProfs.map(p => profMap[p].efectuada_user), backgroundColor: '#10B981', borderRadius: 4 },
          { label: 'Efectuadas (Admin)', data: bloqueProfs.map(p => profMap[p].efectuada_admin), backgroundColor: '#047857', borderRadius: 4 },
          { label: 'Canceladas por Usuario', data: bloqueProfs.map(p => profMap[p].cancelada_user), backgroundColor: '#F43F5E', borderRadius: 4 },
          { label: 'Canceladas por Admin', data: bloqueProfs.map(p => profMap[p].cancelada_admin), backgroundColor: '#BE123C', borderRadius: 4 }
        ]
      },
      options: { 
        indexAxis: 'y',
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
}