/*
 * app.js — Escena, escenarios y medición del prototipo WebAR.
 * Coordenadas en el espacio del marcador: el ancho del marcador mide 1 unidad
 * (x de -0,5 a 0,5) y el alto 0,667 (marcador de 1200 x 800 px). El eje z apunta hacia la cámara.
 */
/* global AFRAME, Circuito */

// ---------- Componente: puntos que recorren el lazo (corriente convencional) ----------
var LAZO = { x: 0.34, y: 0.2, z: 0.022 };
var PERIMETRO = 2 * (2 * LAZO.x + 2 * LAZO.y);

function puntoDelLazo(s) {
  // Recorrido desde el borne + de la batería (arriba a la izquierda) en sentido horario.
  var a = 2 * LAZO.x, b = 2 * LAZO.y;
  s = ((s % PERIMETRO) + PERIMETRO) % PERIMETRO;
  if (s < a) return { x: -LAZO.x + s, y: LAZO.y };
  s -= a; if (s < b) return { x: LAZO.x, y: LAZO.y - s };
  s -= b; if (s < a) return { x: LAZO.x - s, y: -LAZO.y };
  s -= a; return { x: -LAZO.x, y: -LAZO.y + s };
}

AFRAME.registerComponent('flujo-corriente', {
  schema: { velocidad: { default: 0 }, cantidad: { default: 16 } },
  init: function () {
    this.desplazamiento = 0;
    this.puntos = [];
    for (var i = 0; i < this.data.cantidad; i++) {
      var p = document.createElement('a-sphere');
      p.setAttribute('radius', 0.011);
      p.setAttribute('material', 'color: #ffd60a; emissive: #ffd60a; emissiveIntensity: 0.9');
      this.el.appendChild(p);
      this.puntos.push(p);
    }
  },
  tick: function (t, dt) {
    var v = this.data.velocidad;
    this.el.object3D.visible = v > 0;
    if (v <= 0 || !dt) return;
    this.desplazamiento += v * Math.min(dt, 100) / 1000;
    var paso = PERIMETRO / this.puntos.length;
    for (var i = 0; i < this.puntos.length; i++) {
      var q = puntoDelLazo(this.desplazamiento + i * paso);
      this.puntos[i].object3D.position.set(q.x, q.y, LAZO.z + 0.012);
    }
  }
});

// ---------- Utilidades ----------
var COLOR_BANDA = {
  negro: '#111111', marron: '#7b3f00', rojo: '#d62828', naranja: '#f77f00', amarillo: '#fcbf49',
  verde: '#2a9d8f', azul: '#1d4ed8', violeta: '#7c3aed', gris: '#9ca3af', blanco: '#f8fafc'
};

function el(tipo, atributos, padre) {
  var e = document.createElement(tipo);
  Object.keys(atributos || {}).forEach(function (k) { e.setAttribute(k, atributos[k]); });
  if (padre) padre.appendChild(e);
  return e;
}

function etiqueta(texto, x, y, padre, color) {
  var grupo = el('a-entity', { position: x + ' ' + y + ' 0.09' }, padre);
  var fondo = el('a-plane', { width: 0.2, height: 0.05, material: 'color: #0f172a; opacity: 0.8; transparent: true' }, grupo);
  var t = el('a-text', { value: texto, align: 'center', width: 0.55, color: color || '#ffffff', position: '0 0 0.002' }, grupo);
  return { grupo: grupo, fondo: fondo, texto: t };
}

function hora() {
  var d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
}
function segundos(ms) { return Circuito.formatoNumero(ms / 1000, 2) + ' s'; }

// ---------- Estado ----------
var estado = {
  escenario: 1,
  cerrado: false,
  R: 220,
  luz: 80,
  t0: performance.now(),
  tListo: null,
  primeraDeteccion: null,
  perdidas: 0,
  tPerdida: null,
  recuperacionMax: 0,
  visible: false,
  registro: []
};

var piezas = {};

