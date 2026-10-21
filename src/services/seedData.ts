// ═══════════════════════════════════════════════════════════════════
// NexusOS — Clean Initial Data
// ═══════════════════════════════════════════════════════════════════
import type { Tag } from '../types/nexus';

export function seedData() {
  const tags: Tag[] = [
    { id: 'tag-work', name: 'Trabajo', color: '#6366f1', owner: 'david', visibility: 'private' },
    { id: 'tag-personal', name: 'Personal', color: '#10b981', owner: 'david', visibility: 'private' },
    { id: 'tag-hogar', name: 'Hogar', color: '#ec4899', owner: 'david', visibility: 'couple' },
    { id: 'tag-finanzas', name: 'Finanzas', color: '#22c55e', owner: 'david', visibility: 'couple' },
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
  };
}
