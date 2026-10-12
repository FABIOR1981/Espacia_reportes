// js/utils.js - Funciones auxiliares y de clasificación

export function extraerProfesional(r) {
  let summaryClean = r.summary.replace("Cancelada - ", "").trim();
  if (summaryClean.includes(":")) {
    const parts = summaryClean.split(":");
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  const lineaPara = r.description.find(l => l.toLowerCase().includes("reserva para:"));
  if (lineaPara) {
    return lineaPara.split(":")[1].trim();
  }
  return "Desconocido";
}

export function clasificarReserva(r) {
  if (r.estado === "cancelada") {
    const descCancelacion = r.description.find(l => l.toLowerCase().includes("cancelada por:")) || "";
    const textoLower = descCancelacion.toLowerCase();
    if (textoLower.includes("gestor") || textoLower.includes("admin") || textoLower.includes("administracion")) {
      return "cancelada_admin";
    }
    return "cancelada_user";
  }

  // Comparamos "Reserva realizada por" / "Creada por" con "Reserva para:"
  const lineaPara = r.description.find(l => l.toLowerCase().includes("reserva para:")) || "";
  const lineaRealizada = r.description.find(l => 
    l.toLowerCase().includes("reserva realizada por:") || 
    l.toLowerCase().includes("creada por:") || 
    l.toLowerCase().includes("reservado por:")
  ) || "";

  const nombrePara = lineaPara.includes(":") ? lineaPara.split(":")[1].trim().toLowerCase() : "";
  const nombreRealizada = lineaRealizada.includes(":") ? lineaRealizada.split(":")[1].trim().toLowerCase() : "";

  // Si ambos campos existen y los nombres son distintos, la realizó la administración
  if (nombreRealizada && nombrePara && nombreRealizada !== nombrePara) {
    return "efectuada_admin";
  }

  // Validación de respaldo por palabras clave
  const textoCreacionLower = lineaRealizada.toLowerCase();
  if (textoCreacionLower.includes("gestor") || textoCreacionLower.includes("admin") || textoCreacionLower.includes("administracion")) {
    return "efectuada_admin";
  }

  return "efectuada_user";
}

export function crearTextura(tipo) {
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
  } else if (tipo === "diagonal") {
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, 5); g.lineTo(5, 10); g.moveTo(5, 0); g.lineTo(10, 5); g.stroke();
  }
  return document.createElement("canvas").getContext("2d").createPattern(t, "repeat");
}