function registrar(texto) {
  estado.registro.push(hora() + '  ' + texto);
  var lista = document.getElementById('registro');
  lista.innerHTML = '';
  estado.registro.slice(-8).forEach(function (linea) {
    var li = document.createElement('li'); li.textContent = linea; lista.appendChild(li);
  });
}

// ---------- Construcción del circuito ----------
function construirCircuito() {
  var c = document.getElementById('circuito');
  var z = LAZO.z;
  var cable = 'color: #cbd5e1; metalness: 0.3; roughness: 0.5';

  // Velo oscuro sobre el marcador: se ve solo cuando la cámara detecta la imagen
  // y atenúa su dibujo para que resalte el circuito 3D.
  el('a-plane', {
    position: '0 0 0.002', width: 1.04, height: 0.7,
    material: 'shader: flat; color: #0b1220; opacity: 0.62; transparent: true'
  }, c);

  // Conductores del lazo rectangular
  el('a-box', { position: '0 ' + LAZO.y + ' ' + z, width: 2 * LAZO.x, height: 0.012, depth: 0.012, material: cable }, c);
  el('a-box', { position: '0 ' + (-LAZO.y) + ' ' + z, width: 2 * LAZO.x, height: 0.012, depth: 0.012, material: cable }, c);
  el('a-box', { position: LAZO.x + ' 0 ' + z, width: 0.012, height: 2 * LAZO.y, depth: 0.012, material: cable }, c);
  el('a-box', { position: (-LAZO.x) + ' 0 ' + z, width: 0.012, height: 2 * LAZO.y, depth: 0.012, material: cable }, c);

  // Batería de 5 V (borne + arriba)
  el('a-box', { position: (-LAZO.x) + ' 0 0.04', width: 0.1, height: 0.19, depth: 0.06, material: 'color: #1d4ed8' }, c);
  el('a-cylinder', { position: (-LAZO.x) + ' 0.105 0.04', radius: 0.018, height: 0.02, material: 'color: #e5e7eb' }, c);
  etiqueta('BATERIA 5 V', -LAZO.x, -0.03, c);

  // Resistencia con bandas de color
  piezas.resistencia = el('a-entity', { position: '0 ' + LAZO.y + ' 0.035' }, c);
  el('a-cylinder', { radius: 0.026, height: 0.15, rotation: '0 0 90', material: 'color: #e9d5a1' }, piezas.resistencia);
  piezas.bandas = [-0.04, -0.015, 0.01].map(function (x) {
    return el('a-cylinder', { position: x + ' 0 0', radius: 0.0275, height: 0.012, rotation: '0 0 90', material: 'color: #d62828' }, piezas.resistencia);
  });
  el('a-cylinder', { position: '0.045 0 0', radius: 0.0275, height: 0.012, rotation: '0 0 90', material: 'color: #c9a227; metalness: 0.6' }, piezas.resistencia);
  piezas.etiquetaR = etiqueta('220 ohm', 0, LAZO.y + 0.065, c);

  // Fotorresistencia (escenario 3)
  piezas.ldr = el('a-entity', { position: '-0.15 ' + LAZO.y + ' 0.03', visible: false }, c);
  el('a-cylinder', { radius: 0.042, height: 0.014, rotation: '90 0 0', material: 'color: #b45309' }, piezas.ldr);
  [-0.02, 0, 0.02].forEach(function (y) {
    el('a-box', { position: '0 ' + y + ' 0.009', width: 0.06, height: 0.006, depth: 0.004, material: 'color: #7f1d1d' }, piezas.ldr);
  });
  piezas.sol = el('a-sphere', { position: '0 0 0.2', radius: 0.03, material: 'color: #fde047; emissive: #fde047; emissiveIntensity: 0.8' }, piezas.ldr);
  piezas.etiquetaLDR = etiqueta('LDR', -0.15, LAZO.y + 0.065, c);
  piezas.etiquetaLDR.grupo.setAttribute('visible', false);

  // LED (cúpula hacia la cámara)
  piezas.led = el('a-entity', { position: LAZO.x + ' 0 0.03' }, c);
  el('a-cylinder', { radius: 0.03, height: 0.04, rotation: '90 0 0', material: 'color: #7f1d1d' }, piezas.led);
  piezas.cupula = el('a-sphere', { position: '0 0 0.02', radius: 0.03, material: 'color: #ef4444; emissive: #ff0000; emissiveIntensity: 0; opacity: 0.95; transparent: true' }, piezas.led);
  piezas.halo = el('a-sphere', { position: '0 0 0.02', radius: 0.05, material: 'color: #ff4d4d; opacity: 0; transparent: true; shader: flat' }, piezas.led);
  etiqueta('LED', LAZO.x, -0.07, c);

  // Interruptor (escenarios 1 y 2)
  piezas.interruptor = el('a-entity', { position: '0 ' + (-LAZO.y) + ' 0.03' }, c);
  el('a-box', { width: 0.13, height: 0.04, depth: 0.02, material: 'color: #374151' }, piezas.interruptor);
  piezas.palanca = el('a-entity', { position: '-0.055 0 0.015', rotation: '0 -35 0' }, piezas.interruptor);
  el('a-box', { position: '0.055 0 0', width: 0.11, height: 0.014, depth: 0.012, material: 'color: #e5e7eb' }, piezas.palanca);
  piezas.etiquetaInt = etiqueta('INTERRUPTOR', 0, -LAZO.y - 0.065, c);

  // Comparador (escenario 3)
  piezas.comparador = el('a-box', { position: '0 ' + (-LAZO.y) + ' 0.035', width: 0.14, height: 0.06, depth: 0.04, material: 'color: #065f46', visible: false }, c);
  piezas.etiquetaComp = etiqueta('COMPARADOR', 0, -LAZO.y - 0.065, c);
  piezas.etiquetaComp.grupo.setAttribute('visible', false);

  // Corriente y aviso
  piezas.flujo = el('a-entity', { 'flujo-corriente': 'velocidad: 0' }, c);
  piezas.etiquetaI = etiqueta('I = 0,0 mA', LAZO.x - 0.02, LAZO.y + 0.065, c, '#fde047');
  piezas.aviso3D = etiqueta('', 0, 0, c, '#fecaca');
  piezas.aviso3D.fondo.setAttribute('width', 0.36);
  piezas.aviso3D.grupo.setAttribute('visible', false);
}

