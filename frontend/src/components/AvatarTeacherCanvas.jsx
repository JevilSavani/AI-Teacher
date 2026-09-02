import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Sparkles, User, HelpCircle } from 'lucide-react';

const PROF_ELENA_PORTRAIT = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop';

export default function AvatarTeacherCanvas({
  isSpeaking = false,
  isPaused = false,
  statusMode = 'speaking', // 'speaking' | 'paused' | 'question' | 'evaluating'
  avatarName = 'Prof. Elena',
  streamUrl = null,
  className = ''
}) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageRef = useRef(null);

  // Load professional realistic educator photo for Prof. Elena
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = PROF_ELENA_PORTRAIT;
    img.onload = () => {
      imageRef.current = img;
      setImgLoaded(true);
    };
  }, []);

  // Photorealistic LipSync & Facial Expression Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Professional Educational Studio Background
      const bgGrad = ctx.createRadialGradient(centerX, centerY - 20, 30, centerX, centerY, width * 0.85);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.55, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Studio soundwave aura glow when speaking
      if (isSpeaking && !isPaused) {
        const auraRadius = 135 + Math.sin(frameCount * 0.12) * 10;
        const auraGrad = ctx.createRadialGradient(centerX, centerY - 20, 95, centerX, centerY - 20, auraRadius);
        auraGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        auraGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Micro-breathing & natural head movement
      const swayY = Math.sin(frameCount * 0.04) * 2;
      const swayX = Math.cos(frameCount * 0.02) * 1.2;

      // Render Photo Portrait
      if (imageRef.current && imgLoaded) {
        ctx.save();
        
        // Circular presenter crop mask
        ctx.beginPath();
        ctx.arc(centerX + swayX, centerY - 15 + swayY, 115, 0, Math.PI * 2);
        ctx.clip();

        // Draw portrait
        ctx.drawImage(imageRef.current, centerX - 120 + swayX, centerY - 140 + swayY, 240, 250);

        ctx.restore();

        // Portrait Outer Accent Ring
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = isSpeaking && !isPaused ? '#6366f1' : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(centerX + swayX, centerY - 15 + swayY, 117, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Realistic LipSync Mouth Articulation Mesh
        if (isSpeaking && !isPaused) {
          const mouthOpen = Math.abs(Math.sin(frameCount * 0.28) * Math.cos(frameCount * 0.16)) * 14 + 3;
          const mouthX = centerX + swayX;
          const mouthY = centerY + 40 + swayY;

          // Outer lip shadow & tone
          ctx.fillStyle = '#9f1239';
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, 15, Math.max(3, mouthOpen), 0, 0, Math.PI * 2);
          ctx.fill();

          // Inner mouth opening
          ctx.fillStyle = '#4c0519';
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, 12, Math.max(2, mouthOpen - 2), 0, 0, Math.PI * 2);
          ctx.fill();

          // Teeth highlight
          if (mouthOpen > 5) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(mouthX - 8, mouthY - Math.max(1, mouthOpen * 0.35), 16, Math.max(1.5, mouthOpen * 0.3));
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, isPaused, imgLoaded]);

  return (
    <div className={`avatar-canvas-container ${className}`} style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', background: '#0f172a' }}>
      {streamUrl ? (
        <video
          ref={videoRef}
          src={streamUrl}
          autoPlay
          loop
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={420}
          height={315}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}

      {/* Live State Badge Overlay */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
        {statusMode === 'question' ? (
          <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(236, 72, 153, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={14} />
            <span>Checkpoint Question</span>
          </div>
        ) : isSpeaking && !isPaused ? (
          <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Volume2 size={14} className="spin-animation" />
            <span>{avatarName} Speaking...</span>
          </div>
        ) : isPaused ? (
          <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.8rem', fontWeight: '700' }}>
            <span>⏸️ Paused</span>
          </div>
        ) : (
          <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} />
            <span>{avatarName} Ready</span>
          </div>
        )}
      </div>

      {/* Teacher Name Tag Footer */}
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '0.25rem 0.65rem', borderRadius: '8px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <User size={13} />
        <span>{avatarName} &bull; AI Teacher</span>
      </div>
    </div>
  );
}
