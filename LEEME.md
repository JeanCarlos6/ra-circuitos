# Laboratorio RA · Circuitos (prototipo WebAR)

App de realidad aumentada para la asignatura Sistemas Eléctricos y Electrónicos (TDI-204).
Funciona en el navegador del celular, sin instalar nada. Usa A-Frame 1.5.0 y MindAR 1.2.5.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página: escena de RA y panel de controles |
| `app.js` | Arma el circuito 3D, los 3 escenarios, el panel de medición y los mensajes de error |
| `circuito.js` | El modelo de cálculo (ley de Ohm, LDR, validación de datos) |
| `estilos.css` | Diseño de la interfaz |
| `prueba_circuito.js` | 25 pruebas automáticas del modelo (`node prueba_circuito.js`) |
| `marcador.png` | La imagen que la cámara reconoce (marcador propio) |
| `guia_impresa.pdf` | Guía para imprimir: hoja 1 = marcador, hoja 2 = hoja del estudiante |
| `targets.mind` | **Falta:** lo generan ustedes en el paso 1 |

## Paso 1 · Generar `targets.mind` (5 minutos)

1. Abran el compilador oficial de MindAR: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Suban `marcador.png` y pulsen **Start**.
3. Cuando termine, pulsen **Download compiled** y guarden el archivo como `targets.mind`, en esta misma carpeta.

## Paso 2 · Publicar en GitHub Pages (10 minutos)

La cámara solo funciona con **https**, por eso no sirve abrir `index.html` con doble clic.

1. En GitHub: **New repository** → nombre `ra-circuitos` → **Public** → Create.
2. **Add file → Upload files** → arrastren todos los archivos de esta carpeta, incluido `targets.mind` → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → **Save**.
4. En 1 o 2 minutos la app queda en `https://SU-USUARIO.github.io/ra-circuitos/`.

## Paso 3 · Imprimir y probar

1. Impriman `guia_impresa.pdf` (a color si se puede; la hoja 1 es el marcador).
2. Abran el enlace en Chrome (Android) o Safari (iPhone), permitan la cámara y enfoquen la hoja a 25–40 cm.
3. Si no reconoce el marcador: más luz, sin reflejos y la hoja entera dentro de la pantalla.

## Paso 4 · Ejecutar los 5 escenarios del capítulo y tomar las capturas

Abran el botón **Medición** cuando haga falta; ahí salen los tiempos y el registro con la hora de cada acción.
Al terminar cada escenario, **Copiar registro** les da los datos para completar las partes amarillas del Word.

| Figura | Qué hacer | Qué debe verse en la captura |
|---|---|---|
| Figura 3 | Escenario 1. Recarguen la página 3 veces y anoten el tiempo de «Detección inicial» de cada vez. Cierren el interruptor. | La hoja impresa, el circuito encima, el LED encendido y los puntos de corriente |
| Figura 4 | Escenario 2: pulsen 220, 470 y 1 kΩ y anoten la corriente de cada uno | Botón 470 Ω activo, bandas amarilla-violeta, panel con 6,4 mA |
| Figura 5 | Escenario 3: pongan la luz en 80, 50, 45 y 20 % y anoten la resistencia y el estado del LED | Luz en 20 %, LED encendido, panel con 39,8 kΩ |
| Figura 6 | Escenario 2: pulsen 0 Ω; luego escriban 100, -5, abc y 200000 con **Aplicar** | La captura con 0 Ω: LED dañado y mensaje en rojo |
| Figura 7 | Con 470 Ω, tapen la hoja con la mano 3 veces (unos 2 s); inclinen la hoja unos 60°; apaguen la luz del aula y prueben | Panel **Medición** abierto con las pérdidas, la recuperación máxima y el registro |

**Importante:** escriban en el Word solo lo que vieron. Si algo no salió como se esperaba, eso también es un resultado válido y se reporta tal cual.