// ---------- Actualización visual ----------
function pintarLED(brillo, danado) {
  if (danado) {
    piezas.cupula.setAttribute('material', 'color: #4b5563; emissive: #000000; emissiveIntensity: 0');
    piezas.halo.setAttribute('material', 'opacity', 0);
    return;
  }
  piezas.cupula.setAttribute('material', 'color: ' + (brillo > 0 ? '#ff5a5a' : '#7f1d1d') + '; emissive: #ff0000; emissiveIntensity: ' + (0.15 + 1.2 * brillo).toFixed(2));
  piezas.halo.setAttribute('material', 'opacity', (0.45 * brillo).toFixed(2));
}

function pintarBandas(R) {
  var b = Circuito.bandas(R);
  if (!b) return;
  piezas.bandas.forEach(function (banda, i) { banda.setAttribute('material', 'color', COLOR_BANDA[b[i]]); });
}

function mostrarAviso3D(texto) {
  piezas.aviso3D.grupo.setAttribute('visible', !!texto);
  piezas.aviso3D.texto.setAttribute('value', texto || '');
}

function textoR(R) {
  return R >= 1000 ? Circuito.formatoNumero(R / 1000, R % 1000 ? 1 : 0) + ' kohm' : R + ' ohm';
}

function actualizar() {
  var e = estado.escenario;
  var d1n = document.getElementById('dato1Nombre'), d1 = document.getElementById('dato1');
  var d2n = document.getElementById('dato2Nombre'), d2 = document.getElementById('dato2');
  var msj = document.getElementById('mensaje');

  // Piezas visibles según el escenario
  piezas.interruptor.setAttribute('visible', e !== 3);
  piezas.etiquetaInt.grupo.setAttribute('visible', e !== 3);
  piezas.comparador.setAttribute('visible', e === 3);
  piezas.etiquetaComp.grupo.setAttribute('visible', e === 3);
  piezas.ldr.setAttribute('visible', e === 3);
  piezas.etiquetaLDR.grupo.setAttribute('visible', e === 3);
  piezas.resistencia.setAttribute('position', (e === 3 ? '0.14 ' : '0 ') + LAZO.y + ' 0.035');
  piezas.etiquetaR.grupo.setAttribute('position', (e === 3 ? '0.14 ' : '0 ') + (LAZO.y + 0.065) + ' 0.09');
  piezas.etiquetaI.grupo.setAttribute('visible', e !== 3);

  var r, clase = 'ok';
  if (e === 1) {
    r = Circuito.corrienteLED(220, estado.cerrado);
    pintarBandas(220);
    piezas.etiquetaR.texto.setAttribute('value', '220 ohm');
    piezas.palanca.setAttribute('rotation', estado.cerrado ? '0 0 0' : '0 -35 0');
    d1n.textContent = 'Corriente'; d1.textContent = Circuito.formatoCorriente(r.I);
    d2n.textContent = 'LED'; d2.textContent = r.I > 0 ? 'Encendido' : 'Apagado';
    msj.textContent = estado.cerrado ? 'Circuito cerrado: la corriente recorre el lazo y la resistencia la limita.' : r.mensaje;
    piezas.resistencia.setAttribute('visible', true);
    mostrarAviso3D('');
    pintarLED(r.brillo, false);
  } else if (e === 2) {
    r = Circuito.corrienteLED(estado.R, true);
    piezas.palanca.setAttribute('rotation', '0 0 0');
    d1n.textContent = 'Corriente (R = ' + (estado.R === 0 ? '0 Ω' : Circuito.formatoResistencia(estado.R)) + ')';
    d1.textContent = Circuito.formatoCorriente(r.I);
    d2n.textContent = 'LED';
    if (r.estado === 'sin_resistencia') {
      piezas.resistencia.setAttribute('visible', false);
      piezas.etiquetaR.texto.setAttribute('value', 'SIN RESISTENCIA');
      d2.textContent = 'Dañado';
      mostrarAviso3D('LED DESTRUIDO: SIN LIMITE');
      pintarLED(0, true);
      clase = 'peligro';
    } else {
      piezas.resistencia.setAttribute('visible', true);
      pintarBandas(estado.R);
      piezas.etiquetaR.texto.setAttribute('value', textoR(estado.R));
      d2.textContent = r.estado === 'sobrecorriente' ? 'En riesgo' : 'Brillo ' + Math.round(r.brillo * 100) + ' %';
      mostrarAviso3D(r.estado === 'sobrecorriente' ? 'I > 20 mA: RIESGO' : '');
      pintarLED(r.brillo, false);
      clase = r.estado === 'sobrecorriente' ? 'alerta' : 'ok';
    }
    msj.textContent = r.mensaje + (r.estado === 'normal' ? ' I = (5 V − 2 V) / R.' : '');
  } else {
    var s = Circuito.sensorLuz(estado.luz);
    r = { I: s.I, brillo: s.brillo, estado: 'normal' };
    pintarBandas(220);
    piezas.resistencia.setAttribute('visible', true);
    piezas.etiquetaR.texto.setAttribute('value', '220 ohm');
    piezas.sol.setAttribute('material', 'emissiveIntensity', (0.05 + estado.luz / 100).toFixed(2));
    piezas.sol.setAttribute('material', 'opacity', (0.25 + 0.75 * estado.luz / 100).toFixed(2));
    piezas.sol.setAttribute('material', 'transparent', true);
    d1n.textContent = 'Resistencia de la LDR'; d1.textContent = Circuito.formatoResistencia(Math.round(s.R_LDR / 100) * 100);
    d2n.textContent = 'LED (umbral 10 kΩ)'; d2.textContent = s.encendido ? 'Encendido' : 'Apagado';
    msj.textContent = s.encendido
      ? 'Poca luz: la LDR supera 10 kΩ y el comparador enciende el LED.'
      : 'Hay luz suficiente: la LDR está por debajo de 10 kΩ y el LED permanece apagado.';
    mostrarAviso3D('');
    pintarLED(s.brillo, false);
  }

  msj.className = 'mensaje ' + clase;
  piezas.etiquetaI.texto.setAttribute('value', 'I = ' + (r.I === Infinity ? 'sin limite' : Circuito.formatoNumero(r.I * 1000, 1) + ' mA'));
  piezas.flujo.setAttribute('flujo-corriente', 'velocidad', r.I > 0 && r.I !== Infinity ? 0.06 + 0.3 * r.brillo : 0);
}

