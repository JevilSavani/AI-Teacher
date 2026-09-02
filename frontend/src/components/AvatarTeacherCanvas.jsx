import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Sparkles, User, HelpCircle } from 'lucide-react';

export default function AvatarTeacherCanvas({
  isSpeaking = false,
  isPaused = false,
  statusMode = 'speaking', // 'speaking' | 'paused' | 'question' | 'evaluating'
  avatarName = 'Prof. Elena',
  className = ''
}) {
  const canvasRef = useRef(null);
  const [mouthOpenRatio, setMouthOpenRatio] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let frameCount = 0;
    let blinkTimer = 0;
    let isBlinking = false;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Studio Background Glow Gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY - 20, 30, centerX, centerY, width * 0.7);
      bgGradient.addColorStop(0, '#1e293b');
      bgGradient.addColorStop(0.6, '#0f172a');
      bgGradient.addColorStop(1, '#020617');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient sound wave aura around teacher head
      if (isSpeaking && !isPaused) {
        const auraRadius = 110 + Math.sin(frameCount * 0.1) * 8;
        const auraGrad = ctx.createRadialGradient(centerX, centerY - 20, 90, centerX, centerY - 20, auraRadius);
        auraGrad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
        auraGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head swaying & breathing motion
      const headOffsetY = Math.sin(frameCount * 0.04) * 3;
      const headOffsetX = Math.cos(frameCount * 0.02) * 1.5;

      // 2. Shoulders & Suit (Prof. Elena Academic Attire)
      ctx.fillStyle = '#312e81'; // Deep indigo jacket
      ctx.beginPath();
      ctx.ellipse(centerX, height + 40, 160, 110, 0, Math.PI, 0, true);
      ctx.fill();

      // Shirt collar
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(centerX - 35, height - 40);
      ctx.lineTo(centerX, height - 10);
      ctx.lineTo(centerX + 35, height - 40);
      ctx.lineTo(centerX, height - 60);
      ctx.closePath();
      ctx.fill();

      // 3. Neck
      ctx.fillStyle = '#fbcfe8'; // Skin tone
      ctx.fillRect(centerX - 22 + headOffsetX, centerY + 45 + headOffsetY, 44, 40);

      // 4. Face Shape
      const headY = centerY - 25 + headOffsetY;
      const headX = centerX + headOffsetX;

      ctx.fillStyle = '#fde68a'; // Warm face tone
      ctx.beginPath();
      ctx.ellipse(headX, headY, 68, 85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft cheek blush
      ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
      ctx.beginPath();
      ctx.arc(headX - 35, headY + 15, 16, 0, Math.PI * 2);
      ctx.arc(headX + 35, headY + 15, 16, 0, Math.PI * 2);
      ctx.fill();

      // 5. Hair (Prof. Elena Styled Dark Hair)
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(headX, headY - 15, 78, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();

      // Side hair locks
      ctx.beginPath();
      ctx.ellipse(headX - 65, headY + 10, 22, 60, 0.2, 0, Math.PI * 2);
      ctx.ellipse(headX + 65, headY + 10, 22, 60, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 6. Eyes & Eyebrows
      // Blinking animation logic
      blinkTimer++;
      if (blinkTimer > 180 && Math.random() < 0.1) {
        isBlinking = true;
        blinkTimer = 0;
      }
      if (blinkTimer > 10) {
        isBlinking = false;
      }

      ctx.fillStyle = '#1e293b'; // Eyebrows
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(headX - 45, headY - 20);
      ctx.quadraticCurveTo(headX - 30, headY - 28, headX - 15, headY - 20);
      ctx.moveTo(headX + 15, headY - 20);
      ctx.quadraticCurveTo(headX + 30, headY - 28, headX + 45, headY - 20);
      ctx.stroke();

      if (isBlinking) {
        // Closed eyes
        ctx.beginPath();
        ctx.moveTo(headX - 42, headY - 2);
        ctx.lineTo(headX - 18, headY - 2);
        ctx.moveTo(headX + 18, headY - 2);
        ctx.lineTo(headX + 42, headY - 2);
        ctx.stroke();
      } else {
        // Open eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(headX - 30, headY - 4, 13, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(headX + 30, headY - 4, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (moving subtly)
        const eyeLookX = Math.sin(frameCount * 0.03) * 2;
        ctx.fillStyle = '#4338ca'; // Intelligent iris
        ctx.beginPath();
        ctx.arc(headX - 30 + eyeLookX, headY - 4, 6, 0, Math.PI * 2);
        ctx.arc(headX + 30 + eyeLookX, headY - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye catchlight sparkles
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headX - 32 + eyeLookX, headY - 6, 2, 0, Math.PI * 2);
        ctx.arc(headX + 28 + eyeLookX, headY - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glasses (Prof. Elena Teacher Glasses)
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(headX - 48, headY - 16, 34, 24);
      ctx.strokeRect(headX + 14, headY - 16, 34, 24);
      ctx.beginPath();
      ctx.moveTo(headX - 14, headY - 6);
      ctx.lineTo(headX + 14, headY - 6);
      ctx.stroke();

      // Nose
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(headX, headY + 2);
      ctx.lineTo(headX - 4, headY + 18);
      ctx.lineTo(headX + 2, headY + 18);
      ctx.stroke();

      // 7. Lip-Sync Mouth Animation
      let targetMouthOpen = 0;
      if (isSpeaking && !isPaused) {
        // Dynamic mouth opening simulation based on voice speech cycle
        targetMouthOpen = Math.abs(Math.sin(frameCount * 0.25) * Math.cos(frameCount * 0.15)) * 18 + 4;
      }
      setMouthOpenRatio(targetMouthOpen);

      const mouthY = headY + 36;
      ctx.fillStyle = '#be123c'; // Lip color

      if (targetMouthOpen > 2) {
        // Speaking open mouth
        ctx.beginPath();
        ctx.ellipse(headX, mouthY, 18, Math.max(3, targetMouthOpen), 0, 0, Math.PI * 2);
        ctx.fill();

        // Teeth detail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(headX - 12, mouthY - Math.max(1, targetMouthOpen / 2), 24, Math.max(2, targetMouthOpen / 3));
      } else {
        // Gentle smiling closed mouth
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(headX - 16, mouthY);
        ctx.quadraticCurveTo(headX, mouthY + 8, headX + 16, mouthY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, isPaused]);

  return (
    <div className={`avatar-canvas-container ${className}`} style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', background: '#0f172a' }}>
      <canvas
        ref={canvasRef}
        width={420}
        height={315}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

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
