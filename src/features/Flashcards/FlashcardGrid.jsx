import React, { useState } from 'react';
import './FlashcardGrid.css';

export default function FlashcardGrid({ flashcards, onBookmark }) {
  // State to track which specific cards are flipped
  const [flippedCards, setFlippedCards] = useState({});

  const handleFlip = (index) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!flashcards || flashcards.length === 0) return null;

  return (
    <div className="premium-flashcard-section">
      <div className="section-header">
        <div className="icon-wrapper">✨</div>
        <h2 className="premium-title">AI Study Cards</h2>
      </div>
      
      <div className="premium-grid">
        {flashcards.map((card, index) => (
          <div 
            key={index} 
            className="card-scene"
            onClick={() => handleFlip(index)}
          >
            <div className={`card-object ${flippedCards[index] ? 'is-flipped' : ''}`}>
              
              {/* THE FRONT OF THE CARD (QUESTION) */}
              <div className="card-face card-front">
                <div className="card-content">
                  <span className="card-badge front-badge">Question {index + 1}</span>
                  <h3 className="question-text">{card.question}</h3>
                </div>
                
                {/* THE UPDATED FOOTER WITH THE BOOKMARK BUTTON */}
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="flip-hint">Click to reveal answer ↺</span>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); // This stops the card from flipping when you click the bookmark!
                      onBookmark(card); 
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                    title="Deep Dive / Bookmark"
                  >
                    🔖
                  </button>
                </div>
              </div>
              
              {/* THE BACK OF THE CARD (ANSWER) */}
              <div className="card-face card-back">
                <div className="card-content">
                  <span className="card-badge back-badge">Answer</span>
                  <p className="answer-text">{card.answer}</p>
                </div>
              </div>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}