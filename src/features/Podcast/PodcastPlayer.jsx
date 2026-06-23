// frontend/src/features/Podcast/PodcastPlayer.jsx
import React, { useState } from 'react';
import './PodcastPlayer.css';

export default function PodcastPlayer({ podcastData }) {
  const [showScript, setShowScript] = useState(false);

  if (!podcastData || !podcastData.audio_url) return null;

  return (
    <div className="podcast-section">
      <div className="podcast-card">
        
        <div className="podcast-artwork">
          🎧
        </div>
        
        <div className="podcast-content">
          <span className="podcast-badge">AI Audio Summary</span>
          <h2 className="podcast-title">5-Minute Lecture Recap</h2>
          
          <audio 
            className="custom-audio-player" 
            controls 
            src={podcastData.audio_url}
          >
            Your browser does not support the audio element.
          </audio>

          <button 
            className="podcast-script-toggle"
            onClick={() => setShowScript(!showScript)}
          >
            {showScript ? 'Hide Script' : 'Read Transcript'}
          </button>

          {showScript && (
            <div className="podcast-script-content">
              {podcastData.script}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}