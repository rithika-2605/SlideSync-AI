import React, { useState, useEffect } from "react";
import FlashcardGrid from "./features/Flashcards/FlashcardGrid";
import TranscriptView from "./features/Transcription/TranscriptView";
import MindMapView from "./features/MindMap/MindMapView";
import PodcastPlayer from "./features/Podcast/PodcastPlayer";
import VivaSimulator from "./features/Viva/VivaSimulator";
import StudyGuide from "./features/Bookmarks/StudyGuide";
import "./App.css";

export default function App() {
  // --- AUTHENTICATION STATES & PERSISTENCE ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("slidesync_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoginView, setIsLoginView] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  // --- RUNTIME APPLICATION STATES ---
  const [activeTab, setActiveTab] = useState("upload");
  const [audioFile, setAudioFile] = useState(null);
  const [slideFile, setSlideFile] = useState(null);
  const [status, setStatus] = useState("");

  // Model Data Output Repositories
  const [flashcards, setFlashcards] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [mindmap, setMindmap] = useState(null);
  const [podcast, setPodcast] = useState(null);
  const [vivaQuiz, setVivaQuiz] = useState(null);

  // Database State Caches
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);

  // --- SIDE EFFECTS CONTROL ---
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch bookmarks and history from MongoDB (Only triggers AFTER successful login)
  useEffect(() => {
    if (!user) return; 

    const fetchData = async () => {
      try {
        const [bmRes, histRes] = await Promise.all([
          // --- THE FIX: Append user email as a URL query parameter string ---
          fetch(`http://localhost:8000/api/bookmarks?email=${user.email}`),
          // -----------------------------------------------------------------
          fetch(`http://localhost:8000/api/history?email=${user.email}`)
        ]);
        if (bmRes.ok) setBookmarks(await bmRes.json());
        if (histRes.ok) setHistory(await histRes.json());
      } catch (error) {
        console.error("Database connection error:", error);
      }
    };
    fetchData();
  }, [user]);

  // --- HANDLERS PIPELINE ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isLoginView ? "/api/login" : "/api/register";

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail);

      setUser(data.user);
      localStorage.setItem("slidesync_user", JSON.stringify(data.user));
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("slidesync_user");
    setFlashcards(null);
    setTranscript(null);
    setMindmap(null);
    setPodcast(null);
    setVivaQuiz(null);
    setActiveTab("upload");
  };

 const handleBookmark = async (card) => {
    setStatus(`🔖 Expanding "${card.question}" for your Study Guide...`);
    try {
      const response = await fetch('http://localhost:8000/api/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // --- THE FIX: Include user email inside the JSON request body string ---
        body: JSON.stringify({ 
          concept: card.question + " " + card.answer,
          email: user.email 
        }),
        // ----------------------------------------------------------------------
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate study note.");
      }

      setBookmarks(prev => [...prev, data]);
      setStatus('✅ Added to Master Study Guide!');
      setActiveTab('studyguide');
    } catch (error) {
      console.error(error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!audioFile && !slideFile) {
      setStatus("Please upload at least one file to begin.");
      return;
    }

    setStatus("AI is processing your materials... 🧠");
    const formData = new FormData();
    if (audioFile) formData.append("audio_file", audioFile);
    if (slideFile) formData.append("slide_file", slideFile);
    if (user?.email) formData.append("user_email", user.email);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "The backend server encountered an error.",
        );
      }

      setStatus(`Success! Mode: ${data.mode}`);

      setFlashcards(data.flashcards);
      setTranscript(data.transcript);
      setMindmap(data.mindmap);
      setPodcast(data.podcast);
      setVivaQuiz(data.viva_quiz);

      setActiveTab("flashcards");

      fetch(`http://localhost:8000/api/history?email=${user.email}`)
        .then((res) => res.json())
        .then((data) => setHistory(data))
        .catch((err) => console.error(err));
    } catch (error) {
      console.error(error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const loadPastSession = (session) => {
    setFlashcards(session.flashcards);
    setTranscript(session.transcript);
    setMindmap(session.mindmap);
    setPodcast(session.podcast);
    setVivaQuiz(session.viva_quiz);
    setStatus(`Loaded past session: ${session.title}`);
    setActiveTab("flashcards");
  };

  // --- RENDER 1: THE ANIMATED CINEMATIC SPLASH SCREEN ---
  if (showSplash) {
    return (
      <div className="splash-container">
        <div className="splash-content">
          {/* Logo enters with a crisp pop-and-scale animation */}
          <img
            src="/logo.jpeg"
            alt="SlideSync AI Logo"
            className="splash-logo-img"
          />

          {/* Text slides up smoothly right after the logo settles */}
          <h1 className="splash-title-text">SlideSync AI</h1>
        </div>
      </div>
    );
  }

  // --- RENDER 2: AUTHENTICATION WALL ---
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLoginView ? "Welcome Back" : "Create Account"}</h2>
            <p>
              {isLoginView
                ? "Sign in to access your study materials."
                : "Join SlideSync and learn faster."}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="file-input"
                  style={{ cursor: "text" }}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="file-input"
                style={{ cursor: "text" }}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="file-input"
                style={{ cursor: "text" }}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
              />
            </div>

            {authError && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                {authError}
              </div>
            )}

            <button type="submit" className="submit-btn">
              {isLoginView ? "Sign In ✨" : "Create Account 🚀"}
            </button>
          </form>

          <div className="auth-toggle">
            {isLoginView
              ? "Don't have an account?"
              : "Already have an account?"}
            <span
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError("");
              }}
            >
              {isLoginView ? "Sign up" : "Log in"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 3: DASHBOARD CONTAINER ---
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand-container">
          <img src="/logo.jpeg" alt="SlideSync AI Logo" className="sidebar-brand-logo" />
          <span className="sidebar-brand-text">SlideSync AI</span>
        </div>
        <ul className="nav-menu">
          <li
            className={`nav-item ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            📤 New Upload
          </li>
          <div className="nav-divider"></div>
          <li
            className={`nav-item ${activeTab === "flashcards" ? "active" : ""}`}
            onClick={() => setActiveTab("flashcards")}
          >
            🗂️ Flashcards
          </li>
          <li
            className={`nav-item ${activeTab === "studyguide" ? "active" : ""}`}
            onClick={() => setActiveTab("studyguide")}
          >
            📚 Study Guide
          </li>
          <li
            className={`nav-item ${activeTab === "mindmap" ? "active" : ""}`}
            onClick={() => setActiveTab("mindmap")}
          >
            🕸️ Concept Map
          </li>
          <li
            className={`nav-item ${activeTab === "podcast" ? "active" : ""}`}
            onClick={() => setActiveTab("podcast")}
          >
            🎧 Audio Recap
          </li>
          <li
            className={`nav-item ${activeTab === "viva" ? "active" : ""}`}
            onClick={() => setActiveTab("viva")}
          >
            👨‍🏫 Mock Viva
          </li>
          <li
            className={`nav-item ${activeTab === "transcript" ? "active" : ""}`}
            onClick={() => setActiveTab("transcript")}
          >
            📝 Transcript
          </li>
          <div className="nav-divider"></div>
          <li
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            🕰️ History
          </li>
        </ul>
      </aside>

      <main className="main-content">
        {/* THE TOP NAVIGATION BAR */}
        <header className="top-bar">
          {/* CLEANED: Removed the old greeting-container and image entirely */}
          <div className="greeting">
            <h2>Welcome back, {user?.name ? user.name.split(' ')[0] : 'Learner'}! 👋</h2>
            <p>Ready to conquer your next study session?</p>
          </div>
          
          <div className="profile-widget" onClick={handleLogout} title="Click to Log Out">
            <div className="profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="profile-name">{user?.name || "User"}</span>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '0.5rem' }}>Logout</span>
          </div>
        </header>

        {/* VIEW 1: UPLOAD BOX */}
        {activeTab === "upload" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <div className="upload-box">
              <h1 className="upload-title">New Study Session</h1>
              <p className="upload-subtitle">
                Upload an audio recording, a slide deck, or both.
              </p>
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label className="form-label">Lecture Audio (Optional)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="file-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slide Deck (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.pptx"
                    onChange={(e) => setSlideFile(e.target.files[0])}
                    className="file-input"
                  />
                </div>
                <button type="submit" className="submit-btn">
                  Generate Materials ✨
                </button>
              </form>
              {status && <div className="status-message">{status}</div>}
            </div>
          </div>
        )}

        {/* VIEW 2: FLASHCARDS GRID */}
        {activeTab === "flashcards" &&
          (flashcards && flashcards.length > 0 ? (
            <FlashcardGrid
              flashcards={flashcards}
              onBookmark={handleBookmark}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🗂️</div>
              <h2>No Flashcards Generated</h2>
              <p>Upload a lecture file to populate cards.</p>
            </div>
          ))}

        {/* VIEW 3: STUDY GUIDE */}
        {activeTab === "studyguide" &&
          (bookmarks && bookmarks.length > 0 ? (
            <StudyGuide bookmarks={bookmarks} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h2>Your Guide is Empty</h2>
              <p>
                Click the 🔖 Bookmark icon on any flashcard to build your guide.
              </p>
            </div>
          ))}

        {/* VIEW 4: MIND MAP */}
        {activeTab === "mindmap" &&
          (mindmap && Object.keys(mindmap).length > 0 ? (
            <MindMapView mapData={mindmap} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🕸️</div>
              <h2>No Concept Map</h2>
              <p>Upload a lecture to visualize connections.</p>
            </div>
          ))}

        {/* VIEW 5: PODCAST */}
        {activeTab === "podcast" &&
          (podcast ? (
            <PodcastPlayer podcastData={podcast} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎧</div>
              <h2>No Audio Available</h2>
              <p>Upload a lecture to generate an AI podcast recap.</p>
            </div>
          ))}

        {/* VIEW 6: MOCK VIVA */}
        {activeTab === "viva" &&
          (vivaQuiz && Object.keys(vivaQuiz).length > 0 ? (
            <VivaSimulator quiz={vivaQuiz} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍🏫</div>
              <h2>No Quiz Generated</h2>
              <p>Upload a lecture to test your knowledge.</p>
            </div>
          ))}

        {/* VIEW 7: TRANSCRIPT */}
        {activeTab === "transcript" &&
          (transcript && transcript.trim().length > 0 ? (
            <TranscriptView transcript={transcript} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h2>No Transcript Detected</h2>
              <p>Upload an audio file to view text.</p>
            </div>
          ))}

        {/* VIEW 8: HISTORY */}
        {activeTab === "history" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <h2
              style={{
                fontSize: "2rem",
                color: "#0f172a",
                marginBottom: "2rem",
              }}
            >
              🕰️ History Vault
            </h2>

            {!history || history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗄️</div>
                <h2>No Past Sessions</h2>
                <p>Generate some materials to start building your vault!</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {history.map((session, i) => (
                  <div
                    key={i}
                    style={{
                      background: "white",
                      padding: "1.5rem",
                      borderRadius: "16px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                      border: "1px solid #f1f5f9",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 0.5rem 0",
                          color: "#1e293b",
                          fontSize: "1.2rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {session.title || "Untitled Session"}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "#e0e7ff",
                          color: "#4f46e5",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "20px",
                          fontWeight: "bold",
                        }}
                      >
                        {session.mode || "Unknown Mode"}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: "#94a3b8",
                        fontSize: "0.85rem",
                      }}
                    >
                      Created:{" "}
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => loadPastSession(session)}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        color: "#334155",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        marginTop: "auto",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = "#4f46e5";
                        e.target.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = "#f8fafc";
                        e.target.style.color = "#334155";
                      }}
                    >
                      Restore Session ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
