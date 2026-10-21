// ═══════════════════════════════════════════════════════════════════
// NexusOS — NLP Quick-Add Parser
// Parses: "Optimizar query mañana 18:00 !P1 #backend ~60m @privado"
// ═══════════════════════════════════════════════════════════════════
import type { Priority, Visibility, ParsedTaskInput } from '../types/nexus';

interface ParseToken {
  type: 'priority' | 'tag' | 'visibility' | 'estimate' | 'date' | 'project' | 'text';
  value: string;
  raw: string;
}

const PRIORITY_MAP: Record<string, Priority> = {
  '!p1': 'P1', '!p2': 'P2', '!p3': 'P3', '!p4': 'P4',
  '!1': 'P1', '!2': 'P2', '!3': 'P3', '!4': 'P4',
};

const DATE_MAP: Record<string, () => Date> = {
  'hoy': () => new Date(),
  'today': () => new Date(),
  'mañana': () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; },
  'tomorrow': () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; },
  'pasado': () => { const d = new Date(); d.setDate(d.getDate() + 2); return d; },
  'lunes': () => nextWeekday(1),
  'martes': () => nextWeekday(2),
  'miércoles': () => nextWeekday(3),
  'miercoles': () => nextWeekday(3),
  'jueves': () => nextWeekday(4),
  'viernes': () => nextWeekday(5),
  'sábado': () => nextWeekday(6),
  'sabado': () => nextWeekday(6),
  'domingo': () => nextWeekday(0),
};

function nextWeekday(day: number): Date {
  const d = new Date();
  const diff = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

export function tokenize(input: string): ParseToken[] {
  const tokens: ParseToken[] = [];
  const words = input.split(/\s+/);

  for (const word of words) {
    const lower = word.toLowerCase();

    // Priority: !P1, !P2, etc.
    if (PRIORITY_MAP[lower]) {
      tokens.push({ type: 'priority', value: PRIORITY_MAP[lower], raw: word });
      continue;
    }

    // Tag: #tag
    if (word.startsWith('#') && word.length > 1) {
      tokens.push({ type: 'tag', value: word.slice(1), raw: word });
      continue;
    }

    // Project: +project (e.g. +contacripto, +eskala)
    if (word.startsWith('+') && word.length > 1) {
      tokens.push({ type: 'project', value: word.slice(1), raw: word });
      continue;
    }

    // Visibility: @privado, @pareja
    if (lower === '@privado' || lower === '@private') {
      tokens.push({ type: 'visibility', value: 'private', raw: word });
      continue;
    }
    if (lower === '@pareja' || lower === '@couple') {
      tokens.push({ type: 'visibility', value: 'couple', raw: word });
      continue;
    }

    // Time estimate: ~60m, ~2h
    const timeMatch = word.match(/^~(\d+)(m|h)$/i);
    if (timeMatch) {
      const minutes = timeMatch[2].toLowerCase() === 'h'
        ? parseInt(timeMatch[1]) * 60
        : parseInt(timeMatch[1]);
      tokens.push({ type: 'estimate', value: String(minutes), raw: word });
      continue;
    }

    // Date keywords
    if (DATE_MAP[lower]) {
      tokens.push({ type: 'date', value: DATE_MAP[lower]().toISOString(), raw: word });
      continue;
    }

    // Time pattern: 18:00, 14:30
    const timePattern = word.match(/^(\d{1,2}):(\d{2})$/);
    if (timePattern) {
      // Attach time to last date token
      const lastDate = [...tokens].reverse().find(t => t.type === 'date');
      if (lastDate) {
        const d = new Date(lastDate.value);
        d.setHours(parseInt(timePattern[1]), parseInt(timePattern[2]), 0, 0);
        lastDate.value = d.toISOString();
      }
      continue;
    }

    // Regular text
    tokens.push({ type: 'text', value: word, raw: word });
  }

  return tokens;
}

export function parseTaskInput(input: string): ParsedTaskInput {
  const tokens = tokenize(input);

  const titleParts: string[] = [];
  let priority: Priority | undefined;
  const tags: string[] = [];
  let visibility: Visibility | undefined = undefined;
  let projectQuery: string | undefined = undefined;
  let estimatedMinutes: number | undefined;
  let dueDate: string | undefined;

  for (const token of tokens) {
    switch (token.type) {
      case 'priority':
        priority = token.value as Priority;
        break;
      case 'tag':
        tags.push(token.value);
        break;
      case 'project':
        projectQuery = token.value;
        break;
      case 'visibility':
        visibility = token.value as Visibility;
        break;
      case 'estimate':
        estimatedMinutes = parseInt(token.value);
        break;
      case 'date':
        dueDate = token.value;
        break;
      case 'text':
        titleParts.push(token.value);
        break;
    }
  }

  return {
    title: titleParts.join(' '),
    priority,
    tags,
    visibility,
    projectQuery,
    estimatedMinutes,
    dueDate,
    rawInput: input,
  };
}

export function getTokenColorClass(type: ParseToken['type']): string {
  switch (type) {
    case 'priority': return 'text-red-400 bg-red-500/15 border-red-500/30';
    case 'tag': return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
    case 'project': return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
    case 'visibility': return 'text-pink-400 bg-pink-500/15 border-pink-500/30';
    case 'estimate': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'date': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    default: return '';
  }
}
