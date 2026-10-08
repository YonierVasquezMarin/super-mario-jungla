# Super Mario Jungla

Plataformas lateral en el navegador. Recorres una selva, trepas tuberías, golpeas bloques, recoges monedas y llegas al templo. El personaje y el escenario son arte original. Por ahora no hay música.

Está hecho con Angular. La partida corre en un canvas y cada nivel es un archivo JSON independiente. Este documento explica cómo se despliega esa aplicación estática en Google Cloud, desde un equipo Windows hasta una IP pública, manteniendo el bucket de Cloud Storage **privado**.

La aplicación publicada en el momento de redactar esta guía responde en:

```text
http://136.81.237.137/
```

## Descripción

El camino que documenta esta guía es:

```text
Código Angular local
        ↓
npm install
        ↓
ng build
        ↓
Cloud Storage privado
        ↓
Backend Bucket
        ↓
Cloud CDN
        ↓
Global External Application Load Balancer
        ↓
Internet
```

Internet no lee el bucket directamente. El balanceador, a través de Cloud CDN, es quien lee los objetos con una identidad de Google y los entrega al visitante.

```text
                         INTERNET
                            │
                            ▼
              Global External Application
                     Load Balancer
                     HTTP, puerto 80
                            │
                            ▼
                       Cloud CDN
                  FORCE_CACHE_ALL
                            │
                            ▼
                    Backend Bucket
              super-mario-jungla-cloud-cdn
                            │
                            │ roles/storage.objectViewer
                            ▼
                 ┌─────────────────────┐
                 │   Cloud Storage     │
                 │                     │
                 │      PRIVATE        │
                 │                     │
                 │ index.html          │
                 │ main-*.js           │
                 │ styles-*.css        │
                 │ levels/             │
                 └─────────────────────┘
```

