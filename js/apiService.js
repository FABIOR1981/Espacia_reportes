// js/apiService.js - Interfaz de Datos (Preparada para futura Base de Datos)

export const ApiService = {
  async obtenerResguardos(fechaInicio, fechaFin) {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set("fechaInicio", fechaInicio);
      if (fechaFin) params.set("fechaFin", fechaFin);

      const consulta = params.toString();
      const url = `/.netlify/functions/get-backups${consulta ? "?" + consulta : ""}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error en Netlify Function: ${response.status} ${response.statusText}`);

      // Retorna los resguardos normalizados.
      // .parcial = true si el servidor cortó por tiempo y faltan resguardos antiguos.
      const datos = await response.json();
      datos.parcial = response.headers.get("X-Resultado-Parcial") === "true";
      return datos;
    } catch (error) {
      console.error("Error en ApiService:", error);
      throw error;
    }
  }
};
