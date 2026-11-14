// Pruebas del modelo: node prueba_circuito.js
const C = require('./circuito.js');
const assert = require('assert');
let n = 0;
function ok(nombre, fn) { fn(); n++; console.log('✔ ' + nombre); }

ok('220 Ω da unos 13,6 mA', () => assert.strictEqual(C.formatoCorriente(C.corrienteLED(220).I), '13,6 mA'));
ok('470 Ω da unos 6,4 mA', () => assert.strictEqual(C.formatoCorriente(C.corrienteLED(470).I), '6,4 mA'));
ok('1 kΩ da 3,0 mA', () => assert.strictEqual(C.formatoCorriente(C.corrienteLED(1000).I), '3,0 mA'));
ok('menor R, mayor brillo', () => assert(C.corrienteLED(220).brillo > C.corrienteLED(470).brillo && C.corrienteLED(470).brillo > C.corrienteLED(1000).brillo));
ok('interruptor abierto: 0 A', () => { const r = C.corrienteLED(220, false); assert.strictEqual(r.I, 0); assert.strictEqual(r.estado, 'abierto'); });
ok('0 Ω: error sin resistencia', () => assert.strictEqual(C.corrienteLED(0).estado, 'sin_resistencia'));
ok('100 Ω: 30 mA, sobrecorriente', () => { const r = C.corrienteLED(100); assert.strictEqual(r.estado, 'sobrecorriente'); assert.strictEqual(C.formatoCorriente(r.I), '30,0 mA'); });
ok('150 Ω: 20 mA justo, normal', () => assert.strictEqual(C.corrienteLED(150).estado, 'normal'));
ok('valida 330', () => assert.deepStrictEqual(C.validarResistencia('330'), { ok: true, R: 330, mensaje: '' }));
ok('acepta coma decimal', () => assert.strictEqual(C.validarResistencia('4,7').ok, false)); // 4,7 Ω < 10 Ω
ok('rechaza -5', () => assert.strictEqual(C.validarResistencia('-5').ok, false));
ok('rechaza texto', () => assert.match(C.validarResistencia('abc').mensaje, /número/));
ok('rechaza vacío', () => assert.strictEqual(C.validarResistencia('  ').ok, false));
ok('rechaza 200000', () => assert.match(C.validarResistencia('200000').mensaje, /fuera de rango/));
ok('LDR 100 % = 1 kΩ', () => assert.strictEqual(Math.round(C.resistenciaLDR(100)), 1000));
ok('LDR 0 % = 100 kΩ', () => assert.strictEqual(Math.round(C.resistenciaLDR(0)), 100000));
ok('LDR 50 % = 10 kΩ (umbral)', () => assert.strictEqual(Math.round(C.resistenciaLDR(50)), 10000));
ok('80 % de luz: LED apagado', () => assert.strictEqual(C.sensorLuz(80).encendido, false));
ok('20 % de luz: LED encendido', () => assert.strictEqual(C.sensorLuz(20).encendido, true));
ok('bandas 220', () => assert.deepStrictEqual(C.bandas(220), ['rojo', 'rojo', 'marron']));
ok('bandas 470', () => assert.deepStrictEqual(C.bandas(470), ['amarillo', 'violeta', 'marron']));
ok('bandas 1000', () => assert.deepStrictEqual(C.bandas(1000), ['marron', 'negro', 'rojo']));
ok('bandas 10', () => assert.deepStrictEqual(C.bandas(10), ['marron', 'negro', 'negro']));
ok('bandas 99999 redondea', () => assert.deepStrictEqual(C.bandas(99999), ['marron', 'negro', 'amarillo']));
ok('formato kΩ', () => { assert.strictEqual(C.formatoResistencia(1000), '1 kΩ'); assert.strictEqual(C.formatoResistencia(4700), '4,7 kΩ'); assert.strictEqual(C.formatoResistencia(220), '220 Ω'); });
console.log(`\n${n} pruebas superadas.`);