// ---------- Medición ----------
function actualizarMedicion() {
  document.getElementById('mDeteccion').textContent =
    estado.primeraDeteccion != null && estado.tListo != null ? segundos(estado.primeraDeteccion - estado.tListo) : '—';
  document.getElementById('mPerdidas').textContent = String(estado.perdidas);
  document.getElementById('mRecMax').textContent = estado.recuperacionMax ? segundos(estado.recuperacionMax) : '—';
}

function medirFps() {
  var cuadros = 0, inicio = performance.now();
  function bucle(t) {
    cuadros++;
    if (t - inicio >= 1000) {
      document.getElementById('mFps').textContent = String(Math.round(cuadros * 1000 / (t - inicio)));
      cuadros = 0; inicio = t;
    }
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);
}

function describirEquipo() {
  var m = navigator.userAgent.match(/\(([^)]+)\)/);
  var partes = m ? m[1].split(';').map(function (s) { return s.trim(); }).filter(function (s) { return s && s !== 'Linux' && s !== 'K' && s !== 'wv'; }) : [];
  return (partes.slice(0, 2).join(' · ') || 'desconocido') + ' · ' + screen.width + '×' + screen.height;
}

function fijarEstado(clase, texto) {
  var p = document.getElementById('estado');
  p.className = 'pastilla ' + clase; p.textContent = texto;
  document.getElementById('aviso').classList.toggle('oculto', clase === 'detectado' || clase === 'esperando');
}

