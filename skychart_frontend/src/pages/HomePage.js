import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScoreboardList from '../components/ScoreboardList'; // We'll create this component
import './HomePage.css'; // Optional: for specific HomePage styles

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function HomePage() {
  const [topScores, setTopScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/scoreboard`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTopScores(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch scoreboard:", err);
        setError("Failed to load scoreboard. Please try again later.");
        setTopScores([]); // Clear scores on error
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="homepage-container">
      <header className="hero-section">
        <h1>Welcome to Skychart Game!</h1>
        <p className="subtitle">Explore the cosmos and test your knowledge of Messier objects.</p>
        <Link to="/game" className="play-button form-button">Play Now</Link>
      </header>

      <section className="scoreboard-preview-section">
        <h2>Top Players</h2>
        {loading && <div className="loading-spinner"></div>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && topScores.length > 0 && (
          <ScoreboardList scores={topScores} />
        )}
        {!loading && !error && topScores.length === 0 && (
          <p>No scores yet. Be the first to make your mark!</p>
        )}
        <Link to="/scoreboard" className="view-all-scores-link">View Full Scoreboard</Link>
      </section>

      <section className="features-section">
        <h2>Game Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <h3>Learn & Play</h3>
            <p>Identify Messier objects from stunning astronomical images and star maps.</p>
          </div>
          <div className="feature-item">
            <h3>Multiple Difficulties</h3>
            <p>Choose from easy, medium, or hard modes to match your skill level.</p>
          </div>
          <div className="feature-item">
            <h3>Compete Globally</h3>
            <p>Register an account and climb the public scoreboard with your high scores.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

