// js/apiService.js - Interfaz de Datos (Preparada para futura Base de Datos)
import { CONFIG } from './config.js';

export const ApiService = {
  async obtenerResguardos(fechaInicio, fechaFin) {
    try {
      let functionUrl = `/.netlify/functions/get-backups?owner=${CONFIG.githubOwner}&repo=${CONFIG.githubRepo}&branch=${CONFIG.githubBranch}&folder=${CONFIG.githubFolder}`;
      
      if (fechaInicio) functionUrl += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) functionUrl += `&fechaFin=${fechaFin}`;

      const response = await fetch(functionUrl);
      if (!response.ok) throw new Error(`Error en Netlify Function: ${response.statusText}`);

      // Retorna los resguardos normalizados
      return await response.json();
    } catch (error) {
      console.error("Error en ApiService:", error);
      throw error;
    }
  }
};