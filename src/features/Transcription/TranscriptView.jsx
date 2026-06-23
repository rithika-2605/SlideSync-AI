// frontend/src/features/Transcription/TranscriptView.jsx
import React from 'react';
import './TranscriptView.css';

export default function TranscriptView({ transcript }) {
  if (!transcript) return null;

  return (
    <div className="transcript-section">
      <div className="transcript-header">
        <div className="transcript-icon">🎙️</div>
        <h2 className="transcript-title">Lecture Transcript</h2>
      </div>
      
      <div className="transcript-paper">
        <div className="transcript-text">
          {transcript}
        </div>
      </div>
    </div>
  );
}