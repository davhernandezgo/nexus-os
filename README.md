# 🌌 NexusOS — Personal & Couple LifeOS

> **El primer sistema operativo de vida ultra-rápido que fusiona lo mejor de TickTick, Notion y Obsidian con un espacio colaborativo exclusivo para parejas.**

NexusOS está diseñado con una arquitectura **Offline-First**, **Privacidad Criptográfica/Aislamiento por Bóvedas**, **Diseño Dark Mode Ultra-Pulido** (inspirado en Linear y Raycast) y capacidades completas de **PWA Nativa**.

---

## 🌟 Los 4 Pilares de NexusOS

```
┌────────────────────────────────────────────────────────────────────────┐
│                                NexusOS                                 │
├───────────────────┬────────────────────┬─────────────────┬─────────────┤
│   TickTick Pro+   │    Notion Core     │  Obsidian Hub   │ Couple Hub  │
│                   │                    │                 │             │
│ • NLP Quick-Add   │ • Páginas y Bloques│ • [[WikiLinks]] │ • Gastos /  │
│ • Eisenhower P1-P4│ • Comandos /slash  │ • Backlinks     │   Split 50% │
│ • Triple Auditoría│ • 4 Plantillas Pro │ • Daily Notes   │ • Viajes    │
│ • Pomodoro & Audio│ • Inspector Lateral│ • Grafo 2D      │ • Pizarra   │
│ • Hábitos + Freeze│ • Custom Properties│   Fuerzas       │ • Hábitos 💑│
└───────────────────┴────────────────────┴─────────────────┴─────────────┘
```

1. **TickTick Pro+**:
   - **Smart NLP Quick-Add**: Escribe `Optimizar query en Go mañana 18:00 !P1 #backend ~60m @privado` y detecta en vivo chips de prioridad, etiquetas, fechas, estimación y contexto.
   - **Triple Auditoría**: `dueDate` vs `completedAt` (calcula badge automático: *Entregado a tiempo*, *Con retraso*, o *Vencida*) + `estimatedMinutes` vs `actualMinutes` acumulados por el cronómetro.
   - **Hábitos con Escudo de Racha (Streak Freeze 🧊)** y Heatmap anual estilo GitHub.
   - **Cronómetro Global Multi-Modo (Stopwatch + Pomodoro)** con generador sintético de Ruido Marrón (*Brown Noise*) vía Web Audio API nativo (100% offline).

2. **Notion Core**:
   - Cada tarea y **cada subtarea individual** es una Página completa con base de datos de propiedades.
   - **Inspector lateral estilo Notion** con soporte de bloques: Títulos, Listas, Checkboxes, Bloques de código con sintaxis, Callouts, Divisores, `/timestamp` y `/wikilink`.
   - **Plantillas en 1-Clic**: *Bitácora de Ingeniería*, *Reunión / Acuerdos*, *Proyecto de Pareja*, *Checklist de Viaje*.

3. **Obsidian Hub**:
   - Enlaces bidireccionales `[[WikiLinks]]` con autocompletado y detección automática de **Backlinks** al pie de cada página.
   - **Daily Note** (Nota rápida del día) para vaciar pensamientos y enlazar tareas del día.
   - **Grafo de Conocimiento 2D Interactivo** con simulación de fuerzas físicas en tiempo real, zoom, arrastre y filtros por visibilidad y tipo.

4. **El Plus Exclusivo — Hub de Pareja (`💑 Couple Space`)**:
   - **Bóveda 100% Privada**: Cada usuario mantiene su bóveda personal completamente aislada (proyectos, notas, tareas privadas). Ninguno tiene acceso a lo privado del otro.
   - **Espacio de Pareja Compartido**: Tareas conjuntas, compras y proyectos del hogar en tiempo real.
   - **Control de Gastos y Split 50/50**: Registro de pagos, visualización de aportes y cálculo automático de balances.
   - **Planificador de Viajes**: Cuenta regresiva en vivo, presupuesto e itinerario/checklist.
   - **Pizarra Rápida Sincronizada**: Notas y acuerdos de convivencia colaborativos.

