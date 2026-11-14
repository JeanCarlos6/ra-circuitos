/*
 * circuito.js — Modelo didáctico de los tres escenarios.
 * No depende del navegador: se puede probar con Node (node prueba_circuito.js).
 *
 * Supuestos del modelo (simplificaciones didácticas):
 *  - Fuente de 5 V y LED rojo con caída aproximada de 2 V.
 *  - I = (V - V_LED) / R  (modelo lineal; el LED real no es exactamente lineal).
 *  - Corriente nominal de referencia del LED: 20 mA.
 *  - Fotorresistencia (LDR) ilustrativa: 1 kΩ con luz plena y 100 kΩ en oscuridad,
 *    con variación logarítmica entre ambos extremos.
 *  - Umbral del comparador: el LED se enciende cuando R_LDR > 10 kΩ.
 */
(function (raiz) {
  'use strict';

  var V_FUENTE = 5;          // V
  var V_LED = 2;             // V
  var I_NOMINAL = 0.020;     // A (20 mA)
  var R_MIN = 10;            // Ω  (límite inferior aceptado en la entrada libre)
  var R_MAX = 100000;        // Ω  (límite superior aceptado en la entrada libre)
  var R_SENSOR_SERIE = 220;  // Ω  resistencia del LED en el escenario 3
  var LDR_LUZ = 1000;        // Ω con luz plena (100 %)
  var LDR_OSCURO = 100000;   // Ω en oscuridad (0 %)
  var UMBRAL_LDR = 10000;    // Ω

  /** Corriente del circuito serie batería-resistencia-LED. */
  function corrienteLED(R, cerrado) {
    if (cerrado === false) {
      return { estado: 'abierto', I: 0, brillo: 0, mensaje: 'Circuito abierto: no circula corriente.' };
    }
    if (R === 0) {
      return {
        estado: 'sin_resistencia', I: Infinity, brillo: 0,
        mensaje: 'Sin resistencia la corriente no está limitada. En un circuito real el LED se dañaría.'
      };
    }
    var I = (V_FUENTE - V_LED) / R;
    var brillo = Math.min(1, I / I_NOMINAL);
    if (I > I_NOMINAL) {
      return {
        estado: 'sobrecorriente', I: I, brillo: 1,
        mensaje: 'La corriente supera los 20 mA de referencia: el LED podría dañarse.'
      };
    }
    return { estado: 'normal', I: I, brillo: brillo, mensaje: 'El LED funciona dentro de lo normal.' };
  }

  /** Valida un valor de resistencia escrito por el estudiante. */
  function validarResistencia(texto) {
    var limpio = String(texto == null ? '' : texto).trim().replace(',', '.');
    if (limpio === '') {
      return { ok: false, mensaje: 'Escribe un valor de resistencia.' };
    }
    if (!/^-?\d+(\.\d+)?$/.test(limpio)) {
      return { ok: false, mensaje: 'El valor debe ser un número (por ejemplo, 330).' };
    }
    var R = Number(limpio);
    if (R < R_MIN || R > R_MAX) {
      return { ok: false, mensaje: 'Valor fuera de rango: usa entre 10 Ω y 100 000 Ω.' };
    }
    return { ok: true, R: R, mensaje: '' };
  }

  /** Resistencia de la LDR según el nivel de luz (0 a 100 %). */
  function resistenciaLDR(luz) {
    var L = Math.max(0, Math.min(100, Number(luz)));
    return LDR_OSCURO * Math.pow(LDR_LUZ / LDR_OSCURO, L / 100);
  }

  /** Estado del escenario del sensor de luz. */
  function sensorLuz(luz) {
    var R_LDR = resistenciaLDR(luz);
    var encendido = R_LDR > UMBRAL_LDR;
    var led = corrienteLED(R_SENSOR_SERIE, encendido);
    return { luz: Number(luz), R_LDR: R_LDR, encendido: encendido, I: led.I, brillo: led.brillo };
  }

  /** Colores de las bandas (dos cifras y multiplicador) para un valor de resistencia. */
  var COLORES = ['negro', 'marron', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'violeta', 'gris', 'blanco'];
  function bandas(R) {
    if (!(R >= 10)) return null;
    var exp = Math.floor(Math.log10(R)) - 1;
    var dos = Math.round(R / Math.pow(10, exp));
    if (dos >= 100) { dos = Math.round(dos / 10); exp += 1; }
    var d1 = Math.floor(dos / 10), d2 = dos % 10;
    return [COLORES[d1], COLORES[d2], COLORES[exp]];
  }

  /** Formatos en español (coma decimal). */
  function formatoNumero(n, decimales) {
    return n.toFixed(decimales).replace('.', ',');
  }
  function formatoCorriente(I) {
    if (I === Infinity) return 'sin límite';
    return formatoNumero(I * 1000, 1) + ' mA';
  }
  function formatoResistencia(R) {
    if (R >= 1000) {
      var k = R / 1000;
      return (Number.isInteger(k) ? String(k) : formatoNumero(k, 1)) + ' kΩ';
    }
    return (Number.isInteger(R) ? String(R) : formatoNumero(R, 1)) + ' Ω';
  }

  var api = {
    V_FUENTE: V_FUENTE, V_LED: V_LED, I_NOMINAL: I_NOMINAL, UMBRAL_LDR: UMBRAL_LDR,
    R_SENSOR_SERIE: R_SENSOR_SERIE,
    corrienteLED: corrienteLED,
    validarResistencia: validarResistencia,
    resistenciaLDR: resistenciaLDR,
    sensorLuz: sensorLuz,
    bandas: bandas,
    formatoNumero: formatoNumero,
    formatoCorriente: formatoCorriente,
    formatoResistencia: formatoResistencia
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { raiz.Circuito = api; }
})(this);
