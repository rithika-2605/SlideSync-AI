// frontend/src/features/Viva/VivaSimulator.jsx
import React, { useState, useRef } from 'react';
import './VivaSimulator.css';

export default function VivaSimulator({ quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fitbAnswer, setFitbAnswer] = useState('');
  
  // Speech Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  
  // Grading State
  const [feedback, setFeedback] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  if (!quiz || quiz.length === 0) return null;
  const currentQ = quiz[currentIndex];

  // 1. Handle MCQ Selection
  const handleMcqSelect = (selected) => {
    const isCorrect = selected === currentQ.answer;
    setFeedback({
      type: isCorrect ? 'correct' : 'incorrect',
      message: isCorrect ? "Correct!" : `Incorrect. The answer is ${currentQ.answer}.`
    });
  };

  // 2. Handle Fill in the Blank
  const handleFitbSubmit = () => {
    const isCorrect = fitbAnswer.toLowerCase().trim() === currentQ.answer.toLowerCase().trim();
    setFeedback({
      type: isCorrect ? 'correct' : 'incorrect',
      message: isCorrect ? "Correct!" : `Incorrect. The answer is ${currentQ.answer}.`
    });
  };

  // 3. Handle Speech Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null); // Clear previous
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const submitSpeechAnswer = async () => {
    if (!audioBlob) return;
    setIsGrading(true);

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "answer.webm");
    formData.append("question", currentQ.question);

    try {
      const response = await fetch('http://localhost:8000/api/viva/grade_speech', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setFeedback({
        type: 'speech_result',
        score: data.score,
        transcript: data.transcript,
        message: data.feedback
      });
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'incorrect', message: "Error grading audio." });
    } finally {
      setIsGrading(false);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    setFitbAnswer('');
    setAudioBlob(null);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="viva-section">
      <div className="viva-card">
        
        <div className="viva-header">
          <h2 className="viva-title">👨‍🏫 Live Mock Viva</h2>
          <span className="viva-progress">Question {currentIndex + 1} of {quiz.length}</span>
        </div>

        <h3 className="viva-question">{currentQ.question}</h3>

        {/* --- RENDER MCQ --- */}
        {currentQ.type === 'mcq' && !feedback && (
          <div className="mcq-grid">
            {currentQ.options.map((opt, i) => (
              <button key={i} className="mcq-btn" onClick={() => handleMcqSelect(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* --- RENDER FILL IN THE BLANK --- */}
        {currentQ.type === 'fitb' && !feedback && (
          <div>
            <input 
              type="text" 
              className="fitb-input" 
              placeholder="Type your answer here..."
              value={fitbAnswer}
              onChange={(e) => setFitbAnswer(e.target.value)}
            />
            <button className="submit-btn" onClick={handleFitbSubmit}>Check Answer</button>
          </div>
        )}

        {/* --- RENDER SPEECH VIVA --- */}
        {currentQ.type === 'speech' && !feedback && (
          <div className="recorder-container">
            <p className="text-gray-500 text-sm">
              {isRecording ? "Recording... Click to stop." : "Click microphone to start recording your answer."}
            </p>
            
            <button 
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              🎤
            </button>

            {audioBlob && !isRecording && (
              <button className="submit-btn" onClick={submitSpeechAnswer} disabled={isGrading}>
                {isGrading ? "Transcribing & Grading... 🧠" : "Submit Audio Answer"}
              </button>
            )}
          </div>
        )}

        {/* --- RENDER FEEDBACK --- */}
        {feedback && (
          <div className="viva-results">
            {feedback.type === 'speech_result' && (
              <>
                <div className="score-display">Score: {feedback.score} / 10</div>
                <div className="transcript-box">" {feedback.transcript} "</div>
              </>
            )}
            <p className="feedback-text">{feedback.message}</p>
            
            {currentIndex < quiz.length - 1 ? (
              <button className="submit-btn" style={{marginTop: '1rem'}} onClick={nextQuestion}>Next Question ➔</button>
            ) : (
              <p style={{marginTop: '1rem', fontWeight: 'bold', color: '#16a34a'}}>🎉 Viva Completed!</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}