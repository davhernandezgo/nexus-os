// ═══════════════════════════════════════════════════════════════════
// NexusOS — Clean Initial Data
// ═══════════════════════════════════════════════════════════════════
import type { Tag } from '../types/nexus';

export function seedData() {
  const tags: Tag[] = [
    { id: 'tag-work', name: 'Trabajo', color: '#6366f1', owner: 'user', visibility: 'private' },
    { id: 'tag-personal', name: 'Personal', color: '#10b981', owner: 'user', visibility: 'private' },
    { id: 'tag-hogar', name: 'Hogar', color: '#ec4899', owner: 'user', visibility: 'couple' },
    { id: 'tag-finanzas', name: 'Finanzas', color: '#22c55e', owner: 'user', visibility: 'couple' },
  ];

  return {
    tags,
    projects: [],
    tasks: [],
    habits: [],
    expenses: [],
    tripPlans: [],
    sharedNotes: [],
    dailyNotes: [],
    notifications: [],
    investments: [],
    categoryBudgets: [],
  };
}
