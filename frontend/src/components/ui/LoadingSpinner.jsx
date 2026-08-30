import React from 'react';

/**
 * LoadingSpinner component.
 * Can be inline or full-screen centered.
 */
export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-wrapper">
          <div className="spinner" aria-label="Loading" />
          {message && <p className="spinner-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-inline">
      <div className="spinner spinner-sm" aria-label="Loading" />
    </div>
  );
}
