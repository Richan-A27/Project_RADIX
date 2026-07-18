import React, { useEffect, useRef, useState } from 'react';
import type { UnifiedCandidateProfile, TalentCheckReport } from '../state/StateEngine';

interface SkillGalaxyProps {
  profile: UnifiedCandidateProfile | null;
  report: TalentCheckReport | null;
  onNodeClick?: (categoryCode: string) => void;
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  baseRadius: number;
  color: string;
  glowColor: string;
  type: 'candidate' | 'benchmark';
  level: number;
  pulseSpeed: number;
  pulsePhase: number;
  orbitAngle: number; // Added to track orbital position
  orbitRadius: number; // Added to track orbital distance
}

interface MiniParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
}

export const SkillGalaxy: React.FC<SkillGalaxyProps> = ({ profile, report, onNodeClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'atom' | 'alignment'>('atom');
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  
  const nodesRef = useRef<Node[]>([]);
  const miniParticlesRef = useRef<MiniParticle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const coreScaleRef = useRef(1); // For core pulsing reaction when absorbing particles

  // Map of category codes to neon colors
  const categoryColors: Record<string, string> = {
    'COD': '#ef4444',   // Red
    'DSA': '#3b82f6',   // Blue
    'OOD': '#10b981',   // Emerald
    'APTI': '#8b5cf6',  // Purple
    'COMM': '#ec4899',  // Pink
    'AI': '#fbbf24',    // Gold
    'CLOUD': '#06b6d4', // Cyan
    'SQL': '#14b8a6',   // Teal
    'SWE': '#0ea5e9',   // Light Blue
    'SYSD': '#f43f5e',  // Rose
    'NETW': '#a855f7',  // Purple-Indigo
    'OS': '#64748b',    // Slate
    'OTHER': '#d4d4d8'  // Gray
  };

  const getColor = (code: string) => categoryColors[code] || '#38bdf8';

  // Initialize and update nodes dynamically
  useEffect(() => {
    if (!profile) {
      nodesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const newNodes: Node[] = [];

    if (viewMode === 'atom') {
      // Core Node representing Candidate Identity
      newNodes.push({
        id: 'core',
        label: profile.name,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        targetX: centerX,
        targetY: centerY,
        radius: 28,
        baseRadius: 28,
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.6)',
        type: 'candidate',
        level: 10,
        pulseSpeed: 0.03,
        pulsePhase: 0,
        orbitAngle: 0,
        orbitRadius: 0
      });

      // Orbital category nodes (RADIX subsystems)
      const categories = ['COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS'];
      categories.forEach((cat, idx) => {
        const catSkills = profile.skills.filter(s => s.category_code === cat);
        let level = catSkills.length > 0 ? 3 : 0;
        catSkills.forEach(s => {
          if (s.confidence === 'high') level += 2;
          else if (s.confidence === 'medium') level += 1;
        });
        level = Math.min(10, level);

        // MEANINGFUL PHYSICS RULES:
        // 1. Distance matches level: Stronger skills are pulled closer to the core nucleus (tight integration).
        //    Level 10 => 80px orbit. Level 0 => 220px orbit.
        const orbitRadius = 220 - level * 14;
        
        // Retain previous angle/position if node existed before to prevent jumpiness on update
        const oldNode = nodesRef.current.find(o => o.id === `cand-${cat}`);
        const orbitAngle = oldNode ? oldNode.orbitAngle : (idx / 12) * Math.PI * 2;

        const x = centerX + Math.cos(orbitAngle) * orbitRadius;
        const y = centerY + Math.sin(orbitAngle) * orbitRadius;

        newNodes.push({
          id: `cand-${cat}`,
          label: `${cat} (${level})`,
          x: oldNode ? oldNode.x : x + (Math.random() - 0.5) * 40,
          y: oldNode ? oldNode.y : y + (Math.random() - 0.5) * 40,
          vx: oldNode ? oldNode.vx : 0,
          vy: oldNode ? oldNode.vy : 0,
          targetX: x,
          targetY: y,
          radius: level > 0 ? 11 + level * 1.6 : 8,
          baseRadius: level > 0 ? 11 + level * 1.6 : 8,
          color: getColor(cat),
          glowColor: getColor(cat) + '40',
          type: 'candidate',
          level: level,
          pulseSpeed: 0.015 + Math.random() * 0.015,
          pulsePhase: Math.random() * Math.PI * 2,
          orbitAngle,
          orbitRadius
        });
      });

    } else if (viewMode === 'alignment' && report) {
      // Alignment split mode
      const leftX = width * 0.3;
      const rightX = width * 0.7;
      const gapY = height / 13;

      report.skillset_gap.forEach((gapItem, idx) => {
        const y = gapY * (idx + 1);
        const cat = gapItem.category_code;
        const color = getColor(cat);

        // Candidate node (Left side)
        const oldCand = nodesRef.current.find(o => o.id === `cand-${cat}`);
        newNodes.push({
          id: `cand-${cat}`,
          label: `${cat} (${gapItem.candidate_level})`,
          x: oldCand ? oldCand.x : leftX - 100 + Math.random() * 50,
          y: oldCand ? oldCand.y : y,
          vx: oldCand ? oldCand.vx : 0,
          vy: oldCand ? oldCand.vy : 0,
          targetX: leftX,
          targetY: y,
          radius: 8 + gapItem.candidate_level * 1.6,
          baseRadius: 8 + gapItem.candidate_level * 1.6,
          color: color,
          glowColor: color + '40',
          type: 'candidate',
          level: gapItem.candidate_level,
          pulseSpeed: 0.02,
          pulsePhase: idx * 0.5,
          orbitAngle: 0,
          orbitRadius: 0
        });

        // Company benchmark node (Right side)
        const oldBench = nodesRef.current.find(o => o.id === `bench-${cat}`);
        newNodes.push({
          id: `bench-${cat}`,
          label: `Req: ${gapItem.required_level}`,
          x: oldBench ? oldBench.x : rightX + 100 - Math.random() * 50,
          y: oldBench ? oldBench.y : y,
          vx: oldBench ? oldBench.vx : 0,
          vy: oldBench ? oldBench.vy : 0,
          targetX: rightX,
          targetY: y,
          radius: 8 + gapItem.required_level * 1.6,
          baseRadius: 8 + gapItem.required_level * 1.6,
          color: gapItem.gap ? '#ef4444' : '#10b981',
          glowColor: gapItem.gap ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
          type: 'benchmark',
          level: gapItem.required_level,
          pulseSpeed: 0.02,
          pulsePhase: idx * 0.5 + Math.PI,
          orbitAngle: 0,
          orbitRadius: 0
        });
      });
    }

    nodesRef.current = newNodes;
  }, [profile, report, viewMode]);

  // Visualizer Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 420;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animationLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const nodes = nodesRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Update core pulse bounce back to scale 1
      coreScaleRef.current += (1 - coreScaleRef.current) * 0.08;

      // Update node physics positions
      nodes.forEach(node => {
        node.pulsePhase += node.pulseSpeed;
        
        if (node.id === 'core') {
          node.radius = node.baseRadius * coreScaleRef.current + Math.sin(node.pulsePhase) * 1.5;
        } else {
          node.radius = node.baseRadius + Math.sin(node.pulsePhase) * 1.2;
        }

        if (viewMode === 'atom') {
          if (node.id !== 'core') {
            // MEANINGFUL PHYSICS RULE 2:
            // Orbit angular speed matches competence: Stronger skills spin faster (high energy).
            // Level 10 => 0.012 speed. Level 0 => 0.003 speed.
            const speedMultiplier = 0.003 + node.level * 0.001;
            node.orbitAngle += speedMultiplier;

            // Target orbit coordinate based on current orbit angle
            const targetX = centerX + Math.cos(node.orbitAngle) * node.orbitRadius;
            const targetY = centerY + Math.sin(node.orbitAngle) * node.orbitRadius;

            // Damped spring-mass system physics to pull node to orbit path coordinates
            const dx = targetX - node.x;
            const dy = targetY - node.y;
            node.vx += dx * 0.05;
            node.vy += dy * 0.05;
            node.vx *= 0.88;
            node.vy *= 0.88;

            node.x += node.vx;
            node.y += node.vy;
          }
        } else {
          // Alignment linear spring movement
          const dx = node.targetX - node.x;
          const dy = node.targetY - node.y;
          node.vx = dx * 0.1;
          node.vy = dy * 0.1;
          node.x += node.vx;
          node.y += node.vy;
        }

        // Magnet repeller from mouse cursor
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const mdx = node.x - mx;
        const mdy = node.y - my;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 100 && mdist > 5) {
          const push = (100 - mdist) * 0.04;
          node.x += mdx / mdist * push;
          node.y += mdy / mdist * push;
        }
      });

      // ----------------------------------------------------
      // DRAW CONNECTIONS AND ORBIT TRAILS
      // ----------------------------------------------------
      if (viewMode === 'atom') {
        nodes.forEach(node => {
          if (node.id !== 'core') {
            // Draw orbit trace path circles (dotted for weak, solid for strong)
            ctx.beginPath();
            ctx.arc(centerX, centerY, node.orbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = node.level > 0 ? `${node.color}15` : 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = node.level > 0 ? 1 : 0.5;
            if (node.level === 0) {
              ctx.setLineDash([2, 8]);
            } else if (node.level < 5) {
              ctx.setLineDash([4, 4]);
            } else {
              ctx.setLineDash([]);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw core linkage beam
            // Line thickness and opacity matches competency levels!
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = node.level > 0 ? `${node.color}35` : 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = node.level > 0 ? 1 + node.level * 0.35 : 0.5;
            ctx.stroke();
          }
        });
      } else if (viewMode === 'alignment' && report) {
        report.skillset_gap.forEach(gapItem => {
          const candNode = nodes.find(n => n.id === `cand-${gapItem.category_code}`);
          const benchNode = nodes.find(n => n.id === `bench-${gapItem.category_code}`);

          if (candNode && benchNode) {
            ctx.beginPath();
            ctx.moveTo(candNode.x, candNode.y);
            ctx.lineTo(benchNode.x, benchNode.y);
            
            if (gapItem.gap) {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 6]);
            } else {
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
              ctx.lineWidth = 3.5;
              ctx.setLineDash([]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // ----------------------------------------------------
      // DRAW MINI SPLASH PARTICLES WITH CORE GRAVITY
      // ----------------------------------------------------
      const mps = miniParticlesRef.current;
      for (let i = mps.length - 1; i >= 0; i--) {
        const p = mps[i];

        // MEANINGFUL PHYSICS RULE 3:
        // Mini particles splash outwards initially, but get pulled in by core gravity
        // forming "skills feeding candidates hub" cosmic trace!
        const gdx = centerX - p.x;
        const gdy = centerY - p.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);

        if (gdist > 25 && viewMode === 'atom') {
          // Gravitational pull force vector
          const pullIntensity = 0.45;
          p.vx += gdx / gdist * pullIntensity;
          p.vy += gdy / gdist * pullIntensity;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // Air resistance damping
        p.vy *= 0.94;
        
        p.life -= 0.015;
        p.opacity = Math.max(0, p.life);

        // Core absorption collision detection
        if (gdist < 28 && viewMode === 'atom') {
          // Absorbed! Trigger core scale bounce reaction pulse
          coreScaleRef.current = Math.min(1.4, coreScaleRef.current + 0.025);
          mps.splice(i, 1);
          continue;
        }

        if (p.life <= 0) {
          mps.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      // ----------------------------------------------------
      // DRAW MAIN NODES
      // ----------------------------------------------------
      nodes.forEach(node => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        ctx.shadowBlur = node.id === 'core' ? 30 : 20;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = hoveredNode?.id === node.id ? 3 : 1;
        ctx.stroke();
        ctx.restore();

        // Renders text descriptions
        if (node.level > 0 || node.id === 'core' || viewMode === 'alignment') {
          ctx.fillStyle = '#ffffff';
          ctx.font = node.id === 'core' ? 'bold 11px sans-serif' : '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y - node.radius - 6);
        }
      });

      animationFrameIdRef.current = requestAnimationFrame(animationLoop);
    };

    animationLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [viewMode, hoveredNode, report]);

  // Click Handler - Triggers dynamic gravity-attracted splashes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodesRef.current.forEach(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 12) {
        // Explode particles that fly outward first, then zoom into the core center
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 6; // Initial outward burst speed
          miniParticlesRef.current.push({
            x: node.x,
            y: node.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: node.color,
            size: 2.5 + Math.random() * 3,
            opacity: 1,
            life: 1.0
          });
        }

        const catCode = node.id.replace('cand-', '').replace('bench-', '');
        if (catCode !== 'core' && onNodeClick) {
          onNodeClick(catCode);
        }
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y };

    let foundNode: Node | null = null;
    nodesRef.current.forEach(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 12) {
        foundNode = node;
      }
    });

    setHoveredNode(foundNode);
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
    setHoveredNode(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="profile-form-container" 
      style={{ 
        position: 'relative', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '540px',
        background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.95) 0%, rgba(3, 7, 18, 0.95) 100%)',
        borderColor: 'rgba(59, 130, 246, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 0 40px rgba(6, 182, 212, 0.05)'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          zIndex: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: '14px',
          marginBottom: '10px'
        }}
      >
        <div>
          <span className="logo-badge" style={{ margin: 0, fontSize: '10px' }}>GRAVITATIONAL ORBIT SIMULATOR</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {viewMode === 'atom' ? 'Candidate Skill Atom Orbit' : 'Benchmark Skill Alignment Vector'}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ⚙ Physics Rules: Stronger skills orbit **closer** and **faster** to candidate core. Click nodes to boost!
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className={`profile-tab ${viewMode === 'atom' ? 'active' : ''}`}
            onClick={() => setViewMode('atom')}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            ⚛ Orbit View
          </button>
          <button 
            type="button" 
            className={`profile-tab ${viewMode === 'alignment' ? 'active' : ''}`}
            disabled={!report}
            onClick={() => setViewMode('alignment')}
            style={{ padding: '8px 14px', fontSize: '12px', opacity: report ? 1 : 0.4 }}
          >
            🎯 Alignment View
          </button>
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '420px', cursor: hoveredNode ? 'pointer' : 'default', zIndex: 5 }}
      />

      {hoveredNode && hoveredNode.id !== 'core' && (
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(3, 7, 18, 0.95)',
            border: `1px solid ${hoveredNode.color}40`,
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            width: '280px',
            zIndex: 20,
            backdropFilter: 'blur(12px)',
            boxShadow: `0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px ${hoveredNode.color}15`,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>
              Category: {hoveredNode.id.replace('cand-', '').replace('bench-', '')}
            </span>
            <span 
              className={`skill-category cat-${hoveredNode.id.replace('cand-', '').replace('bench-', '')}`}
              style={{ fontSize: '9px', padding: '2px 6px' }}
            >
              {hoveredNode.type === 'candidate' ? 'CANDIDATE' : 'BENCHMARK'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Skill Intensity Level: <strong style={{ color: hoveredNode.color }}>{hoveredNode.level} / 10</strong>
          </p>
          
          {hoveredNode.type === 'candidate' && profile && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ACTIVE SKILLS:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {profile.skills
                  .filter(s => s.category_code === hoveredNode.id.replace('cand-', ''))
                  .map((s, idx) => (
                    <span key={idx} style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '3px', color: '#fff' }}>
                      {s.skill_name}
                    </span>
                  ))}
                {profile.skills.filter(s => s.category_code === hoveredNode.id.replace('cand-', '')).length === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No active skills.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
