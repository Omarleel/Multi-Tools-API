
# Multi-Tools API 📄🚀

Una API robusta y escalable construida con Node.js, Express y TypeScript. Su propósito principal es ofrecer un conjunto de herramientas avanzadas para la manipulación y generación de documentos. 

Actualmente, el motor principal utiliza **Playwright** para renderizar HTML a PDF con soporte para paginación semántica, optimización inteligente de layouts y control total sobre los márgenes y tamaños de página.

## ✨ Características Actuales

* **Conversión HTML a PDF de Alta Fidelidad:** Renderiza CSS moderno, flexbox, grid y fuentes externas usando el motor de Chromium.
* **Smart Layout Optimizer:** Analiza y ajusta dinámicamente el contenido para evitar cortes antiestéticos en tablas o contenedores entre saltos de página.
* **Control Total de Impresión:** Soporte para tamaños estándar (A4, Letter, etc.), modo *landscape*, márgenes personalizados y escalas.
* **Arquitectura Limpia:** Código estructurado en capas (Domain, Application, Infrastructure) preparado para escalar y soportar nuevas herramientas fácilmente.

## 🗺️ Roadmap (Próximamente)

Este proyecto está diseñado para crecer. Las futuras actualizaciones incluirán:
- [ ] Generación de PDF desde URLs públicas.
- [ ] Encriptación y protección con contraseña.
- [ ] Unir varios PDF en uno solo.
- [ ] Compresión y optimización de archivos PDF generados.

## 🚀 Instalación y Despliegue

### Requisitos previos
* Node.js >= 20.0.0
* Yarn, npm o pnpm

### Configuración local

1. Clona el repositorio e instala las dependencias:
   ```bash
   yarn install

```

2. Inicia el servidor en modo desarrollo:
```bash
yarn dev

```


3. (Opcional) Compila para producción:
```bash
yarn build
yarn start

```



El servidor estará escuchando por defecto en `http://localhost:3000`.

## 📖 Referencia de la API

### 1. Health Check

Verifica que el servicio esté en línea.

* **Ruta:** `GET /health`
* **Respuesta:** `{ "ok": true }`

### 2. Convertir HTML a PDF

Procesa un archivo HTML y retorna el buffer del documento PDF generado.

* **Ruta:** `POST /api/pdf`
* **Content-Type:** `multipart/form-data`

#### Parámetros soportados (Form Data):

| Campo | Tipo | Requerido | Valor por defecto | Descripción |
| --- | --- | --- | --- | --- |
| `file` | Archivo | **Sí** | - | Archivo `.html` o `.htm` (Máx 10 MB). |
| `printBackground` | Boolean | No | `true` | Imprime los colores y gráficos de fondo. |
| `pageSize` | String | No | - | Tamaño de la página (ej. `A4`, `Letter`, `Legal`). |
| `landscape` | Boolean | No | `false` | Orientación horizontal. |
| `margin` | String | No | - | Margen global (ej. `10mm`, `0.5in`, `20px`). |
| `marginTop` | String | No | - | Margen superior específico. |
| `marginBottom` | String | No | - | Margen inferior específico. |
| `marginLeft` | String | No | - | Margen izquierdo específico. |
| `marginRight` | String | No | - | Margen derecho específico. |
| `smart` | Boolean | No | `false` | Activa la paginación semántica y optimización del DOM. |
| `preferCssPageSize` | Boolean | No | `false` | Usa el tamaño definido en el CSS `@page` si existe. |
| `scale` | String | No | `1` | Escala del renderizado de la página. |
| `waitFor` | String | No | - | Selectores o eventos a esperar antes de imprimir (ej. `networkidle`). |

#### Ejemplo de uso (cURL)

```bash
curl -X POST http://localhost:3000/api/pdf \
  -F "file=@./mi_reporte.html" \
  -F "pageSize=A4" \
  -F "smart=true" \
  -F "landscape=false" \
  -F "margin=15mm" \
  --output reporte_generado.pdf

```
