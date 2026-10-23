import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Play,
  Pause,
  ExternalLink,
  Tag,
  CheckCircle2,
  Calendar,
  X,
  Folder,
  CheckSquare,
  FileText,
  Activity,
  Maximize2,
  Link2,
  Unlink,
  Plus,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
  Check,
  Compass,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Project, Habit, DailyNote, Owner, Visibility, Priority } from '../../types/nexus';

export interface SimNode {
  id: string;
  label: string;
  subtitle?: string;
  emoji?: string;
  type: 'project' | 'task' | 'subtask' | 'habit' | 'note';
  owner: Owner;
  visibility: Visibility;
  priority?: Priority;
  status?: string;
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging?: boolean;
  isPinned?: boolean;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
  type: 'project' | 'subtask' | 'wikilink';
  label?: string;
}

interface KnowledgeGraphProps {
  onNodeClick?: (node: SimNode) => void;
}

export default function KnowledgeGraph({ onNodeClick }: KnowledgeGraphProps) {
  const navigate = useNavigate();
  const {
    tasks,
    projects,
    habits,
    dailyNotes,
    getVisibleTasks,
    getVisibleProjects,
    getVisibleHabits,
    updateTask,
    setSelectedTaskId,
    currentOwner,
    accounts,
    contextMode,
  } = useNexusStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filters state
  const [visFilter, setVisFilter] = useState<'all' | 'private' | 'couple'>('all');
  const [typeFilters, setTypeFilters] = useState<{
    tasks: boolean;
    subtasks: boolean;
    projects: boolean;
    habits: boolean;
    notes: boolean;
  }>({
    tasks: true,
    subtasks: true,
    projects: true,
    habits: true,
    notes: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [simulationRunning, setSimulationRunning] = useState(true);

  // Connect Mode (click node A then node B to create link)
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceNode, setConnectSourceNode] = useState<SimNode | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quick link / project dropdown states in inspector
  const [showAddLinkDropdown, setShowAddLinkDropdown] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [showProjectPickerDropdown, setShowProjectPickerDropdown] = useState(false);

  // Canvas Viewport transform
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<SimEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SimEdge | null>(null);

  // Dragging & Interaction state
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);
  const hasMovedDuringDragRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Dismiss action toast automatically
  useEffect(() => {
    if (!actionNotice) return;
    const t = setTimeout(() => setActionNotice(null), 4000);
    return () => clearTimeout(t);
  }, [actionNotice]);

  // ─── Build Raw Data from Store ────────────────────────────────
  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();
  const visibleHabits = getVisibleHabits();
  const visibleNotes = dailyNotes.filter(dn => {
    if (contextMode === 'couple') return false;
    if (contextMode === 'unified') return true;
    return dn.owner === currentOwner;
  });

  // ─── Build Nodes & Edges with Smart Radial Cluster Layout ──────
  const { nodes: initialNodes, edges } = useMemo(() => {
    const rawNodes: SimNode[] = [];
    const rawEdges: SimEdge[] = [];
    const nodeIds = new Set<string>();
    const titleToNodeId = new Map<string, string>();

    const width = 1100;
    const height = 750;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Projects (Arranged symmetrically in an outer ring)
    const validProjects = visibleProjects.filter(p => visFilter === 'all' || p.visibility === visFilter);
    const numProjects = Math.max(validProjects.length, 1);
    const projectAngleStep = (2 * Math.PI) / numProjects;

    if (typeFilters.projects) {
      validProjects.forEach((p, idx) => {
        const angle = idx * projectAngleStep;
        const orbitR = 340;
        const posX = centerX + Math.cos(angle) * orbitR;
        const posY = centerY + Math.sin(angle) * orbitR;

        rawNodes.push({
          id: p.id,
          label: p.name,
          emoji: p.emoji || '📁',
          type: 'project',
          owner: p.owner,
          visibility: p.visibility,
          color: p.color || (p.visibility === 'couple' ? '#ec4899' : '#6366f1'),
          radius: 28,
          x: posX,
          y: posY,
          vx: 0,
          vy: 0,
          isPinned: false,
        });
        nodeIds.add(p.id);
        titleToNodeId.set(p.name.toLowerCase().trim(), p.id);
        titleToNodeId.set(`${p.emoji || ''} ${p.name}`.toLowerCase().trim(), p.id);
      });
    }

    // 2. Tasks & Subtasks (Arranged in clusters orbiting their respective projects)
    const projectMap = new Map(validProjects.map((p, idx) => [p.id, { p, idx }]));

    visibleTasks.forEach((t, tIdx) => {
      if (visFilter !== 'all' && t.visibility !== visFilter) return;
      const isSub = !!t.parentTaskId;

      if (isSub && !typeFilters.subtasks) return;
      if (!isSub && !typeFilters.tasks) return;

      // Color mapping by priority or status
      let nodeColor = '#3b82f6';
      if (t.status === 'done') {
        nodeColor = '#10b981';
      } else if (t.priority === 'P1') {
        nodeColor = '#ef4444';
      } else if (t.priority === 'P2') {
        nodeColor = '#f59e0b';
      } else if (t.priority === 'P3') {
        nodeColor = '#6366f1';
      } else if (t.priority === 'P4') {
        nodeColor = '#64748b';
      }

      if (isSub) {
        nodeColor = '#a855f7';
      }

      // Initial placement: If linked to a project, fan out around it; else in center sector
      let initX = centerX + (Math.random() - 0.5) * 300;
      let initY = centerY + (Math.random() - 0.5) * 300;

      if (t.projectId && projectMap.has(t.projectId)) {
        const { idx } = projectMap.get(t.projectId)!;
        const baseAngle = idx * projectAngleStep;
        // Fan out around the project
        const subAngle = baseAngle + ((tIdx % 7) - 3) * 0.28;
        const taskDist = isSub ? 460 : 380 + (tIdx % 3) * 40;
        initX = centerX + Math.cos(subAngle) * taskDist;
        initY = centerY + Math.sin(subAngle) * taskDist;
      }

      rawNodes.push({
        id: t.id,
        label: t.title,
        subtitle: t.category,
        type: isSub ? 'subtask' : 'task',
        owner: t.owner,
        visibility: t.visibility,
        priority: t.priority,
        status: t.status,
        color: nodeColor,
        radius: isSub ? 11 : 16,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
        isPinned: false,
      });
      nodeIds.add(t.id);
      titleToNodeId.set(t.title.toLowerCase().trim(), t.id);
    });

    // 3. Habits (Placed in a balanced sector)
    if (typeFilters.habits) {
      visibleHabits.forEach((h, hIdx) => {
        if (visFilter !== 'all' && h.visibility !== visFilter) return;
        const angle = (hIdx / Math.max(visibleHabits.length, 1)) * Math.PI - Math.PI / 2;
        const hDist = 200;
        const initX = centerX + Math.cos(angle) * hDist;
        const initY = centerY + Math.sin(angle) * hDist;

        rawNodes.push({
          id: h.id,
          label: h.name,
          emoji: h.icon || '⚡',
          type: 'habit',
          owner: h.owner,
          visibility: h.visibility,
          color: '#10b981',
          radius: 17,
          x: initX,
          y: initY,
          vx: 0,
          vy: 0,
          isPinned: false,
        });
        nodeIds.add(h.id);
        titleToNodeId.set(h.name.toLowerCase().trim(), h.id);
      });
    }

    // 4. Daily Notes
    if (typeFilters.notes) {
      visibleNotes.forEach((n, nIdx) => {
        const angle = (nIdx / Math.max(visibleNotes.length, 1)) * Math.PI + Math.PI / 2;
        const nDist = 220;
        const initX = centerX + Math.cos(angle) * nDist;
        const initY = centerY + Math.sin(angle) * nDist;

        rawNodes.push({
          id: n.id,
          label: `Nota ${n.date}`,
          emoji: '📝',
          type: 'note',
          owner: n.owner,
          visibility: 'private',
          color: '#06b6d4',
          radius: 16,
          x: initX,
          y: initY,
          vx: 0,
          vy: 0,
          isPinned: false,
        });
        nodeIds.add(n.id);
        titleToNodeId.set(`nota ${n.date}`.toLowerCase().trim(), n.id);
        titleToNodeId.set(n.date.toLowerCase().trim(), n.id);
      });
    }

    // ─── Build Edges (Project, Subtask, WikiLinks) ───────────────
    const edgeKeySet = new Set<string>();
    const addEdge = (source: string, target: string, type: SimEdge['type'], label?: string) => {
      if (source === target) return;
      if (!nodeIds.has(source) || !nodeIds.has(target)) return;
      const key = `${source}->${target}`;
      const revKey = `${target}->${source}`;
      if (!edgeKeySet.has(key) && !edgeKeySet.has(revKey)) {
        edgeKeySet.add(key);
        rawEdges.push({
          id: `edge-${source}-${target}`,
          source,
          target,
          type,
          label,
        });
      }
    };

    // A. Project -> Task edges
    visibleTasks.forEach(t => {
      if (t.projectId) {
        addEdge(t.projectId, t.id, 'project', 'Proyecto');
      }

      // B. Parent Task -> Subtask edges
      if (t.parentTaskId) {
        addEdge(t.parentTaskId, t.id, 'subtask', 'Subtarea');
      }

      // C. Explicit wikiLinks in Task
      if (t.wikiLinks && t.wikiLinks.length > 0) {
        t.wikiLinks.forEach(w => {
          if (nodeIds.has(w)) {
            addEdge(t.id, w, 'wikilink', 'WikiLink');
          } else {
            const byTitle = titleToNodeId.get(w.toLowerCase().trim());
            if (byTitle) addEdge(t.id, byTitle, 'wikilink', 'WikiLink');
          }
        });
      }

      // D. Scan Markdown / Description for [[WikiLinks]]
      const textToScan = [
        t.description || '',
        ...(t.pageContent || []).map(b => b.content || ''),
      ].join(' ');

      const mentions = textToScan.match(/\[\[(.*?)\]\]/g);
      if (mentions) {
        mentions.forEach(m => {
          const mentionTitle = m.slice(2, -2).trim().toLowerCase();
          const targetId = titleToNodeId.get(mentionTitle);
          if (targetId) {
            addEdge(t.id, targetId, 'wikilink', 'WikiLink');
          }
        });
      }
    });

    // E. WikiLinks in Daily Notes
    visibleNotes.forEach(n => {
      if (n.wikiLinks && n.wikiLinks.length > 0) {
        n.wikiLinks.forEach(w => {
          if (nodeIds.has(w)) {
            addEdge(n.id, w, 'wikilink', 'WikiLink');
          } else {
            const byTitle = titleToNodeId.get(w.toLowerCase().trim());
            if (byTitle) addEdge(n.id, byTitle, 'wikilink', 'WikiLink');
          }
        });
      }

      const noteText = (n.content || []).map(b => b.content || '').join(' ');
      const mentions = noteText.match(/\[\[(.*?)\]\]/g);
      if (mentions) {
        mentions.forEach(m => {
          const mentionTitle = m.slice(2, -2).trim().toLowerCase();
          const targetId = titleToNodeId.get(mentionTitle);
          if (targetId) {
            addEdge(n.id, targetId, 'wikilink', 'WikiLink');
          }
        });
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [visibleTasks, visibleProjects, visibleHabits, visibleNotes, visFilter, typeFilters]);

  // Keep live mutable nodes reference for physics
  const liveNodesRef = useRef<SimNode[]>([]);

  // Update liveNodesRef when initialNodes change, preserving positions and pinned state
  useEffect(() => {
    const existingMap = new Map(liveNodesRef.current.map(n => [n.id, n]));
    liveNodesRef.current = initialNodes.map(newNode => {
      const existing = existingMap.get(newNode.id);
      if (existing) {
        return {
          ...newNode,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          isPinned: existing.isPinned,
        };
      }
      return newNode;
    });
  }, [initialNodes]);

  // ─── Force-Directed Physics Simulation with Hard Collision Solver ─
  useEffect(() => {
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const nodes = liveNodesRef.current;
      const nLen = nodes.length;

      if (simulationRunning && nLen > 0) {
        const dpr = window.devicePixelRatio || 1;
        const cx = canvas.width / (2 * dpr);
        const cy = canvas.height / (2 * dpr);

        // 1. Long-range Coulomb Repulsion
        for (let i = 0; i < nLen; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nLen; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 420) {
              const force = 3200 / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (!n1.isPinned && !n1.isDragging) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (!n2.isPinned && !n2.isDragging) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 2. Hooke's Spring Attraction along Edges (with generous ideal distances)
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        for (let i = 0; i < edges.length; i++) {
          const edge = edges[i];
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (src && tgt) {
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = edge.type === 'project' ? 140 : edge.type === 'subtask' ? 75 : 160;
            const strength = edge.type === 'subtask' ? 0.05 : 0.035;
            const force = (dist - idealDist) * strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!src.isPinned && !src.isDragging) {
              src.vx += fx;
              src.vy += fy;
            }
            if (!tgt.isPinned && !tgt.isDragging) {
              tgt.vx -= fx;
              tgt.vy -= fy;
            }
          }
        }

        // 3. Gentle center pull & Velocity Damping
        for (let i = 0; i < nLen; i++) {
          const n = nodes[i];
          if (!n.isPinned && !n.isDragging) {
            n.vx += (cx - n.x) * 0.0012;
            n.vy += (cy - n.y) * 0.0012;

            // Velocity clamp
            n.vx = Math.max(-8, Math.min(8, n.vx));
            n.vy = Math.max(-8, Math.min(8, n.vy));

            // Damping (friction)
            n.vx *= 0.84;
            n.vy *= 0.84;

            n.x += n.vx;
            n.y += n.vy;
          }
        }

        // 4. CRITICAL: HARD COLLISION BUFFER (Prevents Overlap completely)
        const minBuffer = 45; // clearance buffer between nodes
        for (let i = 0; i < nLen; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nLen; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const requiredDist = n1.radius + n2.radius + minBuffer;

            if (dist < requiredDist) {
              const overlap = requiredDist - dist;
              const nx = (dx / dist) * overlap * 0.5;
              const ny = (dy / dist) * overlap * 0.5;

              if (!n1.isPinned && !n1.isDragging) {
                n1.x -= nx;
                n1.y -= ny;
                n1.vx = 0;
                n1.vy = 0;
              }
              if (!n2.isPinned && !n2.isDragging) {
                n2.x += nx;
                n2.y += ny;
                n2.vx = 0;
                n2.vy = 0;
              }
            }
          }
        }
      }

      // ─── Render Canvas ─────────────────────────────────────────
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.save();
        ctx.scale(dpr, dpr);

        // Clear canvas with nebula slate background
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, w, h);

        // Background subtle grid dots
        ctx.fillStyle = 'rgba(71, 85, 105, 0.2)';
        const gridSize = 40;
        const startX = (transform.x % (gridSize * transform.scale)) - gridSize * transform.scale;
        const startY = (transform.y % (gridSize * transform.scale)) - gridSize * transform.scale;
        for (let x = startX; x < w + gridSize * transform.scale; x += gridSize * transform.scale) {
          for (let y = startY; y < h + gridSize * transform.scale; y += gridSize * transform.scale) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Apply viewport transform
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        // Active focus highlight
        const activeFocusId = hoveredNodeId || selectedNode?.id;
        const connectedNeighborIds = new Set<string>();
        if (activeFocusId) {
          connectedNeighborIds.add(activeFocusId);
          edges.forEach(e => {
            if (e.source === activeFocusId) connectedNeighborIds.add(e.target);
            if (e.target === activeFocusId) connectedNeighborIds.add(e.source);
          });
        }

        // ─── 1. Draw Edges ─────────────────────────────────────────
        for (let i = 0; i < edges.length; i++) {
          const edge = edges[i];
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (src && tgt) {
            const isDirectFocus =
              activeFocusId && (src.id === activeFocusId || tgt.id === activeFocusId);
            const isSelectedEdge = selectedEdge?.id === edge.id;
            const isHoveredEdge = hoveredEdge?.id === edge.id;
            const isDimmed = activeFocusId && !isDirectFocus && !isSelectedEdge && !isHoveredEdge;

            ctx.save();
            ctx.beginPath();

            if (edge.type === 'subtask') {
              ctx.setLineDash([5, 5]);
            } else {
              ctx.setLineDash([]);
            }

            ctx.moveTo(src.x, src.y);
            ctx.lineTo(tgt.x, tgt.y);

            if (isDirectFocus || isSelectedEdge || isHoveredEdge) {
              if (edge.type === 'wikilink') {
                ctx.strokeStyle = '#ec4899';
                ctx.shadowColor = 'rgba(236, 72, 153, 0.9)';
                ctx.lineWidth = 3.2;
                ctx.shadowBlur = 14;
              } else if (edge.type === 'subtask') {
                ctx.strokeStyle = '#a855f7';
                ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
                ctx.lineWidth = 2.6;
                ctx.shadowBlur = 10;
              } else {
                ctx.strokeStyle = '#6366f1';
                ctx.shadowColor = 'rgba(99, 102, 241, 0.9)';
                ctx.lineWidth = 3.0;
                ctx.shadowBlur = 12;
              }
            } else if (isDimmed) {
              ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
              ctx.lineWidth = 0.8;
            } else {
              if (edge.type === 'wikilink') {
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.55)';
                ctx.lineWidth = 1.8;
              } else if (edge.type === 'subtask') {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
                ctx.lineWidth = 1.4;
              } else {
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
                ctx.lineWidth = 1.6;
              }
            }

            ctx.stroke();

            // Draw directional arrowhead towards target
            if (isDirectFocus || isSelectedEdge || isHoveredEdge) {
              const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
              const arrowDist = tgt.radius + 8;
              const arrowX = tgt.x - Math.cos(angle) * arrowDist;
              const arrowY = tgt.y - Math.sin(angle) * arrowDist;

              ctx.beginPath();
              ctx.fillStyle = ctx.strokeStyle;
              ctx.moveTo(arrowX, arrowY);
              ctx.lineTo(
                arrowX - 10 * Math.cos(angle - Math.PI / 6),
                arrowY - 10 * Math.sin(angle - Math.PI / 6)
              );
              ctx.lineTo(
                arrowX - 10 * Math.cos(angle + Math.PI / 6),
                arrowY - 10 * Math.sin(angle + Math.PI / 6)
              );
              ctx.closePath();
              ctx.fill();
            }

            ctx.restore();
          }
        }

        // ─── 2. Draw Nodes ─────────────────────────────────────────
        for (let i = 0; i < nLen; i++) {
          const node = nodes[i];
          const isHovered = hoveredNodeId === node.id;
          const isSelected = selectedNode?.id === node.id;
          const isConnectSource = connectSourceNode?.id === node.id;
          const isSearchMatch =
            searchQuery.trim().length > 1 &&
            node.label.toLowerCase().includes(searchQuery.toLowerCase());
          const isConnectedNeighbor = connectedNeighborIds.has(node.id);
          const isDimmed = activeFocusId && !isConnectedNeighbor;

          ctx.save();
          if (isDimmed) {
            ctx.globalAlpha = 0.18;
          }

          // Node Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

          // Glow effect
          if (isConnectSource) {
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 25;
          } else if (isHovered || isSelected || isSearchMatch) {
            ctx.shadowColor = isSearchMatch ? '#f59e0b' : node.color;
            ctx.shadowBlur = 24;
          } else if (isConnectedNeighbor && activeFocusId) {
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 14;
          } else {
            ctx.shadowBlur = 0;
          }

          // Node body
          ctx.fillStyle = node.color;
          ctx.fill();

          // Border ring
          ctx.lineWidth = isConnectSource ? 4 : isHovered || isSelected ? 3.5 : isSearchMatch ? 3 : 2;
          ctx.strokeStyle = isConnectSource
            ? '#10b981'
            : isHovered || isSelected
            ? '#ffffff'
            : isSearchMatch
            ? '#f59e0b'
            : 'rgba(255, 255, 255, 0.45)';
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Inner icon / emoji
          if (node.emoji) {
            ctx.font = `${Math.round(node.radius * 0.95)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.emoji, node.x, node.y);
          } else if (node.type === 'task') {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (node.status === 'done') {
              ctx.fillText('✓', node.x, node.y);
            } else if (node.priority) {
              ctx.fillText(node.priority, node.x, node.y);
            }
          }

          // Small Pin Indicator badge if node is pinned
          if (node.isPinned) {
            ctx.beginPath();
            ctx.arc(node.x + node.radius - 2, node.y - node.radius + 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#060913';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // ─── 3. Draw Node Label Pill ──────────────────────────────
          const shouldShowLabel =
            isHovered ||
            isSelected ||
            isSearchMatch ||
            node.type === 'project' ||
            isConnectedNeighbor ||
            transform.scale >= 0.75;

          if (shouldShowLabel && !isDimmed) {
            const labelText =
              node.label.length > 24 ? node.label.slice(0, 22) + '…' : node.label;
            ctx.font = isHovered || isSelected ? 'bold 11px Inter, sans-serif' : '500 10.5px Inter, sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            const pillPadding = 7;
            const pillHeight = 20;
            const pillX = node.x - textWidth / 2 - pillPadding;
            const pillY = node.y + node.radius + 6;

            // Pill background
            ctx.fillStyle = isHovered || isSelected ? 'rgba(15, 23, 42, 0.97)' : 'rgba(10, 15, 29, 0.88)';
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, textWidth + pillPadding * 2, pillHeight, 6);
            ctx.fill();

            ctx.strokeStyle = isHovered || isSelected ? node.color : 'rgba(51, 65, 85, 0.7)';
            ctx.lineWidth = isHovered || isSelected ? 1.8 : 0.9;
            ctx.stroke();

            // Pill text
            ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#cbd5e1';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, node.x, pillY + pillHeight / 2);
          }

          ctx.restore();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    edges,
    simulationRunning,
    transform,
    hoveredNodeId,
    hoveredEdge,
    selectedNode,
    selectedEdge,
    searchQuery,
    connectSourceNode,
  ]);

  // ─── Canvas Resizing ─────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || canvas.parentElement?.clientWidth || 1000;
      const h = rect.height || canvas.parentElement?.clientHeight || 700;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Coordinate Helpers ──────────────────────────────────────
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - transform.x) / transform.scale,
        y: (screenY - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  const findNodeAt = useCallback(
    (worldX: number, worldY: number): SimNode | null => {
      const nodes = liveNodesRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = worldX - n.x;
        const dy = worldY - n.y;
        if (dx * dx + dy * dy <= (n.radius + 10) * (n.radius + 10)) {
          return n;
        }
      }
      return null;
    },
    []
  );

  // Find edge near click point
  const findEdgeNear = useCallback(
    (worldX: number, worldY: number): SimEdge | null => {
      const nodes = liveNodesRef.current;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (src && tgt) {
          // Distance from point to line segment
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const lengthSq = dx * dx + dy * dy;
          if (lengthSq === 0) continue;

          let t = ((worldX - src.x) * dx + (worldY - src.y) * dy) / lengthSq;
          t = Math.max(0, Math.min(1, t));

          const projX = src.x + t * dx;
          const projY = src.y + t * dy;
          const distSq = (worldX - projX) * (worldX - projX) + (worldY - projY) * (worldY - projY);

          if (distSq < 100) {
            // within 10px of edge
            return edge;
          }
        }
      }
      return null;
    },
    [edges]
  );

  // ─── Mouse Handlers (Smooth pan, drag with pinning, connect) ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    hasMovedDuringDragRef.current = false;

    const hitNode = findNodeAt(worldPos.x, worldPos.y);

    // If in Connect Mode
    if (connectMode) {
      if (hitNode) {
        if (!connectSourceNode) {
          setConnectSourceNode(hitNode);
          setActionNotice(`Origen seleccionado: "${hitNode.label}". Ahora haz clic en el nodo destino.`);
        } else if (connectSourceNode.id !== hitNode.id) {
          handleCreateConnection(connectSourceNode, hitNode);
          setConnectSourceNode(null);
          setConnectMode(false);
        }
      } else {
        setConnectSourceNode(null);
        setConnectMode(false);
      }
      return;
    }

    if (hitNode) {
      draggedNodeRef.current = hitNode;
      hitNode.isDragging = true;
      hitNode.vx = 0;
      hitNode.vy = 0;
      setSelectedNode(hitNode);
      setSelectedEdge(null);
      if (onNodeClick) onNodeClick(hitNode);
    } else {
      // Check if clicked an edge
      const hitEdge = findEdgeNear(worldPos.x, worldPos.y);
      if (hitEdge) {
        setSelectedEdge(hitEdge);
        setSelectedNode(null);
      } else {
        isPanningRef.current = true;
        panStartRef.current = { x: mouseX - transform.x, y: mouseY - transform.y };
        setSelectedEdge(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    // Dragging a node
    if (draggedNodeRef.current) {
      hasMovedDuringDragRef.current = true;
      draggedNodeRef.current.x = worldPos.x;
      draggedNodeRef.current.y = worldPos.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      // Pin node where user drags it
      draggedNodeRef.current.isPinned = true;
      return;
    }

    // Panning canvas view
    if (isPanningRef.current) {
      hasMovedDuringDragRef.current = true;
      setTransform(t => ({
        ...t,
        x: mouseX - panStartRef.current.x,
        y: mouseY - panStartRef.current.y,
      }));
      return;
    }

    // Hover check
    const hitNode = findNodeAt(worldPos.x, worldPos.y);
    setHoveredNodeId(hitNode ? hitNode.id : null);

    if (!hitNode) {
      const hitEdge = findEdgeNear(worldPos.x, worldPos.y);
      setHoveredEdge(hitEdge);
    } else {
      setHoveredEdge(null);
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isDragging = false;
      draggedNodeRef.current = null;
    }
    isPanningRef.current = false;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    const hitNode = findNodeAt(worldPos.x, worldPos.y);
    if (hitNode) {
      handleOpenNodeDetail(hitNode);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.2), 4.0);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards cursor position
    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const unpinAllNodes = () => {
    liveNodesRef.current.forEach(n => {
      n.isPinned = false;
    });
    setSimulationRunning(true);
    setActionNotice('Todos los nodos han sido desfijados para reorganizarse con física.');
  };

  // ─── Connection Interventions (Add / Remove / Reassign) ────────
  const handleCreateConnection = (src: SimNode, tgt: SimNode) => {
    // If src is a task, link to tgt via wikiLinks
    const srcTask = tasks.find(t => t.id === src.id);
    if (srcTask) {
      const existing = srcTask.wikiLinks || [];
      if (!existing.includes(tgt.id) && !existing.includes(tgt.label)) {
        updateTask(src.id, {
          wikiLinks: [...existing, tgt.id],
        });
        setActionNotice(`🔗 Conexión creada: "${src.label}" ➔ "${tgt.label}"`);
      }
      return;
    }

    // If tgt is a task and src is a project, link task to project!
    const tgtTask = tasks.find(t => t.id === tgt.id);
    if (tgtTask && src.type === 'project') {
      updateTask(tgt.id, {
        projectId: src.id,
        category: src.label,
      });
      setActionNotice(`📁 Tarea "${tgt.label}" vinculada al proyecto "${src.label}"`);
      return;
    }

    if (tgtTask) {
      const existing = tgtTask.wikiLinks || [];
      if (!existing.includes(src.id) && !existing.includes(src.label)) {
        updateTask(tgt.id, {
          wikiLinks: [...existing, src.id],
        });
        setActionNotice(`🔗 Conexión creada: "${tgt.label}" ➔ "${src.label}"`);
      }
    }
  };

  const handleRemoveConnection = (edgeToRemove: SimEdge) => {
    const { source, target, type } = edgeToRemove;

    if (type === 'project') {
      // Source is project, Target is task
      const targetTask = tasks.find(t => t.id === target);
      if (targetTask) {
        updateTask(target, { projectId: undefined });
        setActionNotice(`Enlace de proyecto eliminado para "${targetTask.title}".`);
      }
    } else if (type === 'subtask') {
      // Source is parent task, Target is subtask
      const targetSubtask = tasks.find(t => t.id === target);
      if (targetSubtask) {
        updateTask(target, { parentTaskId: undefined });
        setActionNotice(`Subtarea "${targetSubtask.title}" desvinculada de su padre.`);
      }
    } else if (type === 'wikilink') {
      // Remove from source task's wikiLinks or target task's wikiLinks
      const srcTask = tasks.find(t => t.id === source);
      if (srcTask && srcTask.wikiLinks) {
        updateTask(source, {
          wikiLinks: srcTask.wikiLinks.filter(w => w !== target && w.toLowerCase() !== target.toLowerCase()),
        });
      }
      const tgtTask = tasks.find(t => t.id === target);
      if (tgtTask && tgtTask.wikiLinks) {
        updateTask(target, {
          wikiLinks: tgtTask.wikiLinks.filter(w => w !== source && w.toLowerCase() !== source.toLowerCase()),
        });
      }
      setActionNotice(`WikiLink eliminado entre los nodos.`);
    }

    setSelectedEdge(null);
  };

  const handleReassignProject = (taskId: string, newProjectId: string | undefined) => {
    const proj = visibleProjects.find(p => p.id === newProjectId);
    updateTask(taskId, {
      projectId: newProjectId,
      category: proj ? proj.name : undefined,
    });
    setShowProjectPickerDropdown(false);
    setActionNotice(
      proj
        ? `Proyecto reasignado a: "${proj.emoji} ${proj.name}"`
        : 'Tarea desvinculada (ahora es tarea general).'
    );
  };

  const handleOpenNodeDetail = (node: SimNode) => {
    if (node.type === 'task' || node.type === 'subtask') {
      setSelectedTaskId(node.id);
    } else if (node.type === 'project') {
      navigate(`/project/${node.id}`);
    } else if (node.type === 'habit') {
      navigate('/habits');
    } else if (node.type === 'note') {
      navigate('/daily-note');
    }
  };

  // Connected nodes & edges for the selected node
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;

    const connectedEdges = edges.filter(
      e => e.source === selectedNode.id || e.target === selectedNode.id
    );

    const connectedNodesList = connectedEdges.map(e => {
      const otherId = e.source === selectedNode.id ? e.target : e.source;
      const otherNode = initialNodes.find(n => n.id === otherId);
      return {
        edge: e,
        node: otherNode,
        isOutgoing: e.source === selectedNode.id,
      };
    }).filter(item => item.node !== undefined);

    const relatedTask = tasks.find(t => t.id === selectedNode.id);
    const relatedProject = projects.find(p => p.id === selectedNode.id);

    return {
      connectedEdges,
      connectedNodesList,
      task: relatedTask,
      project: relatedProject,
    };
  }, [selectedNode, edges, initialNodes, tasks, projects]);

  return (
    <div className="relative w-full h-full flex flex-col bg-nexus-bg overflow-hidden select-none rounded-3xl border border-nexus-border shadow-2xl">
      {/* ─── Top Control Toolbar ───────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Visibility Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-nexus-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-nexus-border shadow-xl">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar en el grafo..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 w-36 sm:w-52"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-nexus-text-muted hover:text-nexus-text cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-nexus-border mx-0.5" />

          {/* Visibility mode toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setVisFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                visFilter === 'all'
                  ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setVisFilter('private')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                visFilter === 'private'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-nexus-text-muted hover:text-indigo-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              <span>Privados</span>
            </button>
            <button
              type="button"
              onClick={() => setVisFilter('couple')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                visFilter === 'couple'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-nexus-text-muted hover:text-pink-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
              <span>Pareja</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, Entity Type Filter chips & Stats */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-nexus-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-nexus-border shadow-xl">
          {/* Quick Connect Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setConnectMode(prev => !prev);
              setConnectSourceNode(null);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              connectMode
                ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/30'
                : 'bg-nexus-surface-2 hover:bg-nexus-surface-3 text-emerald-400 border border-emerald-500/30'
            }`}
            title="Haz clic en dos nodos para crear un enlace entre ellos"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{connectMode ? 'Modo Enlazar (Activo)' : 'Conectar Nodos'}</span>
          </button>

          <div className="h-5 w-px bg-nexus-border mx-0.5" />

          <button
            type="button"
            onClick={() => setTypeFilters(f => ({ ...f, projects: !f.projects }))}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              typeFilters.projects
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'text-nexus-text-muted opacity-40'
            }`}
          >
            <span>📁 Proyectos</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilters(f => ({ ...f, tasks: !f.tasks }))}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              typeFilters.tasks
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-nexus-text-muted opacity-40'
            }`}
          >
            <span>📋 Tareas</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilters(f => ({ ...f, subtasks: !f.subtasks }))}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              typeFilters.subtasks
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-nexus-text-muted opacity-40'
            }`}
          >
            <span>🔗 Subtareas</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilters(f => ({ ...f, habits: !f.habits }))}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              typeFilters.habits
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-nexus-text-muted opacity-40'
            }`}
          >
            <span>⚡ Hábitos</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilters(f => ({ ...f, notes: !f.notes }))}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              typeFilters.notes
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-nexus-text-muted opacity-40'
            }`}
          >
            <span>📝 Notas</span>
          </button>

          <div className="h-5 w-px bg-nexus-border mx-1" />

          <div className="text-[11px] font-mono text-nexus-text-muted px-1.5">
            {initialNodes.length} nodos • {edges.length} enlaces
          </div>
        </div>
      </div>

      {/* ─── Action Feedback Notification Banner ────────────────── */}
      {actionNotice && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-indigo-600/90 text-white font-medium text-xs shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="ml-1 p-0.5 hover:opacity-80">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── Canvas ────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className={`w-full h-full block ${
          connectMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* ─── Empty State Overlay ─────────────────────────────────── */}
      {initialNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-nexus-surface/90 border border-nexus-border flex items-center justify-center text-3xl mb-3 shadow-xl backdrop-blur-md">
            🕸️
          </div>
          <h3 className="text-base font-bold text-nexus-text mb-1">
            Tu Grafo de Conocimiento está listo
          </h3>
          <p className="text-xs text-nexus-text-muted max-w-sm">
            A medida que crees proyectos, tareas, hábitos y enlaces con <span className="font-mono text-indigo-400">[[...]]</span>, verás aparecer sus nodos y conexiones en tiempo real.
          </p>
        </div>
      )}

      {/* ─── Selected Edge Floating Action Card ────────────────── */}
      {selectedEdge && (
        <div className="absolute top-20 right-6 z-20 max-w-sm p-3.5 rounded-2xl bg-nexus-surface/95 backdrop-blur-md border border-nexus-border shadow-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-nexus-text flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-pink-400" />
              <span>Enlace Seleccionado ({selectedEdge.type})</span>
            </span>
            <button
              onClick={() => setSelectedEdge(null)}
              className="p-1 rounded text-nexus-text-muted hover:text-nexus-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1 text-nexus-text-secondary text-[11px] flex items-center gap-1.5">
            <span className="font-semibold text-nexus-text">{selectedEdge.source}</span>
            <ArrowRight className="w-3 h-3 text-nexus-text-muted" />
            <span className="font-semibold text-nexus-text">{selectedEdge.target}</span>
          </div>

          <button
            type="button"
            onClick={() => handleRemoveConnection(selectedEdge)}
            className="w-full py-1.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Desvincular este enlace</span>
          </button>
        </div>
      )}

      {/* ─── Node Inspector & Connection Intervention Panel ─────── */}
      {selectedNode && selectedNodeDetails && (
        <div className="absolute bottom-6 left-6 z-20 max-w-md w-full p-4 rounded-3xl bg-nexus-surface/98 backdrop-blur-xl border border-nexus-border shadow-2xl animate-fade-in space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm shrink-0"
                style={{ backgroundColor: selectedNode.color, color: '#ffffff' }}
              >
                {selectedNode.emoji || (selectedNode.type === 'task' ? '📋' : '🔗')}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-nexus-text-muted tracking-wider">
                    {selectedNode.type} • {selectedNode.visibility === 'couple' ? '💑 Pareja' : '🔒 Privado'}
                  </span>
                  {selectedNode.isPinned && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Fijado
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-nexus-text truncate">{selectedNode.label}</h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Pin / Unpin button */}
              <button
                type="button"
                onClick={() => {
                  selectedNode.isPinned = !selectedNode.isPinned;
                  setActionNotice(
                    selectedNode.isPinned
                      ? `Nodo "${selectedNode.label}" fijado en esta posición.`
                      : `Nodo "${selectedNode.label}" liberado para física.`
                  );
                }}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  selectedNode.isPinned
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
                title={selectedNode.isPinned ? 'Desfijar nodo' : 'Fijar nodo en esta posición'}
              >
                {selectedNode.isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── INTERVENTION SECTION 1: PROYECTO ASIGNADO ── */}
          {selectedNodeDetails.task && (
            <div className="p-3 rounded-2xl bg-nexus-surface-2/70 border border-nexus-border/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-nexus-text-secondary flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Proyecto Asignado</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowProjectPickerDropdown(!showProjectPickerDropdown)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  {showProjectPickerDropdown ? 'Cancelar' : 'Cambiar Proyecto'}
                </button>
              </div>

              {/* Current Project Pill */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                {selectedNodeDetails.task.projectId ? (
                  (() => {
                    const curProj = projects.find(p => p.id === selectedNodeDetails.task?.projectId);
                    return curProj ? (
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1.5">
                        <span>{curProj.emoji}</span>
                        <span>{curProj.name}</span>
                      </span>
                    ) : (
                      <span className="text-nexus-text-muted">Proyecto no encontrado</span>
                    );
                  })()
                ) : (
                  <span className="text-nexus-text-muted italic text-[11px]">
                    Sin proyecto (Tarea General)
                  </span>
                )}

                {selectedNodeDetails.task.projectId && (
                  <button
                    type="button"
                    onClick={() => handleReassignProject(selectedNode.id, undefined)}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    title="Desvincular del proyecto"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Desvincular</span>
                  </button>
                )}
              </div>

              {/* Dropdown to switch project */}
              {showProjectPickerDropdown && (
                <div className="pt-2 border-t border-nexus-border/60 space-y-1">
                  <span className="text-[10px] text-nexus-text-muted font-bold uppercase tracking-wider block">
                    Seleccionar nuevo proyecto:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {visibleProjects.map(proj => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => handleReassignProject(selectedNode.id, proj.id)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-nexus-surface-3 hover:bg-indigo-600/20 text-nexus-text text-left text-xs flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{proj.emoji}</span>
                          <span className="truncate">{proj.name}</span>
                        </span>
                        {selectedNodeDetails.task?.projectId === proj.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INTERVENTION SECTION 2: CONEXIONES ACTIVAS & DESVINCULACIÓN ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-nexus-text uppercase tracking-wider text-[10px]">
                Enlaces e Intervenciones ({selectedNodeDetails.connectedNodesList.length}):
              </span>

              {/* Add Link Button */}
              <button
                type="button"
                onClick={() => setShowAddLinkDropdown(!showAddLinkDropdown)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Crear Enlace</span>
              </button>
            </div>

            {/* Quick Add Link Dropdown */}
            {showAddLinkDropdown && (
              <div className="p-2.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border space-y-2 text-xs">
                <div className="relative">
                  <Search className="w-3 h-3 text-nexus-text-muted absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={linkSearchQuery}
                    onChange={e => setLinkSearchQuery(e.target.value)}
                    placeholder="Buscar nodo para enlazar..."
                    className="w-full pl-7 pr-3 py-1 bg-nexus-surface-3 border border-nexus-border rounded-xl text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {initialNodes
                    .filter(
                      n =>
                        n.id !== selectedNode.id &&
                        (!linkSearchQuery.trim() ||
                          n.label.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                    )
                    .slice(0, 10)
                    .map(targetNode => (
                      <button
                        key={targetNode.id}
                        type="button"
                        onClick={() => {
                          handleCreateConnection(selectedNode, targetNode);
                          setShowAddLinkDropdown(false);
                          setLinkSearchQuery('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-nexus-surface-3 hover:bg-indigo-600/20 text-nexus-text text-left text-xs flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{targetNode.emoji || (targetNode.type === 'task' ? '📋' : '🔗')}</span>
                          <span className="truncate">{targetNode.label}</span>
                        </span>
                        <span className="text-[10px] text-nexus-text-muted capitalize">
                          {targetNode.type}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* List of active connections with 1-click unlinking */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {selectedNodeDetails.connectedNodesList.length === 0 ? (
                <div className="p-3 text-center text-xs text-nexus-text-muted bg-nexus-surface-2/40 rounded-xl">
                  Este nodo no tiene conexiones activas aún.
                </div>
              ) : (
                selectedNodeDetails.connectedNodesList.map(({ edge, node }) => {
                  if (!node) return null;
                  return (
                    <div
                      key={edge.id}
                      className="p-2 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-2/80 border border-nexus-border flex items-center justify-between gap-2 text-xs transition"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNode(node);
                        }}
                        className="flex items-center gap-2 truncate text-left hover:text-indigo-300 cursor-pointer"
                        title={node.label}
                      >
                        <span className="text-sm shrink-0">
                          {node.emoji || (node.type === 'task' ? '📋' : '🔗')}
                        </span>
                        <div className="truncate">
                          <p className="truncate font-medium text-nexus-text">{node.label}</p>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              edge.type === 'wikilink'
                                ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                                : edge.type === 'subtask'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {edge.label || edge.type}
                          </span>
                        </div>
                      </button>

                      {/* 1-Click Unlink Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveConnection(edge)}
                        className="p-1.5 text-nexus-text-muted hover:text-red-400 hover:bg-red-500/15 rounded-lg transition shrink-0 cursor-pointer"
                        title="Eliminar este enlace"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-nexus-border/60 text-xs">
            <span className="text-nexus-text-muted font-medium">
              {accounts.find(a => a.owner === selectedNode.owner)?.displayName || selectedNode.owner}
            </span>

            <button
              type="button"
              onClick={() => handleOpenNodeDetail(selectedNode)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition cursor-pointer"
            >
              <span>Abrir Documento</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── View Controls & Physical Management (Bottom-Right) ─── */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-nexus-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-nexus-border shadow-xl">
        {/* Unpin All / Reorganize */}
        <button
          type="button"
          onClick={unpinAllNodes}
          className="px-2.5 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 text-xs font-semibold text-nexus-text-secondary hover:text-nexus-text border border-nexus-border transition cursor-pointer flex items-center gap-1"
          title="Desfijar todos los nodos para que la física los redistribuya sin solapamiento"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Desfijar Nodos</span>
        </button>

        <div className="h-5 w-px bg-nexus-border" />

        <button
          type="button"
          onClick={() => setSimulationRunning(!simulationRunning)}
          className={`p-2 rounded-xl transition cursor-pointer ${
            simulationRunning
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-nexus-text-muted hover:text-nexus-text'
          }`}
          title={simulationRunning ? 'Pausar física' : 'Reanudar física'}
        >
          {simulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-nexus-border" />

        <button
          type="button"
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.25, 4.0) }))}
          className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition cursor-pointer"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale * 0.8, 0.2) }))}
          className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition cursor-pointer"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={resetView}
          className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition cursor-pointer"
          title="Centrar vista"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
