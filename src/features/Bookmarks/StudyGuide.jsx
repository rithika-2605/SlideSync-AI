// frontend/src/features/Bookmarks/StudyGuide.jsx
import React from 'react';
import './StudyGuide.css';

export default function StudyGuide({ bookmarks }) {
  if (!bookmarks || bookmarks.length === 0) return null;

  return (
    <div className="study-guide-section">
      <div className="guide-header">
        <div className="guide-icon">📚</div>
        <h2 className="guide-title">Master Study Guide</h2>
      </div>

      {bookmarks.map((mark, index) => (
        <div key={index} className="bookmark-entry">
          <h3 className="entry-title">{mark.title}</h3>
          <p className="entry-definition">{mark.definition}</p>
          
          <div className="entry-subtitle">Key Points</div>
          <ul className="entry-list">
            {mark.key_points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>

          <div className="entry-subtitle">Example / Analogy</div>
          <p className="entry-example">"{mark.example}"</p>
        </div>
      ))}
    </div>
  );
}