---

## 🚀 Quick Start (Modo Local Completo)

NexusOS funciona inmediatamente en modo local sin requerir servicios externos ni bases de datos configuradas.

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/davhernandezgo/nexus-os.git
cd nexus-os
npm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173`.

### 3. Autenticación y Cuentas
Puedes iniciar sesión directamente creando tu cuenta con correo electrónico o autenticación con Google (vía Supabase Auth), o utilizar el entorno local-first para comenzar de inmediato.

---

## 🔒 Arquitectura de Privacidad y Contextos

En el Header superior encontrarás el selector de 3 modos de contexto:
- `🔒 Mi Bóveda`: Filtra estrictamente tus ítems personales (`owner = yo` y `visibility = 'private'`).
- `💑 Hub Pareja`: Muestra únicamente los proyectos, tareas, hábitos y gastos compartidos (`visibility = 'couple'`).
- `⚡ Unificado`: Combina tus responsabilidades privadas con las de pareja para organizar tu agenda diaria sin colisiones.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS v4 con variables semánticas personalizadas
- **Estado Global**: Zustand con middleware `persist` (Local-First y preparado para sincronización)
- **Animaciones**: `framer-motion` (transiciones suaves en drawers, modales y tableros)
- **Iconografía**: `lucide-react`
- **Utilidades de Fecha**: `date-fns`
- **Identificadores**: `uuid`
- **PWA**: Service Worker con estrategia de caché inteligente y soporte de notificaciones del SO

---

## ☁️ Guía de Despliegue en Producción (Gratuito)

### Despliegue en Vercel

1. Sube tu código a un repositorio de GitHub (ej. `github.com/tu-usuario/nexus-os`).
2. Ve a [Vercel](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New Project"** e importa el repositorio de NexusOS.
4. En **Framework Preset**, Vercel detectará automáticamente **Vite**.
5. Directorio raíz: Si el repositorio contiene directamente la carpeta del proyecto, déjalo por defecto; si está en una subcarpeta, selecciona `nexus-os`.
6. Haz clic en **"Deploy"**. En ~1 minuto tendrás tu PWA en vivo con URL SSL (`https://nexus-os.vercel.app`).

---

## 🐘 Configuración Opcional con Supabase (Backend Realtime & RLS)

Si deseas sincronización en la nube entre múltiples dispositivos y WebSockets en tiempo real:

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** en tu panel de Supabase.
3. Abre el archivo local `supabase/schema.sql`, copia todo su contenido y pégalo en el editor.
4. Presiona **Run**. Esto creará:
   - Todas las tablas (`tasks`, `habits`, `expenses`, `trip_plans`, `shared_notes`, `daily_notes`, `notifications`).
   - Políticas de seguridad **Row Level Security (RLS)** que garantizan a nivel de base de datos el aislamiento estricto entre cuentas y privacidad de cada usuario.
   - Publicaciones para **Supabase Realtime WebSockets**.
5. Copia tus credenciales de Supabase (Project URL y `anon` public key) en un archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
6. En Vercel, agrega estas variables en **Settings > Environment Variables**.

---

## 📱 Instalación como PWA Nativa

- **Desktop (Chrome / Edge / Brave)**: Haz clic en el ícono de instalación en la barra de direcciones o presiona `Instalar NexusOS`.
- **iOS (Safari)**: Presiona el botón de compartir y selecciona **"Agregar a pantalla de inicio"**.
- **Android (Chrome)**: Toca el menú de opciones (tres puntos) y selecciona **"Instalar aplicación"**.

---

## ⌨️ Atajos de Teclado Globales

- `Cmd + K` o `Ctrl + K`: Abre la Paleta de Comandos universal (búsqueda de tareas, navegación rápida, inicio de cronómetro y hábitos).
- `Enter` en Quick-Add: Guarda y parsea automáticamente una nueva tarea con NLP.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ para organizar la vida personal, profesional y de pareja con velocidad extrema.
