import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, AlertCircle } from 'lucide-react';
import speechService from '../utils/speechService';

export default function VoicePlayer({ text, language = 'English', compact = false, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = speechService.subscribe(({ isPlaying: playing, isPaused: paused }) => {
      setIsPlaying(playing);
      setIsPaused(paused);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Stop speech when component unmounts or text changes
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, [text]);

  const handlePlay = () => {
    setError('');
    if (!text) {
      setError('No lesson content available to read.');
      return;
    }

    if (isPaused) {
      speechService.resume();
    } else {
      speechService.speak(text, language, {
        onError: (err) => setError(err.message || 'Failed to read aloud.')
      });
    }
  };

  const handlePause = () => {
    speechService.pause();
  };

  const handleStop = () => {
    speechService.stop();
  };

  if (!speechService.isSupported()) {
    return null; // Gracefully hide if browser doesn't support SpeechSynthesis
  }

  if (compact) {
    return (
      <div className={`voice-player-compact ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="btn-secondary"
            title={`Read aloud in ${language}`}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Volume2 size={15} color="var(--primary-light, #818cf8)" />
            <span>Listen</span>
          </button>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99, 102, 241, 0.12)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--primary, #6366f1)' }}>
            <button
              onClick={isPaused ? handlePlay : handlePause}
              style={{ background: 'none', border: 'none', color: 'var(--primary-light, #818cf8)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              onClick={handleStop}
              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Stop"
            >
              <Square size={14} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary-light, #818cf8)' }}>
              {isPaused ? 'Paused' : 'Speaking...'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`voice-player-card ${className}`} style={{ margin: '0.85rem 0', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Volume2 size={16} color="var(--primary-light, #818cf8)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Voice Explanation ({language})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isPlaying ? (isPaused ? 'Playback paused' : 'Reading lesson aloud...') : 'Click Listen to hear explanation'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="btn-primary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Volume2 size={15} />
            <span>🔊 Listen</span>
          </button>
        ) : (
          <>
            <button
              onClick={isPaused ? handlePlay : handlePause}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={handleStop}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              <Square size={14} />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.2rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
