// ═══════════════════════════════════════════════════════════════════
// NexusOS — Rich Seed Data for David, Cami & Couple Hub
// ═══════════════════════════════════════════════════════════════════
import type {
  Task, Project, Habit, Expense, TripPlan, SharedNote,
  DailyNote, NexusNotification, Tag, HabitCompletion,
} from '../types/nexus';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function generateCompletions(daysBack: number, rate: number): HabitCompletion[] {
  const completions: HabitCompletion[] = [];
  for (let i = daysBack; i >= 0; i--) {
    if (Math.random() < rate) {
      completions.push({
        date: dateStr(-i),
        completed: true,
        minutesLogged: Math.floor(Math.random() * 40) + 15,
      });
    }
  }
  return completions;
}

export function seedData() {
  // ═══════ TAGS ═══════
  const tags: Tag[] = [
    { id: 'tag-go', name: 'Go', color: '#00ADD8', owner: 'david', visibility: 'private' },
    { id: 'tag-backend', name: 'backend', color: '#6366f1', owner: 'david', visibility: 'private' },
    { id: 'tag-aws', name: 'AWS', color: '#FF9900', owner: 'david', visibility: 'private' },
    { id: 'tag-react', name: 'React', color: '#61DAFB', owner: 'david', visibility: 'private' },
    { id: 'tag-crypto', name: 'crypto', color: '#F7931A', owner: 'david', visibility: 'private' },
    { id: 'tag-bienestar', name: 'bienestar', color: '#10b981', owner: 'cami', visibility: 'private' },
    { id: 'tag-laboral', name: 'laboral', color: '#8b5cf6', owner: 'cami', visibility: 'private' },
    { id: 'tag-nutricion', name: 'nutrición', color: '#f59e0b', owner: 'cami', visibility: 'private' },
    { id: 'tag-hogar', name: 'hogar', color: '#ec4899', owner: 'david', visibility: 'couple' },
    { id: 'tag-finanzas', name: 'finanzas', color: '#22c55e', owner: 'david', visibility: 'couple' },
    { id: 'tag-viaje', name: 'viaje', color: '#06b6d4', owner: 'david', visibility: 'couple' },
  ];

  // ═══════ PROJECTS ═══════
  const projects: Project[] = [
    // David Private
    {
      id: 'proj-contacripto', name: 'SaaS ContaCripto', emoji: '₿', color: '#F7931A',
      owner: 'david', visibility: 'private',
      description: 'Plataforma de contabilidad cripto para freelancers y empresas',
      taskIds: ['task-d1', 'task-d2', 'task-d3'], createdAt: daysAgo(60),
    },
    {
      id: 'proj-victored', name: 'SaaS VictoRed', emoji: '🔴', color: '#EF4444',
      owner: 'david', visibility: 'private',
      description: 'Red social de productividad y metas gamificadas',
      taskIds: ['task-d4', 'task-d5'], createdAt: daysAgo(45),
    },
    {
      id: 'proj-go-micro', name: 'Go Microservices', emoji: '🐹', color: '#00ADD8',
      owner: 'david', visibility: 'private',
      description: 'Portafolio de microservicios en Go con gRPC y Kafka',
      taskIds: ['task-d6', 'task-d7'], createdAt: daysAgo(30),
    },
    {
      id: 'proj-aws-cloud', name: 'AWS Cloud Architecture', emoji: '☁️', color: '#FF9900',
      owner: 'david', visibility: 'private',
      description: 'Certificación AWS Solutions Architect + Labs prácticos',
      taskIds: ['task-d8'], createdAt: daysAgo(20),
    },
    // Cami Private
    {
      id: 'proj-cami-work', name: 'Proyecto Laboral Q4', emoji: '💼', color: '#8b5cf6',
      owner: 'cami', visibility: 'private',
      description: 'Entregables del trimestre y presentaciones clave',
      taskIds: ['task-c1', 'task-c2'], createdAt: daysAgo(40),
    },
    {
      id: 'proj-cami-wellness', name: 'Bienestar & Salud', emoji: '🧘', color: '#10b981',
      owner: 'cami', visibility: 'private',
      description: 'Plan integral de bienestar físico y mental',
      taskIds: ['task-c3', 'task-c4'], createdAt: daysAgo(35),
    },
    {
      id: 'proj-cami-side', name: 'Emprendimiento Creativo', emoji: '🎨', color: '#f59e0b',
      owner: 'cami', visibility: 'private',
      description: 'Proyecto de diseño y contenido digital',
      taskIds: ['task-c5'], createdAt: daysAgo(25),
    },
    // Couple
    {
      id: 'proj-eskala', name: 'Apartamento Eskala', emoji: '🏠', color: '#ec4899',
      owner: 'david', visibility: 'couple',
      description: 'Seguimiento de pagos, adecuaciones y mudanza del apartamento',
      taskIds: ['task-cp1', 'task-cp2', 'task-cp3'], createdAt: daysAgo(90),
    },
    {
      id: 'proj-viaje', name: 'Próximo Viaje', emoji: '✈️', color: '#06b6d4',
      owner: 'david', visibility: 'couple',
      description: 'Planificación del viaje en pareja',
      taskIds: ['task-cp4', 'task-cp5'], createdAt: daysAgo(15),
    },
  ];

  // ═══════ TASKS ═══════
  const tasks: Task[] = [
    // ── David Private Tasks ──
    {
      id: 'task-d1', title: 'Optimizar query de balance en Go', description: 'La consulta de balances tarda >2s en cuentas con +1000 txs',
      status: 'in_progress', priority: 'P1', owner: 'david', visibility: 'private',
      projectId: 'proj-contacripto', subtaskIds: ['task-d1-s1', 'task-d1-s2'],
      tags: ['Go', 'backend'], category: 'Desarrollo',
      createdAt: daysAgo(5), dueDate: daysFromNow(1), estimatedMinutes: 120, actualMinutes: 45,
      pageContent: [
        { id: 'b1', type: 'heading2', content: '🔍 Contexto del Bug' },
        { id: 'b2', type: 'paragraph', content: 'El endpoint GET /api/v1/balance tarda >2s cuando la cuenta tiene más de 1000 transacciones. El profiler muestra N+1 queries en el ORM.' },
        { id: 'b3', type: 'heading2', content: '🛠️ Plan de Acción' },
        { id: 'b4', type: 'todo', content: 'Agregar índice compuesto en (account_id, created_at)', checked: true },
        { id: 'b5', type: 'todo', content: 'Refactorizar a single query con JOIN + aggregation', checked: false },
        { id: 'b6', type: 'code', content: 'SELECT account_id, SUM(amount) as balance\nFROM transactions\nWHERE account_id = $1\nGROUP BY account_id;', language: 'sql' },
      ],
      wikiLinks: ['task-d1-s1', 'task-d6'],
    },
    // Subtasks de task-d1
    {
      id: 'task-d1-s1', title: 'Crear índice compuesto en PostgreSQL', description: '',
      status: 'done', priority: 'P1', owner: 'david', visibility: 'private',
      parentTaskId: 'task-d1', subtaskIds: [],
      tags: ['backend'], category: 'Desarrollo',
      createdAt: daysAgo(4), dueDate: daysAgo(2), completedAt: daysAgo(3),
      estimatedMinutes: 30, actualMinutes: 22,
      pageContent: [
        { id: 'bs1', type: 'heading2', content: '✅ Solución implementada' },
        { id: 'bs2', type: 'code', content: 'CREATE INDEX CONCURRENTLY idx_tx_account_date\nON transactions (account_id, created_at DESC);', language: 'sql' },
        { id: 'bs3', type: 'paragraph', content: 'Índice creado sin downtime usando CONCURRENTLY. Verificado con EXPLAIN ANALYZE que el query pasó de Seq Scan → Index Scan.' },
        { id: 'bs4', type: 'timestamp', content: new Date(Date.now() - 3 * 86400000).toISOString() },
      ],
      wikiLinks: ['task-d1'],
    },
    {
      id: 'task-d1-s2', title: 'Refactorizar ORM a raw query optimizado', description: '',
      status: 'todo', priority: 'P1', owner: 'david', visibility: 'private',
      parentTaskId: 'task-d1', subtaskIds: [],
      tags: ['Go', 'backend'], category: 'Desarrollo',
      createdAt: daysAgo(4), dueDate: daysFromNow(1), estimatedMinutes: 60, actualMinutes: 0,
      pageContent: [
        { id: 'bs5', type: 'paragraph', content: 'Reemplazar las llamadas al ORM por una consulta raw SQL con el nuevo índice.' },
      ],
      wikiLinks: ['task-d1'],
    },
    {
      id: 'task-d2', title: 'Diseñar dashboard de reportes fiscales', description: 'UI para generar reportes de impuestos por periodo',
      status: 'todo', priority: 'P2', owner: 'david', visibility: 'private',
      projectId: 'proj-contacripto', subtaskIds: [],
      tags: ['React', 'crypto'], category: 'Diseño',
      createdAt: daysAgo(10), dueDate: daysFromNow(7), estimatedMinutes: 180, actualMinutes: 0,
      pageContent: [
        { id: 'b7', type: 'paragraph', content: 'Pantalla con selector de periodo fiscal, tabla de transacciones categorizadas y botón de exportar PDF.' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-d3', title: 'Integrar API de Binance para importar transacciones', description: '',
      status: 'todo', priority: 'P2', owner: 'david', visibility: 'private',
      projectId: 'proj-contacripto', subtaskIds: [],
      tags: ['Go', 'crypto'], category: 'Desarrollo',
      createdAt: daysAgo(8), dueDate: daysFromNow(14), estimatedMinutes: 240, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-d4', title: 'Implementar sistema de gamificación con XP', description: 'Puntos de experiencia por completar metas semanales',
      status: 'in_progress', priority: 'P2', owner: 'david', visibility: 'private',
      projectId: 'proj-victored', subtaskIds: [],
      tags: ['React'], category: 'Desarrollo',
      createdAt: daysAgo(12), dueDate: daysFromNow(5), estimatedMinutes: 300, actualMinutes: 90,
      pageContent: [
        { id: 'b8', type: 'callout', content: 'Usar sistema de niveles exponencial: Level N requiere N^2 * 100 XP', calloutType: 'info' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-d5', title: 'Arquitectura de WebSocket para sync en tiempo real', description: '',
      status: 'todo', priority: 'P3', owner: 'david', visibility: 'private',
      projectId: 'proj-victored', subtaskIds: [],
      tags: ['backend'], category: 'Arquitectura',
      createdAt: daysAgo(7), dueDate: daysFromNow(21), estimatedMinutes: 360, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-d6', title: 'Servicio de autenticación con JWT + refresh tokens', description: 'Auth microservice con Go + Redis',
      status: 'done', priority: 'P1', owner: 'david', visibility: 'private',
      projectId: 'proj-go-micro', subtaskIds: [],
      tags: ['Go', 'backend'], category: 'Desarrollo',
      createdAt: daysAgo(20), dueDate: daysAgo(5), completedAt: daysAgo(6),
      estimatedMinutes: 480, actualMinutes: 420,
      pageContent: [
        { id: 'b9', type: 'heading2', content: '✅ Completado' },
        { id: 'b10', type: 'paragraph', content: 'Implementado con gin-gonic, middleware JWT validando RS256 y refresh token rotativo almacenado en Redis con TTL de 7 días.' },
      ],
      wikiLinks: ['task-d1'],
    },
    {
      id: 'task-d7', title: 'Configurar gRPC entre servicios de inventario y pagos', description: '',
      status: 'todo', priority: 'P3', owner: 'david', visibility: 'private',
      projectId: 'proj-go-micro', subtaskIds: [],
      tags: ['Go', 'backend'], category: 'Desarrollo',
      createdAt: daysAgo(5), dueDate: daysFromNow(30), estimatedMinutes: 300, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-d8', title: 'Lab: Desplegar VPC + EC2 + RDS con Terraform', description: 'Práctica de arquitectura 3-tier en AWS',
      status: 'in_progress', priority: 'P2', owner: 'david', visibility: 'private',
      projectId: 'proj-aws-cloud', subtaskIds: ['task-d8-s1'],
      tags: ['AWS'], category: 'Cloud',
      createdAt: daysAgo(10), dueDate: daysFromNow(3), estimatedMinutes: 180, actualMinutes: 60,
      pageContent: [
        { id: 'b11', type: 'heading2', content: '📋 Arquitectura objetivo' },
        { id: 'b12', type: 'paragraph', content: 'VPC con 2 subnets públicas + 2 privadas, ALB → EC2 Auto Scaling Group → RDS PostgreSQL Multi-AZ.' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-d8-s1', title: 'Escribir módulo Terraform para VPC', description: '',
      status: 'done', priority: 'P2', owner: 'david', visibility: 'private',
      parentTaskId: 'task-d8', subtaskIds: [],
      tags: ['AWS'], category: 'Cloud',
      createdAt: daysAgo(8), dueDate: daysAgo(3), completedAt: daysAgo(4),
      estimatedMinutes: 60, actualMinutes: 55,
      pageContent: [
        { id: 'bs6', type: 'code', content: 'module "vpc" {\n  source  = "terraform-aws-modules/vpc/aws"\n  version = "5.1.0"\n  cidr    = "10.0.0.0/16"\n}', language: 'hcl' },
      ],
      wikiLinks: ['task-d8'],
    },

    // ── Cami Private Tasks ──
    {
      id: 'task-c1', title: 'Preparar presentación Q4 para directivos', description: 'Presentación de resultados y roadmap Q1',
      status: 'in_progress', priority: 'P1', owner: 'cami', visibility: 'private',
      projectId: 'proj-cami-work', subtaskIds: [],
      tags: ['laboral'], category: 'Trabajo',
      createdAt: daysAgo(7), dueDate: daysFromNow(2), estimatedMinutes: 120, actualMinutes: 40,
      pageContent: [
        { id: 'c1', type: 'heading2', content: '📊 Estructura de la presentación' },
        { id: 'c2', type: 'todo', content: 'Slide 1-3: Resumen ejecutivo con KPIs', checked: true },
        { id: 'c3', type: 'todo', content: 'Slide 4-8: Detalle por área', checked: false },
        { id: 'c4', type: 'todo', content: 'Slide 9-10: Roadmap Q1 con milestones', checked: false },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-c2', title: 'Revisar contratos de proveedores nuevos', description: '',
      status: 'todo', priority: 'P2', owner: 'cami', visibility: 'private',
      projectId: 'proj-cami-work', subtaskIds: [],
      tags: ['laboral'], category: 'Trabajo',
      createdAt: daysAgo(3), dueDate: daysFromNow(5), estimatedMinutes: 90, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-c3', title: 'Investigar plan nutricional personalizado', description: 'Consulta con nutricionista + meal prep semanal',
      status: 'in_progress', priority: 'P2', owner: 'cami', visibility: 'private',
      projectId: 'proj-cami-wellness', subtaskIds: [],
      tags: ['bienestar', 'nutrición'], category: 'Salud',
      createdAt: daysAgo(14), dueDate: daysFromNow(7), estimatedMinutes: 60, actualMinutes: 20,
      pageContent: [
        { id: 'c5', type: 'callout', content: 'Cita con nutricionista agendada para el jueves 10am', calloutType: 'info' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-c4', title: 'Completar reto de 30 días de yoga', description: '',
      status: 'in_progress', priority: 'P3', owner: 'cami', visibility: 'private',
      projectId: 'proj-cami-wellness', subtaskIds: [],
      tags: ['bienestar'], category: 'Salud',
      createdAt: daysAgo(18), dueDate: daysFromNow(12), estimatedMinutes: 900, actualMinutes: 540,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-c5', title: 'Diseñar identidad visual para marca personal', description: 'Logo, paleta de colores y tipografía',
      status: 'todo', priority: 'P3', owner: 'cami', visibility: 'private',
      projectId: 'proj-cami-side', subtaskIds: [],
      tags: [], category: 'Creativo',
      createdAt: daysAgo(5), dueDate: daysFromNow(20), estimatedMinutes: 240, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },

    // ── Couple Tasks ──
    {
      id: 'task-cp1', title: 'Pagar cuota mensual Eskala - Octubre', description: 'Transferencia a la fiduciaria',
      status: 'done', priority: 'P1', owner: 'david', visibility: 'couple',
      projectId: 'proj-eskala', subtaskIds: [],
      tags: ['hogar', 'finanzas'], category: 'Hogar',
      createdAt: daysAgo(10), dueDate: daysAgo(2), completedAt: daysAgo(3),
      estimatedMinutes: 15, actualMinutes: 10,
      pageContent: [
        { id: 'cp1', type: 'paragraph', content: 'Transferencia realizada por PSE. Comprobante guardado en Google Drive.' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-cp2', title: 'Elegir diseño de cocina integral', description: 'Comparar 3 cotizaciones de proveedores',
      status: 'in_progress', priority: 'P2', owner: 'cami', visibility: 'couple',
      projectId: 'proj-eskala', subtaskIds: ['task-cp2-s1', 'task-cp2-s2'],
      tags: ['hogar'], category: 'Hogar',
      createdAt: daysAgo(8), dueDate: daysFromNow(10), estimatedMinutes: 120, actualMinutes: 30,
      pageContent: [
        { id: 'cp2', type: 'heading2', content: '🏗️ Opciones de cocina' },
        { id: 'cp3', type: 'todo', content: 'Proveedor A - Madecentro: $8.500.000', checked: true },
        { id: 'cp4', type: 'todo', content: 'Proveedor B - RTA: $7.200.000', checked: true },
        { id: 'cp5', type: 'todo', content: 'Proveedor C - Carpintero independiente: $6.800.000', checked: false },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-cp2-s1', title: 'Visitar showroom de Madecentro', description: '',
      status: 'done', priority: 'P2', owner: 'cami', visibility: 'couple',
      parentTaskId: 'task-cp2', subtaskIds: [],
      tags: ['hogar'], category: 'Hogar',
      createdAt: daysAgo(6), dueDate: daysAgo(1), completedAt: daysAgo(2),
      estimatedMinutes: 60, actualMinutes: 90,
      pageContent: [
        { id: 'cps1', type: 'paragraph', content: 'Visitamos el showroom. La opción en fórmica blanca con mesón en cuarzo se ve muy bien. Piden 60% de anticipo.' },
      ],
      wikiLinks: ['task-cp2'],
    },
    {
      id: 'task-cp2-s2', title: 'Pedir cotización final al carpintero', description: '',
      status: 'todo', priority: 'P2', owner: 'david', visibility: 'couple',
      parentTaskId: 'task-cp2', subtaskIds: [],
      tags: ['hogar'], category: 'Hogar',
      createdAt: daysAgo(3), dueDate: daysFromNow(4), estimatedMinutes: 30, actualMinutes: 0,
      pageContent: [],
      wikiLinks: ['task-cp2'],
    },
    {
      id: 'task-cp3', title: 'Comprar electrodomésticos básicos', description: 'Nevera, lavadora y estufa',
      status: 'todo', priority: 'P2', owner: 'david', visibility: 'couple',
      projectId: 'proj-eskala', subtaskIds: [],
      tags: ['hogar', 'finanzas'], category: 'Hogar',
      createdAt: daysAgo(5), dueDate: daysFromNow(30), estimatedMinutes: 120, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
    {
      id: 'task-cp4', title: 'Reservar vuelos para viaje en diciembre', description: '',
      status: 'todo', priority: 'P1', owner: 'david', visibility: 'couple',
      projectId: 'proj-viaje', subtaskIds: [],
      tags: ['viaje'], category: 'Viaje',
      createdAt: daysAgo(3), dueDate: daysFromNow(14), estimatedMinutes: 30, actualMinutes: 0,
      pageContent: [
        { id: 'cp6', type: 'callout', content: 'Revisar precios en Skyscanner y Google Flights. Preferencia: vuelo directo.', calloutType: 'info' },
      ],
      wikiLinks: [],
    },
    {
      id: 'task-cp5', title: 'Armar checklist de equipaje para viaje', description: '',
      status: 'todo', priority: 'P3', owner: 'cami', visibility: 'couple',
      projectId: 'proj-viaje', subtaskIds: [],
      tags: ['viaje'], category: 'Viaje',
      createdAt: daysAgo(2), dueDate: daysFromNow(45), estimatedMinutes: 20, actualMinutes: 0,
      pageContent: [], wikiLinks: [],
    },
  ];

  // ═══════ HABITS ═══════
  const habits: Habit[] = [
    // David Private
    {
      id: 'habit-d1', name: 'Deep Work', icon: '🧠', color: '#6366f1',
      owner: 'david', visibility: 'private',
      frequencyPerWeek: 6, targetMinutes: 120, reminderTime: '08:00',
      completions: generateCompletions(365, 0.75), streakFreezes: [dateStr(-14), dateStr(-45), dateStr(-110)],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-d2', name: 'LeetCode / Algoritmos', icon: '⚡', color: '#f59e0b',
      owner: 'david', visibility: 'private',
      frequencyPerWeek: 5, targetMinutes: 45, reminderTime: '07:00',
      completions: generateCompletions(365, 0.65), streakFreezes: [dateStr(-30)],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-d3', name: 'Estudio AWS / Cloud', icon: '☁️', color: '#FF9900',
      owner: 'david', visibility: 'private',
      frequencyPerWeek: 4, targetMinutes: 60, reminderTime: '20:00',
      completions: generateCompletions(365, 0.6), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-d4', name: 'Ejercicio / Gym', icon: '💪', color: '#10b981',
      owner: 'david', visibility: 'private',
      frequencyPerWeek: 5, targetMinutes: 60, reminderTime: '06:00',
      completions: generateCompletions(365, 0.7), streakFreezes: [dateStr(-7), dateStr(-21), dateStr(-90)],
      createdAt: daysAgo(365),
    },
    // Cami Private
    {
      id: 'habit-c1', name: 'Yoga Matutino', icon: '🧘', color: '#ec4899',
      owner: 'cami', visibility: 'private',
      frequencyPerWeek: 5, targetMinutes: 30, reminderTime: '06:30',
      completions: generateCompletions(365, 0.7), streakFreezes: [dateStr(-15)],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-c2', name: 'Lectura', icon: '📚', color: '#8b5cf6',
      owner: 'cami', visibility: 'private',
      frequencyPerWeek: 7, targetMinutes: 30, reminderTime: '21:00',
      completions: generateCompletions(365, 0.8), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-c3', name: 'Journaling', icon: '✍️', color: '#f59e0b',
      owner: 'cami', visibility: 'private',
      frequencyPerWeek: 7, targetMinutes: 15, reminderTime: '22:00',
      completions: generateCompletions(365, 0.85), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-c4', name: 'Skincare Routine', icon: '✨', color: '#06b6d4',
      owner: 'cami', visibility: 'private',
      frequencyPerWeek: 7, targetMinutes: 10, reminderTime: '22:30',
      completions: generateCompletions(365, 0.9), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    // Couple
    {
      id: 'habit-cp1', name: 'Cena sin pantallas', icon: '🍽️', color: '#ec4899',
      owner: 'david', visibility: 'couple',
      frequencyPerWeek: 5, targetMinutes: 45,
      completions: generateCompletions(365, 0.6), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-cp2', name: 'Caminata en pareja', icon: '🚶‍♂️', color: '#10b981',
      owner: 'cami', visibility: 'couple',
      frequencyPerWeek: 3, targetMinutes: 40,
      completions: generateCompletions(365, 0.55), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    {
      id: 'habit-cp3', name: 'Revisar presupuesto semanal', icon: '💰', color: '#22c55e',
      owner: 'david', visibility: 'couple',
      frequencyPerWeek: 1, targetMinutes: 20, reminderTime: '20:00',
      completions: generateCompletions(365, 0.7), streakFreezes: [],
      createdAt: daysAgo(365),
    },
    // Numeric & Non-time Habits (Water, Steps, Pages, Push-ups)
    {
      id: 'habit-water', name: 'Beber 8 vasos de agua', icon: '💧', color: '#06b6d4',
      owner: 'david', visibility: 'couple',
      goalType: 'numeric', targetValue: 8, unit: 'vasos',
      frequencyPerWeek: 7, reminderTime: '09:00',
      completions: [
        ...generateCompletions(30, 0.8),
        { date: dateStr(0), completed: false, minutesLogged: 0, valueLogged: 5 },
      ],
      streakFreezes: [],
      createdAt: daysAgo(60),
    },
    {
      id: 'habit-steps', name: '10,000 Pasos diarios', icon: '🚶‍♀️', color: '#10b981',
      owner: 'cami', visibility: 'private',
      goalType: 'numeric', targetValue: 10000, unit: 'pasos',
      frequencyPerWeek: 6, reminderTime: '18:00',
      completions: [
        ...generateCompletions(30, 0.7),
        { date: dateStr(0), completed: false, minutesLogged: 0, valueLogged: 7200 },
      ],
      streakFreezes: [],
      createdAt: daysAgo(60),
    },
    {
      id: 'habit-pages', name: 'Leer 20 páginas de libro', icon: '📖', color: '#8b5cf6',
      owner: 'david', visibility: 'private',
      goalType: 'numeric', targetValue: 20, unit: 'páginas',
      frequencyPerWeek: 6, reminderTime: '21:30',
      completions: [
        ...generateCompletions(30, 0.75),
        { date: dateStr(0), completed: true, minutesLogged: 25, valueLogged: 20 },
      ],
      streakFreezes: [],
      createdAt: daysAgo(60),
    },
    {
      id: 'habit-pushups', name: '50 Flexiones / Push-ups', icon: '💪', color: '#ef4444',
      owner: 'david', visibility: 'private',
      goalType: 'numeric', targetValue: 50, unit: 'flexiones',
      frequencyPerWeek: 5, reminderTime: '07:30',
      completions: [
        ...generateCompletions(30, 0.7),
        { date: dateStr(0), completed: false, minutesLogged: 0, valueLogged: 30 },
      ],
      streakFreezes: [],
      createdAt: daysAgo(60),
    },
  ];

  // ═══════ EXPENSES ═══════
  const expenses: Expense[] = [
    { id: 'exp-1', description: 'Cuota Apartamento Eskala - Octubre', amount: 3500000, currency: 'COP', paidBy: 'david', category: 'Vivienda', date: dateStr(-5), splitType: 'equal', projectId: 'proj-eskala' },
    { id: 'exp-2', description: 'Mercado semanal Éxito', amount: 380000, currency: 'COP', paidBy: 'cami', category: 'Mercado', date: dateStr(-3), splitType: 'equal' },
    { id: 'exp-3', description: 'Internet y Netflix', amount: 120000, currency: 'COP', paidBy: 'david', category: 'Servicios', date: dateStr(-2), splitType: 'equal' },
    { id: 'exp-4', description: 'Cena restaurante aniversario', amount: 250000, currency: 'COP', paidBy: 'david', category: 'Salidas', date: dateStr(-7), splitType: 'equal' },
    { id: 'exp-5', description: 'Mercado semanal PriceSmart', amount: 450000, currency: 'COP', paidBy: 'cami', category: 'Mercado', date: dateStr(-10), splitType: 'equal' },
    { id: 'exp-6', description: 'Gasolina', amount: 180000, currency: 'COP', paidBy: 'david', category: 'Transporte', date: dateStr(-4), splitType: 'equal' },
    { id: 'exp-7', description: 'Administración edificio', amount: 280000, currency: 'COP', paidBy: 'cami', category: 'Vivienda', date: dateStr(-1), splitType: 'equal' },
    { id: 'exp-8', description: 'Cotización cocina integral (anticipo)', amount: 4080000, currency: 'COP', paidBy: 'david', category: 'Hogar', date: dateStr(-6), splitType: 'equal', projectId: 'proj-eskala' },
  ];

  // ═══════ TRIP PLANS ═══════
  const tripPlans: TripPlan[] = [
    {
      id: 'trip-1', title: 'Cartagena en Diciembre 🏖️', emoji: '🏖️', destination: 'Cartagena de Indias',
      startDate: '2026-12-18', endDate: '2026-12-23', budget: 5000000, currency: 'COP',
      notes: 'Hotel en Bocagrande, tour por las islas del Rosario, cena en La Cevichería.',
      checklistIds: ['task-cp4', 'task-cp5'],
    },
  ];

  // ═══════ SHARED NOTES ═══════
  const sharedNotes: SharedNote[] = [
    {
      id: 'sn-1', title: '🛒 Lista de compras de la semana',
      content: '- Pollo (2kg)\n- Arroz integral\n- Verduras para wok\n- Leche de almendras\n- Frutos secos\n- Jabón de platos\n- Papel higiénico',
      updatedAt: daysAgo(1), updatedBy: 'cami', pinned: true,
    },
    {
      id: 'sn-2', title: '💡 Ideas para el finde',
      content: '- Visitar el nuevo museo de arte\n- Probar la pizzería de la 93\n- Ir al parque con Loki\n- Movie night: ver Dune 3',
      updatedAt: daysAgo(2), updatedBy: 'david', pinned: false,
    },
    {
      id: 'sn-3', title: '📋 Acuerdos de la semana',
      content: '1. David cocina lunes y miércoles\n2. Cami cocina martes y jueves\n3. Viernes pedimos domicilio\n4. Sábado limpieza general juntos\n5. Domingo descanso y meal prep',
      updatedAt: daysAgo(0), updatedBy: 'david', pinned: true,
    },
  ];

  // ═══════ DAILY NOTES ═══════
  const dailyNotes: DailyNote[] = [
    {
      id: 'dn-d-today', date: dateStr(0), owner: 'david',
      content: [
        { id: 'dn1', type: 'heading2', content: '📅 Plan del día' },
        { id: 'dn2', type: 'todo', content: 'Sesión de Deep Work: optimizar [[Optimizar query de balance en Go]]', checked: false },
        { id: 'dn3', type: 'todo', content: 'Revisar PR del servicio de auth', checked: false },
        { id: 'dn4', type: 'todo', content: 'Gym 6pm - Día de pierna', checked: false },
        { id: 'dn5', type: 'heading2', content: '💡 Ideas rápidas' },
        { id: 'dn6', type: 'paragraph', content: 'Explorar si gRPC con protobuf es mejor opción que REST para el servicio de inventario. Ver [[Configurar gRPC entre servicios de inventario y pagos]].' },
      ],
      wikiLinks: ['task-d1', 'task-d7'],
    },
  ];

  // ═══════ NOTIFICATIONS ═══════
  const notifications: NexusNotification[] = [
    {
      id: 'notif-1', title: '⚠️ Tarea P1 vence mañana',
      body: 'Optimizar query de balance en Go - Vence mañana',
      level: 'urgent', taskId: 'task-d1', owner: 'david',
      read: false, createdAt: daysAgo(0),
    },
    {
      id: 'notif-2', title: '✅ Racha de 7 días en Deep Work',
      body: '¡Llevas 7 días consecutivos de Deep Work! Sigue así 🔥',
      level: 'info', habitId: 'habit-d1', owner: 'david',
      read: false, createdAt: daysAgo(0),
    },
    {
      id: 'notif-3', title: '💑 Tarea de pareja completada',
      body: 'Cami completó: Visitar showroom de Madecentro',
      level: 'info', taskId: 'task-cp2-s1', owner: 'david',
      read: true, createdAt: daysAgo(2),
    },
  ];

  return { tasks, projects, habits, tags, expenses, tripPlans, sharedNotes, dailyNotes, notifications, timeLogs: [] as any[] };
}
