import React from 'react';
import VisualExplanation from './VisualExplanation';

/**
 * MarkdownRenderer component
 * Cleans and renders raw markdown text without displaying raw symbols (##, **, ```, etc.)
 * Supports headings, GFM comparison tables, lists, syntax code blocks, callouts, and SVG/Mermaid diagrams.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;
  const textContent = typeof content === 'string' ? content : String(content);

  // Split by code block fences ``` ... ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(textContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'markdown',
        text: textContent.substring(lastIndex, match.index)
      });
    }

    const lang = (match[1] || '').trim().toLowerCase();
    const codeBody = match[2].trim();

    if (lang === 'mermaid' || /^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|timeline|mindmap)\b/i.test(codeBody)) {
      parts.push({
        type: 'visual',
        visual: {
          type: 'mermaid',
          title: 'Diagram',
          content: codeBody
        }
      });
    } else if (lang === 'svg' || (codeBody.includes('<svg') && codeBody.includes('</svg>'))) {
      parts.push({
        type: 'visual',
        visual: {
          type: 'svg',
          title: 'Visual Diagram',
          content: codeBody
        }
      });
    } else {
      parts.push({
        type: 'visual',
        visual: {
          type: 'code',
          language: lang || 'code',
          content: codeBody
        }
      });
    }

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < textContent.length) {
    parts.push({
      type: 'markdown',
      text: textContent.substring(lastIndex)
    });
  }

  // Helper to format inline markdown (bold, italic, inline code)
  const renderFormattedInlineText = (text) => {
    if (!text) return null;

    // Split by inline code `...`
    const inlineCodeParts = text.split(/`([^`]+)`/g);
    
    return inlineCodeParts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <code 
            key={i} 
            style={{ 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: 'var(--primary-light, #a5b4fc)', 
              padding: '0.15rem 0.4rem', 
              borderRadius: '4px', 
              fontSize: '0.875em', 
              fontFamily: 'Consolas, Monaco, monospace' 
            }}
          >
            {part}
          </code>
        );
      }

      // Process bold **text** and italic *text*
      const boldParts = part.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, j) => {
        if (j % 2 === 1) {
          return <strong key={j} style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{bPart}</strong>;
        }

        const italicParts = bPart.split(/\*([^*]+)\*/g);
        return italicParts.map((iPart, k) => {
          if (k % 2 === 1) {
            return <em key={k}>{iPart}</em>;
          }
          return iPart;
        });
      });
    });
  };

  // Helper to parse GFM Markdown Table
  const renderMarkdownTable = (lines, tableKey) => {
    const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
    const rows = lines.slice(2).map(rowLine => {
      return rowLine.split('|').map(c => c.trim()).filter(Boolean);
    });

    return (
      <div key={`table-${tableKey}`} style={{ overflowX: 'auto', margin: '1.25rem 0', borderRadius: '10px', border: '1px solid var(--border-color, #334155)', background: 'var(--bg-secondary, #1e293b)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead style={{ background: '#0f172a', color: 'var(--primary-light, #818cf8)' }}>
            <tr>
              {headers.map((h, hIdx) => (
                <th key={hIdx} style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #334155', fontWeight: '700' }}>
                  {renderFormattedInlineText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid #334155', background: rIdx % 2 === 0 ? 'var(--bg-primary, #0f172a)' : 'rgba(255,255,255,0.02)' }}>
                {r.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '0.75rem 1rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {renderFormattedInlineText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render a block of markdown lines
  const renderMarkdownBlock = (blockText, blockKey) => {
    const lines = blockText.split('\n');
    const elements = [];
    let currentList = [];
    let isNumberedList = false;

    let tableLines = [];
    let inTable = false;

    const flushList = (keyPrefix) => {
      if (currentList.length > 0) {
        if (isNumberedList) {
          elements.push(
            <ol key={`${keyPrefix}-ol`} style={{ margin: '0.5rem 0 1rem 1.5rem', paddingLeft: '0.5rem', color: 'var(--text-primary)' }}>
              {currentList.map((item, idx) => <li key={idx} style={{ marginBottom: '0.35rem' }}>{renderFormattedInlineText(item)}</li>)}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`${keyPrefix}-ul`} style={{ margin: '0.5rem 0 1rem 1.5rem', paddingLeft: '0.5rem', color: 'var(--text-primary)' }}>
              {currentList.map((item, idx) => <li key={idx} style={{ marginBottom: '0.35rem' }}>{renderFormattedInlineText(item)}</li>)}
            </ul>
          );
        }
        currentList = [];
      }
    };

    const flushTable = (keyPrefix) => {
      if (tableLines.length >= 3) {
        elements.push(renderMarkdownTable(tableLines, keyPrefix));
      }
      tableLines = [];
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(`before-table-${idx}`);
        inTable = true;
        tableLines.push(trimmed);
        return;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      if (!trimmed) {
        flushList(`line-${idx}`);
        return;
      }

      // Check Key Takeaway or Callout
      if (trimmed.startsWith('💡') || trimmed.startsWith('>')) {
        flushList(`callout-${idx}`);
        const calloutText = trimmed.replace(/^💡\s*|>+\s*/, '');
        elements.push(
          <div key={`callout-${idx}`} style={{ margin: '1rem 0', padding: '0.85rem 1.2rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', borderLeft: '4px solid var(--primary, #6366f1)', color: 'var(--text-primary)' }}>
            <span style={{ fontWeight: '700', color: 'var(--primary-light, #818cf8)' }}>💡 Key Takeaway: </span>
            {renderFormattedInlineText(calloutText)}
          </div>
        );
        return;
      }

      // Headings: ###, ##, #
      if (trimmed.startsWith('#')) {
        flushList(`heading-${idx}`);
        const level = trimmed.match(/^#+/)?.[0].length || 1;
        const headingText = trimmed.replace(/^#+\s*/, '');
        
        if (level === 1) {
          elements.push(<h2 key={idx} style={{ fontSize: '1.35rem', fontWeight: '800', margin: '1.25rem 0 0.75rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>{renderFormattedInlineText(headingText)}</h2>);
        } else if (level === 2) {
          elements.push(<h3 key={idx} style={{ fontSize: '1.15rem', fontWeight: '700', margin: '1rem 0 0.5rem', color: 'var(--text-primary)' }}>{renderFormattedInlineText(headingText)}</h3>);
        } else {
          elements.push(<h4 key={idx} style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0.85rem 0 0.4rem', color: 'var(--primary-light)' }}>{renderFormattedInlineText(headingText)}</h4>);
        }
        return;
      }

      // Bullet List (- or *)
      if (/^[\*\-]\s+/.test(trimmed)) {
        if (isNumberedList && currentList.length > 0) flushList(`bullet-${idx}`);
        isNumberedList = false;
        currentList.push(trimmed.replace(/^[\*\-]\s+/, ''));
        return;
      }

      // Numbered List (1. 2.)
      if (/^\d+\.\s+/.test(trimmed)) {
        if (!isNumberedList && currentList.length > 0) flushList(`num-${idx}`);
        isNumberedList = true;
        currentList.push(trimmed.replace(/^\d+\.\s+/, ''));
        return;
      }

      // Regular paragraph line
      flushList(`para-${idx}`);
      elements.push(
        <p key={idx} style={{ margin: '0.6rem 0', lineHeight: '1.7', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          {renderFormattedInlineText(trimmed)}
        </p>
      );
    });

    if (inTable) flushTable(`final-table-${blockKey}`);
    flushList(`final-${blockKey}`);
    return elements;
  };

  return (
    <div className={`rendered-markdown ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'visual') {
          return <VisualExplanation key={index} visual={part.visual} />;
        }
        return <React.Fragment key={index}>{renderMarkdownBlock(part.text, index)}</React.Fragment>;
      })}
    </div>
  );
}