// ---------- Inicio ----------
document.addEventListener('DOMContentLoaded', function () {
  var escena = document.getElementById('escena');
  var objetivo = document.getElementById('objetivo');
  document.getElementById('mEquipo').textContent = describirEquipo();
  document.getElementById('aviso').classList.add('oculto');

  construirCircuito();
  medirFps();

  escena.addEventListener('arReady', function () {
    estado.tListo = performance.now();
    fijarEstado('buscando', 'Buscando marcador');
    registrar('Cámara lista (' + segundos(estado.tListo - estado.t0) + ' desde la carga)');
  });
  escena.addEventListener('arError', function () {
    document.getElementById('errorCamara').classList.remove('oculto');
    registrar('Error: no se pudo iniciar la cámara');
  });

  objetivo.addEventListener('targetFound', function () {
    var ahora = performance.now();
    estado.visible = true;
    fijarEstado('detectado', 'Marcador detectado');
    if (estado.primeraDeteccion == null) {
      estado.primeraDeteccion = ahora;
      registrar('Marcador detectado (' + segundos(ahora - (estado.tListo || estado.t0)) + ')');
    } else if (estado.tPerdida != null) {
      var rec = ahora - estado.tPerdida;
      estado.recuperacionMax = Math.max(estado.recuperacionMax, rec);
      document.getElementById('mRecuperacion').textContent = segundos(rec);
      registrar('Marcador recuperado tras ' + segundos(rec) + '; escenario ' + estado.escenario + ' sin cambios');
    }
    estado.tPerdida = null;
    actualizarMedicion();
  });
  objetivo.addEventListener('targetLost', function () {
    estado.visible = false;
    estado.perdidas++;
    estado.tPerdida = performance.now();
    fijarEstado('perdido', 'Marcador perdido');
    registrar('Marcador perdido (pérdida n.º ' + estado.perdidas + ')');
    actualizarMedicion();
  });

  // Pestañas
  document.querySelectorAll('.pestana').forEach(function (b) {
    b.addEventListener('click', function () {
      estado.escenario = Number(b.dataset.esc);
      document.querySelectorAll('.pestana').forEach(function (x) { x.classList.toggle('activa', x === b); });
      [1, 2, 3].forEach(function (n) { document.getElementById('ctl' + n).classList.toggle('oculto', n !== estado.escenario); });
      registrar('Escenario ' + estado.escenario + ' seleccionado');
      actualizar();
    });
  });

  // Escenario 1
  document.getElementById('btnInterruptor').addEventListener('click', function () {
    estado.cerrado = !estado.cerrado;
    this.textContent = estado.cerrado ? 'Abrir interruptor' : 'Cerrar interruptor';
    registrar('E1: interruptor ' + (estado.cerrado ? 'cerrado → I = 13,6 mA' : 'abierto → I = 0 mA'));
    actualizar();
  });

  // Escenario 2
  function elegirR(R, boton) {
    estado.R = R;
    document.querySelectorAll('.opcion').forEach(function (x) { x.classList.toggle('activa', x === boton); });
    var r = Circuito.corrienteLED(R, true);
    registrar('E2: R = ' + (R === 0 ? '0 Ω' : Circuito.formatoResistencia(R)) + ' → ' + Circuito.formatoCorriente(r.I) + (r.estado !== 'normal' ? ' (' + r.estado.replace('_', ' ') + ')' : ''));
    actualizar();
  }
  document.querySelectorAll('.opcion').forEach(function (b) {
    b.addEventListener('click', function () { elegirR(Number(b.dataset.r), b); });
  });
  document.getElementById('btnAplicar').addEventListener('click', function () {
    var entrada = document.getElementById('rLibre');
    var v = Circuito.validarResistencia(entrada.value);
    if (!v.ok) {
      var msj = document.getElementById('mensaje');
      msj.textContent = 'Valor rechazado («' + entrada.value + '»): ' + v.mensaje + ' Se mantiene ' + (estado.R === 0 ? '0 Ω' : Circuito.formatoResistencia(estado.R)) + '.';
      msj.className = 'mensaje alerta';
      registrar('E2: entrada «' + entrada.value + '» rechazada');
      return;
    }
    elegirR(v.R, null);
  });

  // Escenario 3
  document.getElementById('luz').addEventListener('input', function () {
    estado.luz = Number(this.value);
    document.getElementById('luzValor').textContent = estado.luz + ' %';
    actualizar();
  });
  document.getElementById('luz').addEventListener('change', function () {
    var s = Circuito.sensorLuz(estado.luz);
    registrar('E3: luz ' + estado.luz + ' % → LDR ' + Circuito.formatoResistencia(Math.round(s.R_LDR / 100) * 100) + ', LED ' + (s.encendido ? 'encendido' : 'apagado'));
  });

  // Panel de medición
  document.getElementById('btnMedicion').addEventListener('click', function () {
    var panel = document.getElementById('medicion');
    var abierto = panel.classList.toggle('oculto') === false;
    this.setAttribute('aria-expanded', String(abierto));
  });
  document.getElementById('btnCopiar').addEventListener('click', function () {
    var texto = ['Equipo: ' + describirEquipo()].concat(estado.registro).join('\n');
    var boton = this;
    function hecho() { boton.textContent = 'Copiado'; setTimeout(function () { boton.textContent = 'Copiar registro'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(hecho, function () { window.prompt('Copia el registro:', texto); });
    } else { window.prompt('Copia el registro:', texto); }
  });

  registrar('Página cargada');
  actualizar();
});
