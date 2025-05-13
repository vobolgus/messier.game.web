import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScoreboardPage from './pages/ScoreboardPage';
import './App.css'; // Main CSS for the app

function App() {
  // Basic auth state - to be replaced with context or Zustand/Redux
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('authToken'));
  const [username, setUsername] = React.useState(localStorage.getItem('username') || '');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUsername('');
    // Optionally redirect to home or login page
  };

  return (
    <Router>
      <div className="App">
        <nav className="main-nav">
          <Link to="/">Home</Link>
          <Link to="/game">Play Game</Link>
          <Link to="/scoreboard">Scoreboard</Link>
          {isLoggedIn ? (
            <>
              <span>Welcome, {username}!</span>
              <button onClick={handleLogout} className="nav-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>

        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/scoreboard" element={<ScoreboardPage />} />
            {/* Add other routes here, e.g., UserProfilePage */}
          </Routes>
        </main>

        <footer>
          <p>&copy; 2024 Skychart Game. Adapted from vobolgus/skychart.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

