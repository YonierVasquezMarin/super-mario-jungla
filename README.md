# Super Mario Jungla

Plataformas lateral en el navegador. Recorres una selva, trepas tuberías, golpeas bloques, recoges monedas y llegas al templo. El personaje y el escenario son arte original. Por ahora no hay música.

Está hecho con Angular. La partida corre en un canvas y cada nivel es un archivo JSON independiente, pensado para poder reutilizarse más adelante en otra plataforma.

## 🗺️ Rutas

| Ruta | Qué hay |
| --- | --- |
| `/` | Menú, con el botón Play y el enlace a créditos |
| `/play` | La partida del primer nivel |
| `/credits` | Créditos del proyecto |

## 🎮 Cómo jugar

1. Arranca el proyecto y abre `/`.
2. Pulsa **Play**.
3. Avanza hacia la derecha hasta el templo.
4. Si llegas, el nivel queda marcado como completado y puedes volver al menú.

El nivel actual se llama **La senda del templo**.

## 📜 Reglas

- Empiezas con **3 vidas**.
- El contador de **monedas** sube al recogerlas del aire o al golpear un bloque `?` con la cabeza.
- **Caer a un hueco** quita una vida y te devuelve al inicio del nivel.
- Las **espinas** y el costado de un **escarabajo** quitan una vida. Tras el golpe hay un momento breve en el que no recibes daño.
- **Pisar un escarabajo** desde arriba lo elimina y te hace rebotar.
- Las **tuberías** se pueden trepar. En la cima, muévete hacia la tubería para subirte encima.
- Los **bloques** sólidos se pueden pisar y golpear desde abajo. Los que tienen `?` entregan una moneda y quedan vacíos.
- Entrar al **templo** termina el nivel. Si te quedas sin vidas, puedes reintentar o volver al menú.
- **Pausa** congela la partida. **Escape** vuelve al menú.

## 🕹️ Controles

| Acción | Teclado | Pantalla táctil |
| --- | --- | --- |
| Moverte | Flechas o WASD | Botones izquierda y derecha |
| Saltar | Espacio o Z | Botón Saltar |
| Trepar una tubería | Flecha arriba o W, pegado a la tubería | Botón de flecha arriba |
| Volver al menú | Escape | Enlace Menú |

En el móvil los botones aparecen cuando el dispositivo es táctil.

## 💾 Progreso

Los niveles terminados se guardan en `localStorage`, con la clave `smj-progress`:

```json
{ "completedLevelIds": ["jungla-1"] }
```

El menú muestra **Completado** junto al nombre del nivel si ese id ya está guardado. Borrar los datos del sitio reinicia el progreso.

## 🧩 Niveles

Los niveles viven en `public/levels/`.

- `manifest.json` lista los ids en orden. La partida carga el primero.
- `jungla-1.json` es el nivel jugable.

Para añadir otro nivel, crea un JSON nuevo y cita su id en el manifiesto. Todas las filas deben medir lo mismo, tiene que haber un solo `@` y al menos una `G`.

```json
{
  "id": "jungla-1",
  "name": "La senda del templo",
  "tileSize": 16,
  "rows": ["...@....", "SSSSSSSS"]
}
```

| Carácter | Significado |
| --- | --- |
| `.` | Aire |
| `S` | Suelo |
| `P` | Tubería trepable |
| `B` | Bloque sólido |
| `?` | Bloque que suelta una moneda al golpearlo desde abajo |
| `c` | Moneda |
| `^` | Espinas |
| `E` | Escarabajo |
| `G` | Templo, la meta |
| `@` | Inicio del jugador |

## 🛠️ Uso en local

```bash
npm install
npm start
```

`npm start` ejecuta `ng serve`. Abre `http://localhost:4200/`.

Otros comandos:

```bash
npm test
npm run build
```

`npm test` corre los tests con Vitest. `npm run build` deja la aplicación en `dist/`.
