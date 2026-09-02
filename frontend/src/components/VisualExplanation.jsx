import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, CheckCircle, AlertTriangle, Search, Eye, Zap, 
  BookOpen, Target, Award, ArrowRight, Code, Copy, Check, Info
} from 'lucide-react';

const ICON_MAP = {
  'sparkles': Sparkles,
  'check-circle': CheckCircle,
  'check': CheckCircle,
  'alert-triangle': AlertTriangle,
  'search': Search,
  'eye': Eye,
  'zap': Zap,
  'book-open': BookOpen,
  'target': Target,
  'award': Award,
  'arrow-right': ArrowRight,
  'code': Code,
  'info': Info
};

export default function VisualExplanation({ visual, title, caption }) {
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [mermaidError, setMermaidError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const visualData = typeof visual === 'string' ? { content: visual } : (visual || {});
  let rawContent = (visualData.content || '').trim();
  let explicitType = (visualData.type || '').toLowerCase();
  const displayTitle = title || visualData.title || 'Visual Diagram';
  const displayCaption = caption || visualData.caption || '';
  const steps = visualData.steps || [];

  // Clean raw content by removing wrapping markdown code fences
  let cleanContent = rawContent
    .replace(/^```(mermaid|svg|xml|html|code|\w+)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  // Detect SVG tag directly
  const hasSvgTag = cleanContent.includes('<svg') && cleanContent.includes('</svg>');
  if (hasSvgTag) {
    explicitType = 'svg';
  } else if (/^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|timeline|mindmap|pie|gitGraph)\b/i.test(cleanContent)) {
    explicitType = 'mermaid';
  } else if (!explicitType) {
    explicitType = steps.length > 0 ? 'html_steps' : (cleanContent ? 'code' : 'html_steps');
  }

  // Render Mermaid Diagram dynamically
  useEffect(() => {
    if (explicitType === 'mermaid' && cleanContent && !mermaidError) {
      let isMounted = true;
      const renderDiagram = async () => {
        try {
          const mermaidModule = await import('mermaid');
          const mermaid = mermaidModule.default;
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, sans-serif'
          });
          const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, cleanContent);
          if (isMounted) {
            setMermaidSvg(svg);
          }
        } catch (err) {
          console.warn('[VisualExplanation] Mermaid render error, switching to HTML diagram fallback:', err);
          if (isMounted) {
            setMermaidError(true);
          }
        }
      };
      renderDiagram();
      return () => { isMounted = false; };
    }
  }, [explicitType, cleanContent]);

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse Mermaid nodes/arrows into a clean visual HTML step flow when Mermaid rendering fails
  const renderFallbackFlow = (text) => {
    const rawLines = text.split('\n').filter(l => l.includes('-->') || l.includes('->') || l.includes('==>') || l.includes(':'));
    const parsedSteps = [];

    rawLines.forEach((line) => {
      // Extract node texts e.g. A["Create Object"] --> B["Acquire Resource"]
      const parts = line.split(/-->|->|==>|:/).map(p => p.replace(/["'\[\]\{\}\(\)]/g, '').trim()).filter(Boolean);
      parts.forEach(p => {
        // Strip node IDs like A or B if format is A[Title]
        const cleanTitle = p.replace(/^[A-Za-z0-9_]+\s+/, '').trim() || p;
        if (cleanTitle && !parsedSteps.includes(cleanTitle) && !/^(graph|flowchart|TD|LR|TB|RL)\b/i.test(cleanTitle)) {
          parsedSteps.push(cleanTitle);
        }
      });
    });

    const displayItems = parsedSteps.length > 0 ? parsedSteps : [displayTitle];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {displayItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.65rem 1rem', 
                  borderRadius: '8px', 
                  background: 'var(--bg-primary, #0f172a)', 
                  border: '1px solid var(--primary, #6366f1)',
                  color: 'var(--text-primary, #f8fafc)',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary, #6366f1)', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx + 1}
                </div>
                <span>{item}</span>
              </div>
              {idx < displayItems.length - 1 && (
                <ArrowRight size={18} color="var(--primary-light, #818cf8)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // 1. SVG Diagram Rendering
  if (explicitType === 'svg' && hasSvgTag) {
    const svgMatch = cleanContent.match(/<svg[\s\S]*?<\/svg>/i);
    const svgString = svgMatch ? svgMatch[0] : cleanContent;

    return (
      <div className="visual-card svg-visual-card" style={{ margin: '1.25rem 0', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)', textAlign: 'center' }}>
        {displayTitle && (
          <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            📊 {displayTitle}
          </h4>
        )}
        <div 
          dangerouslySetInnerHTML={{ __html: svgString }} 
          style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }} 
        />
        {displayCaption && (
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            💡 {displayCaption}
          </p>
        )}
      </div>
    );
  }

  // 2. Mermaid Diagram Rendering
  if (explicitType === 'mermaid' && !mermaidError && mermaidSvg) {
    return (
      <div className="visual-card mermaid-visual-card" style={{ margin: '1.25rem 0', padding: '1.25rem', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
          <Zap size={16} color="#818cf8" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc' }}>
            {displayTitle}
          </h4>
        </div>
        <div 
          dangerouslySetInnerHTML={{ __html: mermaidSvg }} 
          style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }} 
        />
        {displayCaption && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
            💡 {displayCaption}
          </p>
        )}
      </div>
    );
  }

  // 3. HTML Step-by-Step Cards
  if (explicitType === 'html_steps' || steps.length > 0) {
    return (
      <div className="visual-card steps-visual-card" style={{ margin: '1.25rem 0', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={18} color="var(--primary-light, #818cf8)" />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {displayTitle}
          </h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((step, idx) => {
            const IconComp = ICON_MAP[step.icon] || ArrowRight;
            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.85rem', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '8px', 
                  background: 'var(--bg-primary, #0f172a)', 
                  borderLeft: '4px solid var(--primary, #6366f1)' 
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                  {step.step_number || (idx + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <IconComp size={15} color="var(--primary-light, #818cf8)" />
                    {step.title}
                  </div>
                  {step.description && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {displayCaption && (
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            💡 {displayCaption}
          </p>
        )}
      </div>
    );
  }

  // 4. Code Block Rendering (with clean syntax title and copy button)
  if (explicitType === 'code' && cleanContent) {
    // Determine language name cleanly
    let lang = visualData.language || 'code';
    if (lang.toLowerCase() === 'cpp' || lang.toLowerCase() === 'c++') lang = 'C++';
    else if (lang.toLowerCase() === 'js' || lang.toLowerCase() === 'javascript') lang = 'JavaScript';
    else if (lang.toLowerCase() === 'py' || lang.toLowerCase() === 'python') lang = 'Python';
    else if (lang.toLowerCase() === 'sql') lang = 'SQL';
    else lang = lang.toUpperCase();

    return (
      <div className="visual-card code-visual-card" style={{ margin: '1.25rem 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', background: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💻 {lang}
          </span>
          <button 
            onClick={() => handleCopyCode(cleanContent)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <pre style={{ margin: 0, padding: '1.25rem', overflowX: 'auto', fontSize: '0.9rem', lineHeight: '1.6', color: '#e2e8f0', fontFamily: 'Consolas, Monaco, "Andale Mono", monospace' }}>
          <code>{cleanContent}</code>
        </pre>
        {displayCaption && (
          <p style={{ margin: 0, padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#94a3b8', background: '#1e293b', borderTop: '1px solid #334155' }}>
            💡 {displayCaption}
          </p>
        )}
      </div>
    );
  }

  // 5. Clean Visual Fallback Diagram (for Mermaid/SVG errors or unrendered visuals - NEVER displays raw source code)
  return (
    <div className="visual-card fallback-visual-card" style={{ margin: '1.25rem 0', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <Sparkles size={18} color="var(--primary-light, #818cf8)" />
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {displayTitle}
        </h4>
      </div>
      {renderFallbackFlow(cleanContent)}
      {displayCaption && (
        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          💡 {displayCaption}
        </p>
      )}
    </div>
  );
}