Esta arquitectura es distinta de publicar el bucket en Internet. En un bucket público cualquier persona puede pedir los objetos a `storage.googleapis.com`, listarlos si el rol lo permite y saltarse el balanceador. Aquí el bucket rechaza ese acceso. La comprobación está en [Verificar el despliegue](#14-verificar-el-despliegue): la URL directa del objeto responde `403` y la IP del balanceador responde `200`.

## El juego

### Rutas de Angular

| Ruta | Qué hay |
| --- | --- |
| `/` | Menú, con el botón Play y el enlace a créditos |
| `/play` | La partida del primer nivel |
| `/credits` | Créditos del proyecto |

Cualquier otra ruta del cliente, como `/home` o `/juego`, no existe en el router. La ruta comodín de Angular la redirige a `/`. Para que esa redirección ocurra, el balanceador tiene que entregar antes `index.html`. Eso se configura en [Configurar el routing de Angular](#13-configurar-el-routing-de-angular).

### Cómo jugar

1. Arranca el proyecto y abre `/`.
2. Pulsa **Play**.
3. Avanza hacia la derecha hasta el templo.
4. Si llegas, el nivel queda marcado como completado y puedes volver al menú.

El nivel actual se llama **La senda del templo**.

### Reglas

- Empiezas con **3 vidas**.
- El contador de **monedas** sube al recogerlas del aire o al golpear un bloque `?` con la cabeza.
- **Caer a un hueco** quita una vida y te devuelve al inicio del nivel.
- Las **espinas** y el costado de un **escarabajo** quitan una vida. Tras el golpe hay un momento breve en el que no recibes daño.
- **Pisar un escarabajo** desde arriba lo elimina y te hace rebotar.
- Las **tuberías** se pueden trepar. En la cima, muévete hacia la tubería para subirte encima.
- Los **bloques** sólidos se pueden pisar y golpear desde abajo. Los que tienen `?` entregan una moneda y quedan vacíos.
- Entrar al **templo** termina el nivel. Si te quedas sin vidas, puedes reintentar o volver al menú.
- **Pausa** congela la partida. **Escape** vuelve al menú.

### Controles

| Acción | Teclado | Pantalla táctil |
| --- | --- | --- |
| Moverte | Flechas o WASD | Botones izquierda y derecha |
| Saltar | Espacio o Z | Botón Saltar |
| Trepar una tubería | Flecha arriba o W, pegado a la tubería | Botón de flecha arriba |
| Volver al menú | Escape | Enlace Menú |

En el móvil los botones aparecen cuando el dispositivo es táctil.

### Progreso

Los niveles terminados se guardan en `localStorage`, con la clave `smj-progress`:

```json
{ "completedLevelIds": ["jungla-1"] }
```

El menú muestra **Completado** junto al nombre del nivel si ese id ya está guardado. Borrar los datos del sitio reinicia el progreso.

### Niveles

Los niveles viven en `public/levels/`. El build de Angular copia el contenido de `public/` a la raíz del resultado, junto a `index.html`.

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

## Arquitectura desplegada

Estos valores se comprobaron con `gcloud` al escribir esta guía.

| Pieza | Valor verificado |
| --- | --- |
| Project ID del balanceador | `super-mario-jungla-511018` |
| Project number | `176927221192` |
| Bucket | `super-mario-jungla-bucket` |
| Ubicación del bucket | `US-CENTRAL1` |
| Acceso público del bucket | Public Access Prevention `enforced` |
| Control de acceso | Uniform bucket-level access activo |
| Página índice del bucket | `mainPageSuffix = index.html` |
| Backend bucket | `super-mario-jungla-cloud-cdn` |
| Cloud CDN | Activado |
| Cache mode | `FORCE_CACHE_ALL` |
| Client TTL y default TTL | `3600` segundos |
| Compresión CDN | `DISABLED` |
| URL map | `super-mario-jungla-balancer` |
| Target HTTP proxy | `super-mario-jungla-balancer-target-proxy` |
| Forwarding rule IPv4 | `super-mario-jungla-balancer-forwarding-rule-ipv4` |
| Forwarding rule IPv6 | `super-mario-jungla-balancer-forwarding-rule-ipv6` |
| Esquema | `EXTERNAL_MANAGED` (Global External Application Load Balancer) |
| Nivel de red | Premium |
| Puertos | Solo `80`. No hay HTTPS |
| IP IPv4 | `136.81.237.137` |
| IP IPv6 | `2600:1901:0:e7e1::` |
| IP reservada | No. `gcloud compute addresses list` no devolvió direcciones |
| Identidad que lee el bucket | `service-176927221192@https-lb.iam.gserviceaccount.com` |
| Rol de esa identidad | `roles/storage.objectViewer` |

Hay otro proyecto de Google Cloud con un nombre parecido. No es el del balanceador:

| | Proyecto del balanceador | Otro proyecto |
| --- | --- | --- |
| Project ID | `super-mario-jungla-511018` | `super-mario-jungla` |
| Project number | `176927221192` | `940038137987` |
| Uso en este despliegue | Storage, CDN y Load Balancer | Aparece en Firebase Hosting (`.firebaserc`) |
| Compute Engine | Habilitado | No estaba habilitado cuando se diagnosticó el `AccessDenied` |

El número de proyecto importa porque Google crea una identidad administrada por proyecto, no por nombre visible. La del balanceador tiene esta forma:

```text
service-PROJECT_NUMBER@https-lb.iam.gserviceaccount.com
```

`PROJECT_ID` y `PROJECT_NUMBER` son datos distintos. Usar el número del proyecto equivocado hace que Cloud IAM responda que la cuenta de servicio no existe.

### Configuración inicial y configuración actual

Cuando se diagnosticó el error `AccessDenied`, el balanceador, el backend bucket y los archivos ya existían. Cloud CDN estaba activo con otro modo de caché:

| Ajuste | Configuración encontrada al diagnosticar | Configuración actual |
| --- | --- | --- |
| Cache mode | `CACHE_ALL_STATIC` | `FORCE_CACHE_ALL` |
| `maxTtl` | `86400` | No está definido. Con `FORCE_CACHE_ALL` la API no lo admite |
| `defaultTtl` y `clientTtl` | `3600` | `3600` |
| IAM del service agent | No estaba concedido | `roles/storage.objectViewer` |
| `mainPageSuffix` | No estaba configurado. `GET /` listaba el bucket | `index.html` |
| URL map | Solo el servicio por defecto | Reglas para archivos reales y reescritura del resto a `/index.html` |

Los comandos de creación de más abajo reconstruyen la forma final. El alta original del balanceador, el 8 de octubre de 2026, ya estaba hecha antes de ese diagnóstico. En el repositorio no quedó registrado si esa alta se hizo desde la consola o desde la CLI.

## Requisitos previos

- Windows con PowerShell o CMD.
- Node.js compatible con Angular 22. `package.json` declara Angular `^22.2.0` y el gestor `npm@11.17.0`. Este repositorio no fija la versión de Node en `engines`, y no quedó registrada la versión exacta con la que se generó el build que hoy está en el bucket. Consulta la [compatibilidad de versiones de Angular](https://angular.dev/reference/versions).
- Una cuenta de Google Cloud con permiso para crear recursos en `super-mario-jungla-511018`.
- Google Cloud CLI. La instalación se comprueba con `gcloud --version`. Esta guía no fija un número de versión.

En PowerShell, `curl` es un alias de `Invoke-WebRequest`. Los ejemplos de prueba usan `curl.exe`, que es el curl real de Windows.

La barra invertida `\` de Bash no continúa una línea en PowerShell. Los comandos de esta guía van en una sola línea para que sirvan igual en PowerShell y en CMD.

## 1. Instalar Google Cloud CLI

Instala la CLI con el [instalador oficial de Windows](https://cloud.google.com/sdk/docs/install#windows). La guía general está en [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install).

Al terminar, cierra y vuelve a abrir la terminal para que el `PATH` se actualice. Comprueba que el comando responde:

```powershell
gcloud --version
```

Tienes que ver el componente `Google Cloud SDK` y el comando `gcloud`. El número de versión puede ser otro. Si Windows no reconoce `gcloud`, la instalación no quedó en el `PATH` de esa terminal.

## 2. Autenticarse

`gcloud auth login` solo abre el navegador e inicia sesión. No elige proyecto ni deja lista la configuración activa.

`gcloud init` es el flujo que conviene usar la primera vez. Hace las tres cosas:

1. Autentica una cuenta de usuario.
2. Te deja elegir esa cuenta si hay varias.
3. Te deja elegir el proyecto y guarda la configuración activa.

```powershell
gcloud init
```

En el asistente elige la cuenta con acceso a este proyecto y, cuando pregunte el proyecto, elige `super-mario-jungla-511018`. Si el asistente no lo lista, termina `gcloud init` y selecciónalo en el paso siguiente.

Durante el diagnóstico la CLI ya estaba autenticada y la configuración activa `default` ya apuntaba a `super-mario-jungla-511018`. El repositorio no guarda si esa sesión se creó con `gcloud init` o con `gcloud auth login` seguido de `gcloud config set project`.

Comprueba la sesión:

```powershell
gcloud auth list
```

```powershell
gcloud config get-value project
```

```powershell
gcloud config list
```

La cuenta activa aparece con un asterisco en `gcloud auth list`. `gcloud config get-value project` tiene que imprimir `super-mario-jungla-511018`.

Documentación: [Initializing the gcloud CLI](https://cloud.google.com/sdk/docs/initializing) y [Authenticate for using the gcloud CLI](https://cloud.google.com/docs/authentication/gcloud).

## 3. Configurar el proyecto

El balanceador está en `super-mario-jungla-511018`. El proyecto `super-mario-jungla` es otro, aunque el nombre se parezca. Firebase Hosting de este repositorio apunta a ese segundo proyecto (`.firebaserc`).

Fija el proyecto del balanceador:

```powershell
gcloud config set project super-mario-jungla-511018
```

Confírmalo:

```powershell
gcloud config get-value project
```

Obtén el número:

```powershell
gcloud projects describe super-mario-jungla-511018 --format="value(projectNumber)"
```

El resultado esperado es:

```text
176927221192
```

Ese número entra en la identidad `service-176927221192@https-lb.iam.gserviceaccount.com`. Si describes el otro proyecto, el número es `940038137987` y la identidad construida con él no sirve para este balanceador.

## 4. Habilitar APIs

Para esta arquitectura hacen falta dos APIs:

| API | Para qué | ¿Obligatoria? |
| --- | --- | --- |
| `compute.googleapis.com` | Balanceador, URL map, proxy, forwarding rules, backend bucket y Cloud CDN | Sí |
| `storage.googleapis.com` | Bucket y objetos | Sí |

Cloud CDN no aparece como una API aparte en `gcloud services list`. Se activa en el backend bucket con `--enable-cdn`, y ese recurso pertenece a Compute Engine.

Certificate Manager no está habilitado y este despliegue no lo usa. HTTPS todavía no está configurado. Un certificado administrado por Google para el balanceador global puede crearse más adelante con Compute Engine, sin Certificate Manager. Ver [Próximos pasos](#18-https-y-dominio).

En el proyecto también hay otras APIs habilitadas (BigQuery, Dataplex, Logging, Monitoring, entre otras). No intervienen en servir la aplicación Angular.

Para ver las que están activas:

```powershell
gcloud services list --enabled
```

Si partes de un proyecto nuevo, habilita solo las dos necesarias:

```powershell
gcloud services enable compute.googleapis.com storage.googleapis.com
```

Al habilitar Storage, Google suele activar también `storage-api.googleapis.com` y `storage-component.googleapis.com`. En este proyecto las tres están habilitadas.

## 5. Preparar Angular

Desde la raíz del repositorio:

```powershell
npm install
```

Genera el build de producción. `npm run build` ejecuta `ng build`. En `angular.json` la configuración por defecto del build es `production`, con `outputHashing: all`. Por eso los archivos se llaman `main-NALWE7G2.js` y `styles-VVP5BIFS.css`: el hash cambia en cada build.

```powershell
npm run build
```

`angular.json` no define `outputPath`. Con el builder `@angular/build:application`, la salida por defecto queda en:

```text
dist/super-mario-jungla/browser
```

Esa misma ruta es el directorio público de `firebase.json`. Ahí tienen que estar `index.html`, los JS, el CSS, `favicon.ico` y `levels/`.

`angular.json` copia todo `public/` al resultado. Hoy `public/` solo contiene `public/levels/`. No hay carpetas `assets/` ni `media/` en el código ni en el bucket. El URL map reserva los prefijos `/assets/` y `/media/` por si más adelante se añaden archivos ahí.

Se sube el contenido de `browser`, que es el resultado de producción. No se sube `src/`, `node_modules/` ni la carpeta `browser` como prefijo.

Comprueba la salida:

```powershell
Get-ChildItem dist\super-mario-jungla\browser
```

Tiene que aparecer `index.html` en esa carpeta, no dentro de otra subcarpeta.

Para desarrollar en local, sin GCP:

```powershell
npm start
```

`npm start` ejecuta `ng serve` y abre `http://localhost:4200/`. `npm test` corre los tests con Vitest.

## 6. Crear Cloud Storage

El bucket se llama `super-mario-jungla-bucket`. El nombre de un bucket es único en todo Google Cloud.

Configuración verificada:

- Ubicación regional `us-central1`.
- Uniform bucket-level access activo. Los permisos se administran solo con IAM, no con ACLs por objeto.
- Public Access Prevention en `enforced`. Google rechaza una política que haga el bucket público.
- Los objetos leídos durante las pruebas anuncian la clase `STANDARD`. Al describir el bucket, la metadata consultada no mostró otra clase de almacenamiento.

Crear un bucket equivalente:

```powershell
gcloud storage buckets create gs://super-mario-jungla-bucket --project=super-mario-jungla-511018 --location=us-central1 --uniform-bucket-level-access --public-access-prevention
```

El bucket tiene que seguir siendo privado. No agregues `allUsers` ni `allAuthenticatedUsers`.

`allUsers` significa cualquier persona de Internet. Con `roles/storage.objectViewer` podría leer los objetos en `storage.googleapis.com`, sin pasar por el balanceador ni por Cloud CDN. `allAuthenticatedUsers` significa cualquier cuenta de Google autenticada, no “los usuarios de esta aplicación”. Public Access Prevention está precisamente para impedir ese tipo de concesión.

Los permisos que sí existen, y son los esperados, son los roles heredados del proyecto (`projectOwner`, `projectEditor`, `projectViewer` de `super-mario-jungla-511018`) y el service agent del balanceador. Ninguno de ellos es un principal público.

Documentación: [Crear buckets](https://cloud.google.com/storage/docs/creating-buckets), [Uniform bucket-level access](https://cloud.google.com/storage/docs/uniform-bucket-level-access) y [Public Access Prevention](https://cloud.google.com/storage/docs/public-access-prevention).

## 7. Subir los archivos

El destino correcto es la raíz del bucket:

```text
gs://super-mario-jungla-bucket/index.html
gs://super-mario-jungla-bucket/main-*.js
gs://super-mario-jungla-bucket/styles-*.css
gs://super-mario-jungla-bucket/favicon.ico
gs://super-mario-jungla-bucket/levels/manifest.json
gs://super-mario-jungla-bucket/levels/jungla-1.json
```

Esta estructura es incorrecta, porque el balanceador pediría `/index.html` y el objeto estaría en `/browser/index.html`:

```text
gs://super-mario-jungla-bucket/browser/index.html
```

En Windows, `gcloud storage rsync` copia el contenido del directorio y evita que PowerShell expanda un `*`:

```powershell
gcloud storage rsync --recursive dist\super-mario-jungla\browser gs://super-mario-jungla-bucket
```

La alternativa con `cp` también funciona si el origen es el contenido de `browser` y no la carpeta en sí. Las comillas evitan que el shell interprete el comodín de otra forma:

```powershell
gcloud storage cp --recursive "dist\super-mario-jungla\browser\*" gs://super-mario-jungla-bucket/
```

Este otro comando crea el prefijo `browser/` y no debe usarse:

```powershell
gcloud storage cp --recursive dist\super-mario-jungla\browser gs://super-mario-jungla-bucket/
```

Cada build nuevo genera hashes distintos. `rsync` sin borrar deja en el bucket los JS y CSS viejos. Si quieres eliminar del bucket lo que ya no está en `browser`, puedes añadir `--delete-unmatched-destination-objects`. Ese flag borra objetos del bucket. Revísalo antes de usarlo.

Comprueba la raíz y, después, el árbol completo:

```powershell
gcloud storage ls gs://super-mario-jungla-bucket
```

```powershell
gcloud storage ls --recursive gs://super-mario-jungla-bucket
```

En el bucket verificado hoy están `index.html`, cuatro archivos `chunk-*.js`, `main-NALWE7G2.js`, `styles-VVP5BIFS.css`, `favicon.ico` y `levels/`. Esos nombres de hash corresponden al build que se subió. El próximo `ng build` producirá otros nombres.

## 8. Configurar index.html

Cloud Storage puede tratar la raíz del bucket como una página web y devolver un objeto concreto cuando la petición es `/`.

El comando que se aplicó:

```powershell
gcloud storage buckets update gs://super-mario-jungla-bucket --web-main-page-suffix=index.html
```

Antes de ese cambio, `GET /` a través del balanceador devolvía un XML `ListBucketResult` con los nombres de los objetos. Después, `GET /` devuelve `index.html`.

Configurar `mainPageSuffix` no publica el bucket. Solo le dice a Cloud Storage qué objeto usar como índice. El acceso directo a `storage.googleapis.com` sigue respondiendo `403` porque la política IAM no incluye principales públicos.

No hay `notFoundPage` configurada. Las rutas de la SPA no se resuelven con la página de error del bucket. Se resuelven en el URL map, para poder responder `200` y para no convertir un asset inexistente en HTML.

Documentación: [Alojar un sitio web estático](https://cloud.google.com/storage/docs/hosting-static-website).

## 9. Crear el backend bucket

Un backend bucket es el adaptador que permite al balanceador usar un bucket de Cloud Storage como origen. No es el bucket. El bucket guarda los archivos. El backend bucket le dice al balanceador cuál es ese bucket y cómo debe cachear Cloud CDN.

Nombre: `super-mario-jungla-cloud-cdn`. Bucket asociado: `super-mario-jungla-bucket`.

Crearlo ya con CDN y el modo de caché final:

```powershell
gcloud compute backend-buckets create super-mario-jungla-cloud-cdn --gcs-bucket-name=super-mario-jungla-bucket --enable-cdn --cache-mode=FORCE_CACHE_ALL
```

El recurso real se creó primero con `CACHE_ALL_STATIC` y después se actualizó. Si el backend bucket ya existe, no lo borres. Actualízalo como en la sección siguiente.

Comprueba la lista y el detalle:

```powershell
gcloud compute backend-buckets list
```

```powershell
gcloud compute backend-buckets describe super-mario-jungla-cloud-cdn
```

`ENABLE_CDN` tiene que ser `True` y `bucketName` tiene que ser `super-mario-jungla-bucket`.

Al crear el primer backend bucket, Google crea la identidad `service-PROJECT_NUMBER@https-lb.iam.gserviceaccount.com`. Esa identidad no sale en `gcloud iam service-accounts list`, porque es un service agent administrado por Google, no una cuenta creada por el usuario. Aun así se puede usar en IAM en cuanto el backend bucket existe. Ver [Service agents](https://cloud.google.com/iam/docs/service-agents).

## 10. Configurar Cloud CDN

Cloud CDN guarda las respuestas en los extremos de la red de Google. Para una aplicación Angular estática eso evita volver al bucket en cada visita para `index.html`, el JavaScript, el CSS y los JSON de los niveles.

En este backend bucket CDN quedó habilitado desde la creación. La configuración actual verificada es:

```text
enableCdn: true
cacheMode: FORCE_CACHE_ALL
clientTtl: 3600
defaultTtl: 3600
negativeCaching: false
requestCoalescing: true
serveWhileStale: 0
compressionMode: DISABLED
```

`FORCE_CACHE_ALL` hace falta porque el bucket es privado. Cloud Storage responde a esos objetos con `Cache-Control: private, max-age=0`. Con `CACHE_ALL_STATIC`, Cloud CDN respeta esa cabecera y no cachea el contenido. `FORCE_CACHE_ALL` ignora `private`, `no-store` y `no-cache` del origen y aplica el TTL del backend bucket. Aquí ese TTL es `defaultTtl` y `clientTtl`: 3600 segundos. Por eso las respuestas públicas del balanceador salen con `Cache-Control: public, max-age=3600`.

El comando que dejó esa configuración, partiendo de un backend que todavía tenía `maxTtl`, fue:

```powershell
gcloud compute backend-buckets update super-mario-jungla-cloud-cdn --cache-mode=FORCE_CACHE_ALL --no-max-ttl
```

`maxTtl` solo es válido con `CACHE_ALL_STATIC`. Enviarlo junto a `FORCE_CACHE_ALL` devuelve un error de la API. `--no-max-ttl` está marcado como obsoleto por la CLI, y en este caso fue lo que permitió quitar el valor que ya existía.

Un solo TTL aplica a todo, incluido `index.html`. Los JS y CSS llevan hash, así que pueden quedar en caché sin problema. `index.html` también queda una hora. Después de subir un build nuevo, invalida la página para que los clientes no sigan recibiendo un HTML que apunta a hashes anteriores:

```powershell
gcloud compute url-maps invalidate-cdn-cache super-mario-jungla-balancer --path="/index.html" --global
```

```powershell
gcloud compute url-maps invalidate-cdn-cache super-mario-jungla-balancer --path="/" --global
```

La compresión sigue en `DISABLED`. No se cambió durante el despliegue.

Documentación: [Configurar un backend bucket con Cloud CDN](https://cloud.google.com/cdn/docs/setting-up-cdn-with-bucket).

## 11. Configurar IAM

El bucket es privado, así que el balanceador necesita un permiso explícito para leer objetos durante el llenado de la caché.

La identidad correcta es la del proyecto `176927221192`:

```text
service-176927221192@https-lb.iam.gserviceaccount.com
```

El rol es `roles/storage.objectViewer`: leer y listar objetos, sin permiso de escritura.

```powershell
gcloud storage buckets add-iam-policy-binding gs://super-mario-jungla-bucket --member="serviceAccount:service-176927221192@https-lb.iam.gserviceaccount.com" --role="roles/storage.objectViewer"
```

No uses esta identidad:

```text
service-940038137987@https-lb.iam.gserviceaccount.com
```

El número `940038137987` es el de `super-mario-jungla`, el proyecto donde Compute Engine no estaba habilitado y donde no existe este balanceador. IAM responde `Service account ... does not exist`. El detalle está en [Troubleshooting](#15-troubleshooting).

Comprueba la política:

```powershell
gcloud storage buckets get-iam-policy gs://super-mario-jungla-bucket
```

Tiene que aparecer el service agent con `roles/storage.objectViewer`. No debe aparecer `allUsers` ni `allAuthenticatedUsers`.

Documentación: [IAM de Cloud Storage](https://cloud.google.com/storage/docs/access-control/using-iam-permissions) y la sección de bucket privado en [backend buckets de Cloud CDN](https://cloud.google.com/cdn/docs/setting-up-cdn-with-bucket).

## 12. Crear el Load Balancer

El tipo desplegado es un **Global External Application Load Balancer**. En la forwarding rule eso se ve como `loadBalancingScheme: EXTERNAL_MANAGED`, alcance global y nivel Premium.

No es un Classic Application Load Balancer (`EXTERNAL`) ni un balanceador regional. El regional, además, no admite buckets privados.

La cadena es:

```text
Forwarding rule  (IP pública, puerto 80)
        ↓
Target HTTP proxy
        ↓
URL map
        ↓
Backend bucket
        ↓
Cloud Storage
```

Nombres reales:

| Recurso | Nombre |
| --- | --- |
| URL map | `super-mario-jungla-balancer` |
| Target HTTP proxy | `super-mario-jungla-balancer-target-proxy` |
| Forwarding rule IPv4 | `super-mario-jungla-balancer-forwarding-rule-ipv4` |
| Forwarding rule IPv6 | `super-mario-jungla-balancer-forwarding-rule-ipv6` |

Si partes de cero y el backend bucket del paso 9 ya existe, crea el resto así:

```powershell
gcloud compute url-maps create super-mario-jungla-balancer --default-backend-bucket=super-mario-jungla-cloud-cdn
```

```powershell
gcloud compute target-http-proxies create super-mario-jungla-balancer-target-proxy --url-map=super-mario-jungla-balancer
```

```powershell
gcloud compute forwarding-rules create super-mario-jungla-balancer-forwarding-rule-ipv4 --load-balancing-scheme=EXTERNAL_MANAGED --network-tier=PREMIUM --global --target-http-proxy=super-mario-jungla-balancer-target-proxy --ports=80
```

También hay una forwarding rule IPv6 con el mismo proxy, el mismo esquema y el puerto 80. Para repetirla:

```powershell
gcloud compute forwarding-rules create super-mario-jungla-balancer-forwarding-rule-ipv6 --load-balancing-scheme=EXTERNAL_MANAGED --network-tier=PREMIUM --global --ip-version=IPV6 --target-http-proxy=super-mario-jungla-balancer-target-proxy --ports=80
```

Estos comandos describen la forma verificada. Si los recursos ya existen, `create` fallará porque el nombre está ocupado. En ese caso inspecciónalos. No los borres para volver a crearlos.

Inspecciona el URL map:

```powershell
gcloud compute url-maps list
```

```powershell
gcloud compute url-maps describe super-mario-jungla-balancer
```

El servicio por defecto es `backendBuckets/super-mario-jungla-cloud-cdn`.

La IP pública sale de la forwarding rule. No hay una dirección reservada en `gcloud compute addresses list`: la IP actual está asignada a la regla y se perdería si esa regla se elimina.

```powershell
gcloud compute forwarding-rules list
```

La IPv4 verificada es `136.81.237.137`. La propagación mundial de una forwarding rule nueva puede tardar unos minutos.

Documentación: [Global external Application Load Balancer con buckets](https://cloud.google.com/load-balancing/docs/https/setup-global-ext-https-buckets).

## 13. Configurar el routing de Angular

Angular y el balanceador enrutan cosas distintas.

El router de Angular decide qué componente mostrar cuando el navegador ya ejecutó `index.html`. Vive en `src/app/app.routes.ts` y conoce `/`, `/play`, `/credits` y una redirección comodín hacia `/`.

El URL map decide qué objeto del bucket corresponde a la petición HTTP, antes de que Angular arranque. Cloud Storage no ejecuta el router. Si alguien abre o recarga `http://136.81.237.137/play`, el balanceador busca un objeto llamado `play`. Ese objeto no existe.

La estrategia que quedó aplicada tiene dos prioridades:

1. Si la ruta es un archivo real, se sirve ese objeto. Entran los prefijos `/levels/`, `/assets/` y `/media/`, y las plantillas `/{file}.ext` y `/{dir}/{file}.ext` para las extensiones `js`, `css`, `html`, `ico`, `json`, `png`, `jpg`, `jpeg`, `svg`, `webp`, `gif`, `woff`, `woff2`, `txt`, `map`, `webmanifest` y `wasm`.
2. Cualquier otra ruta coincide con `/**` y se reescribe a `/index.html`.

Así `/play` y `/credits` devuelven el HTML con estado `200`, y `/no-existe.js` sigue siendo `404`. Convertir un JavaScript ausente en `index.html` haría que el navegador intentara ejecutar HTML como script.

Hoy el bucket solo tiene archivos en la raíz y en `levels/`. `/assets/` y `/media/` están en la regla para no reescribirlos el día que existan. `GET /levels/` responde `404`: el prefijo se deja pasar y en esa carpeta no hay `index.html`. El juego no pide esa URL. Pide `/levels/manifest.json` y `/levels/jungla-1.json`.

Una primera importación del URL map falló. La plantilla `/{file}.{ext}` no es válida en este balanceador, y `regexMatch` responde `Matching with a regex is not allowed`. La configuración válida se aplicó después sobre el mismo URL map. El recurso no se recreó.

El host `*` envía cualquier `Host`, incluida la IP pelada, al path matcher `spa`.

Fragmento equivalente al criterio que está en producción:

```yaml
defaultService: https://www.googleapis.com/compute/v1/projects/super-mario-jungla-511018/global/backendBuckets/super-mario-jungla-cloud-cdn
name: super-mario-jungla-balancer
hostRules:
- hosts:
  - '*'
  pathMatcher: spa
pathMatchers:
- name: spa
  defaultService: https://www.googleapis.com/compute/v1/projects/super-mario-jungla-511018/global/backendBuckets/super-mario-jungla-cloud-cdn
  routeRules:
  - priority: 1
    service: https://www.googleapis.com/compute/v1/projects/super-mario-jungla-511018/global/backendBuckets/super-mario-jungla-cloud-cdn
    matchRules:
    - prefixMatch: /levels/
    - prefixMatch: /assets/
    - prefixMatch: /media/
    - pathTemplateMatch: /{file}.js
    - pathTemplateMatch: /{dir}/{file}.js
    - pathTemplateMatch: /{file}.css
    - pathTemplateMatch: /{dir}/{file}.css
    - pathTemplateMatch: /{file}.json
    - pathTemplateMatch: /{dir}/{file}.json
    - pathTemplateMatch: /{file}.html
    - pathTemplateMatch: /{file}.ico
  - priority: 2
    service: https://www.googleapis.com/compute/v1/projects/super-mario-jungla-511018/global/backendBuckets/super-mario-jungla-cloud-cdn
    matchRules:
    - pathTemplateMatch: /**
    routeAction:
      urlRewrite:
        pathTemplateRewrite: /index.html
```

El YAML completo del proyecto repite el mismo par de plantillas para el resto de extensiones de la lista. Puedes verlo con:

```powershell
gcloud compute url-maps describe super-mario-jungla-balancer
```

Para aplicar un archivo YAML exportado o editado:

```powershell
gcloud compute url-maps import super-mario-jungla-balancer --source=url-map.yaml --global
```

Exporta antes el mapa actual si vas a editarlo, y no reutilices un `fingerprint` viejo.

Documentación: [Conceptos de URL maps](https://cloud.google.com/load-balancing/docs/url-map-concepts).

## 14. Verificar el despliegue

Espera unos minutos después de crear o cambiar la forwarding rule o el URL map. Las pruebas de abajo se hicieron contra la IP ya propagada.

En PowerShell usa `curl.exe`. Un `curl -I` manda `HEAD`. Para ver el estado de una navegación real, que es `GET`, usa `-D -` y descarta el cuerpo con `-o NUL`.

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/index.html
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/main-NALWE7G2.js
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/styles-VVP5BIFS.css
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/levels/manifest.json
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/play
```

```powershell
curl.exe -s -D - -o NUL http://136.81.237.137/credits
```

Resultados comprobados:

| Petición | Código | Cuerpo |
| --- | --- | --- |
| `GET /` | 200 | `index.html` |
| `GET /index.html` | 200 | `index.html` |
| `GET /main-NALWE7G2.js` | 200 | JavaScript |
| `GET /styles-VVP5BIFS.css` | 200 | CSS |
| `GET /levels/manifest.json` | 200 | JSON |
| `GET /levels/jungla-1.json` | 200 | JSON |
| `GET /play` y `GET /credits` | 200 | El mismo `index.html` |
| `GET /home`, `/juego`, `/personajes` | 200 | `index.html`. Angular redirige a `/` |
| `GET /no-existe.js` | 404 | XML de objeto inexistente, no HTML |
| `GET /levels/` | 404 | No hay índice dentro de `levels/` |
| `https://136.81.237.137/` | Sin respuesta útil | No hay forwarding rule en el puerto 443 |

Las respuestas correctas del balanceador incluyen `Cache-Control: public, max-age=3600`. Si Cloud CDN ya sirvió la respuesta desde caché, también aparece `Age`.

El bucket sigue privado. Esta petición tiene que devolver `403`:

```powershell
curl.exe -s -D - -o NUL https://storage.googleapis.com/super-mario-jungla-bucket/index.html
```

Los nombres `main-NALWE7G2.js` y `styles-VVP5BIFS.css` son los del build que está en el bucket ahora. Después de otro `ng build`, léelos de `dist\super-mario-jungla\browser` o de `gcloud storage ls`.

## 15. Troubleshooting

### La cuenta de servicio no existe

Síntoma al conceder IAM:

```text
Service account service-940038137987@https-lb.iam.gserviceaccount.com does not exist.
```

`gcloud iam service-accounts list` tampoco la muestra. Eso, por sí solo, no demuestra que la identidad correcta sea inutilizable: los service agents de Google no salen en ese listado.

La causa fue el número de proyecto. `940038137987` pertenece a `super-mario-jungla`. El balanceador está en `super-mario-jungla-511018`, cuyo número es `176927221192`. En el proyecto equivocado Compute Engine ni siquiera estaba habilitado, así que nadie había creado allí un backend bucket ni su service agent.

Comprueba siempre el proyecto activo y su número antes de construir la identidad:

```powershell
gcloud config get-value project
```

```powershell
gcloud projects describe super-mario-jungla-511018 --format="value(projectNumber)"
```

La identidad que debe tener `roles/storage.objectViewer` es:

```text
service-176927221192@https-lb.iam.gserviceaccount.com
```

### AccessDenied al abrir la IP

Si el balanceador responde XML `AccessDenied`, el síntoma verificado fue que el service agent todavía no podía leer el bucket. Concédele `roles/storage.objectViewer` en el bucket, con el número de proyecto del balanceador. No soluciones eso agregando `allUsers`.

### `GET /` lista los archivos

Si el cuerpo es un `ListBucketResult`, falta `mainPageSuffix`. Aplícalo como en el paso 8. El rol `objectViewer` permite listar objetos. Por eso, sin página índice, `/` llegaba a mostrar los nombres de los archivos a través del balanceador.

### `FORCE_CACHE_ALL` rechaza `maxTtl`

```text
max_ttl must be specified with CACHE_ALL_STATIC cache_mode only.
```

Quita `maxTtl` al cambiar el modo:

```powershell
gcloud compute backend-buckets update super-mario-jungla-cloud-cdn --cache-mode=FORCE_CACHE_ALL --no-max-ttl
```

### `/play` responde 404

El objeto `play` no existe y no tiene que existir. Si el URL map todavía no tiene la reescritura a `/index.html`, Cloud Storage responde 404. Revisa `gcloud compute url-maps describe super-mario-jungla-balancer` y espera a que el cambio se propague. Justo después de actualizar el mapa, un `GET` puede seguir en 404 unos minutos y luego pasar a 200.

### El JavaScript nuevo no aparece

`index.html` puede seguir en caché hasta una hora y apuntar a un hash viejo. Invalida `/` y `/index.html` como en el paso 10, y confirma con `gcloud storage ls` que subiste el contenido de `browser` y no la carpeta `browser/` entera.

### PowerShell y `curl`

`curl -I http://136.81.237.137/` en PowerShell puede invocar `Invoke-WebRequest` y fallar o comportarse distinto. Usa `curl.exe`.

## 16. Seguridad

- El bucket permanece privado. Public Access Prevention está en `enforced` y Uniform bucket-level access está activo.
- La política IAM no incluye `allUsers` ni `allAuthenticatedUsers`.
- El único principal añadido para la publicación es `service-176927221192@https-lb.iam.gserviceaccount.com`, con lectura de objetos.
- El visitante habla con el balanceador. La URL `https://storage.googleapis.com/super-mario-jungla-bucket/index.html` responde 403.
- `roles/storage.objectViewer` incluye listar objetos. Con `mainPageSuffix` y las reglas del URL map, `/` ya no devuelve el listado. Un prefijo sin índice, como `/levels/`, responde 404 en lugar de un XML con los nombres.
- La IP `136.81.237.137` no está reservada. Si se borra la forwarding rule IPv4, esa dirección no se conserva.
- El sitio se sirve por HTTP en el puerto 80. No hay certificado ni proxy HTTPS.

## 17. Costos

Esta arquitectura puede generar cargos aunque el tráfico del juego sea bajo. Los conceptos que aplican son:

- el balanceador de aplicaciones externo global;
- Cloud CDN, incluido el llenado de caché y el tráfico de salida;
- el almacenamiento de los objetos y las operaciones de Cloud Storage;
- el tráfico de salida de red.

No se documentan aquí importes. Los precios cambian y dependen de la región, del volumen y de los descuentos de la cuenta. Revísalos en las páginas oficiales y en la calculadora:

- [Calculadora de precios de Google Cloud](https://cloud.google.com/products/calculator)
- [Precios de Cloud Load Balancing](https://cloud.google.com/load-balancing/pricing)
- [Precios de Cloud CDN](https://cloud.google.com/cdn/pricing)
- [Precios de Cloud Storage](https://cloud.google.com/storage/pricing)

Una cuenta nueva puede tener prueba gratuita o créditos. Eso no convierte estos recursos en gratuitos de forma permanente.

## 18. HTTPS y dominio

Esto **no** está implementado. No hay target HTTPS proxy, no hay certificados en `gcloud compute ssl-certificates list` y el puerto 443 no responde.

Cuando se quiera publicar con un dominio:

1. Reservar la IP global como estática, para que no dependa de la forwarding rule efímera. Guía: [Reservar una dirección IP externa estática](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address).
2. Elegir el dominio y crear el registro DNS cuando el certificado lo exija.
3. Crear un certificado administrado por Google. Guía: [Certificados SSL administrados por Google](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs).
4. Crear un target HTTPS proxy apuntando al URL map `super-mario-jungla-balancer`.
5. Crear una forwarding rule `EXTERNAL_MANAGED` en el puerto 443, con esa IP y ese proxy.
6. Publicar en DNS un registro A hacia la IPv4 y un AAAA hacia `2600:1901:0:e7e1::`, o hacia la IPv6 que quede reservada.
7. Redirigir HTTP a HTTPS. Guía: [Configurar la redirección HTTP a HTTPS](https://cloud.google.com/load-balancing/docs/https/setting-up-http-https-redirect).

El certificado administrado pasa a activo cuando el DNS del dominio ya apunta a la IP del balanceador. Hasta entonces HTTPS no debe darse por terminado.

## 19. Comandos útiles

```powershell
gcloud auth list
gcloud config list
gcloud config get-value project
```

```powershell
gcloud projects describe super-mario-jungla-511018 --format="value(projectNumber)"
```

```powershell
gcloud services list --enabled
```

```powershell
gcloud storage ls gs://super-mario-jungla-bucket
gcloud storage ls --recursive gs://super-mario-jungla-bucket
```

```powershell
gcloud storage buckets get-iam-policy gs://super-mario-jungla-bucket
```

```powershell
gcloud compute backend-buckets list
gcloud compute backend-buckets describe super-mario-jungla-cloud-cdn
```

```powershell
gcloud compute url-maps list
gcloud compute url-maps describe super-mario-jungla-balancer
```

```powershell
gcloud compute forwarding-rules list
```

```powershell
gcloud compute target-http-proxies list
gcloud compute target-https-proxies list
gcloud compute ssl-certificates list
gcloud compute addresses list
```

## Firebase Hosting en el repositorio

El repositorio también tiene Firebase Hosting, aparte de la arquitectura de este documento. `.firebaserc` usa el proyecto `super-mario-jungla`. `firebase.json` publica `dist/super-mario-jungla/browser` y reescribe todas las rutas a `/index.html`. Los flujos de `.github/workflows/` despliegan ese hosting al hacer push o al abrir un pull request.

Ese camino no es el balanceador ni el bucket privado descritos arriba. Para repetirlo hace falta la CLI de Firebase (`firebase login`, `firebase deploy`) y el proyecto de Firebase correspondiente. La [consola de Firebase](https://console.firebase.google.com/) muestra la URL de Hosting en **Hosting**.

## Extensiones recomendadas

En el editor conviene instalar:

- **Angular Language Service**, para autocompletado, navegación y diagnóstico en plantillas de Angular.
- **Angular Snippets**, para atajos al escribir componentes, directivas y el resto de la sintaxis de Angular.
- **GitHub Actions**, para ver y editar los flujos de `.github/workflows/`.

## Referencias

- [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install)
- [Instalador de Windows de la gcloud CLI](https://cloud.google.com/sdk/docs/install#windows)
- [Initializing the gcloud CLI](https://cloud.google.com/sdk/docs/initializing)
- [Authenticate for using the gcloud CLI](https://cloud.google.com/docs/authentication/gcloud)
- [Crear buckets](https://cloud.google.com/storage/docs/creating-buckets)
- [IAM de Cloud Storage](https://cloud.google.com/storage/docs/access-control/using-iam-permissions)
- [Uniform bucket-level access](https://cloud.google.com/storage/docs/uniform-bucket-level-access)
- [Public Access Prevention](https://cloud.google.com/storage/docs/public-access-prevention)
- [Alojar un sitio web estático en Cloud Storage](https://cloud.google.com/storage/docs/hosting-static-website)
- [Service agents](https://cloud.google.com/iam/docs/service-agents)
- [Configurar un backend bucket con Cloud CDN](https://cloud.google.com/cdn/docs/setting-up-cdn-with-bucket)
- [Global external Application Load Balancer con buckets de Cloud Storage](https://cloud.google.com/load-balancing/docs/https/setup-global-ext-https-buckets)
- [Conceptos de URL maps](https://cloud.google.com/load-balancing/docs/url-map-concepts)
- [Certificados SSL administrados por Google](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs)
- [Reservar una IP externa estática](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address)
- [Redirección de HTTP a HTTPS](https://cloud.google.com/load-balancing/docs/https/setting-up-http-https-redirect)
- [Precios de Cloud Load Balancing](https://cloud.google.com/load-balancing/pricing)
- [Precios de Cloud CDN](https://cloud.google.com/cdn/pricing)
- [Precios de Cloud Storage](https://cloud.google.com/storage/pricing)
- [Calculadora de precios de Google Cloud](https://cloud.google.com/products/calculator)
- [Compatibilidad de versiones de Angular](https://angular.dev/reference/versions)
