import React, { useState, useEffect, useCallback } from 'react';
import { useMessierGame } from '../hooks/useMessierGame';
import './GamePage.css'; // Styles for the game page

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function GamePage() {
    const [difficulty, setDifficulty] = useState('medium');
    const [language, setLanguage] = useState('en'); // or load from localStorage
    const {
        currentMessierObject,
        photoUrl,
        mapUrl,
        showFullMap,
        score,
        timeLeft,
        gameProgress,
        totalQuestions,
        isPaused,
        feedback,
        feedbackType,
        isGameOver,
        t, // translations object
        handleSubmit,
        nextQuestion, // Already part of the hook, no need to redefine if it handles its own logic
        togglePause,
        showHint,
        resetGame,
        updateGameLanguage,
        isLoading
    } = useMessierGame(difficulty, language);

    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmittingScore, setIsSubmittingScore] = useState(false);

    const handleAnswerChange = (e) => {
        setUserAnswer(e.target.value);
    };

    const handleAnswerSubmit = (e) => {
        e.preventDefault();
        if (userAnswer.trim() !== '') {
            handleSubmit(parseInt(userAnswer, 10));
            setUserAnswer(''); // Clear input after submission
        }
    };

    const handleDifficultyChange = (e) => {
        const newDifficulty = e.target.value;
        setDifficulty(newDifficulty);
        resetGame(newDifficulty, language); // Reset game with new difficulty
    };

    const handleLanguageChange = () => {
        const newLang = language === 'en' ? 'ru' : 'en';
        setLanguage(newLang);
        updateGameLanguage(newLang);
    };

    const submitScoreToBackend = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token || !isGameOver) return;

        setIsSubmittingScore(true);
        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token,
                },
                body: JSON.stringify({ score, difficulty }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit score');
            }
            // Score submitted successfully
            console.log('Score submitted!');
            // Optionally, provide user feedback about score submission
        } catch (error) {
            console.error('Error submitting score:', error);
            // Optionally, provide user feedback about the error
        } finally {
            setIsSubmittingScore(false);
        }
    }, [score, difficulty, isGameOver]); // Add API_URL if it's dynamic

    useEffect(() => {
        if (isGameOver && score > 0) {
            const authToken = localStorage.getItem('authToken');
            if (authToken) { // Only submit if user is logged in
                 submitScoreToBackend();
            }
        }
    }, [isGameOver, score, submitScoreToBackend]);

    if (isLoading) {
        return <div className="loading-spinner"></div>;
    }

    return (
        <div className="game-page-container">
            <h2>{t.messierQuiz || 'Messier Object Quiz'}</h2>
            
            <div className="game-settings">
                <label htmlFor="difficulty-select">{t.selectDifficulty || 'Select Difficulty:'} </label>
                <select id="difficulty-select" value={difficulty} onChange={handleDifficultyChange}>
                    <option value="easy">{t.easy || 'Easy'}</option>
                    <option value="medium">{t.medium || 'Medium'}</option>
                    <option value="hard">{t.hard || 'Hard'}</option>
                </select>
                <button onClick={handleLanguageChange} className="language-toggle-button">
                    {language === 'en' ? 'Русский' : 'English'}
                </button>
            </div>

            {!isGameOver ? (
                <div className="game-area">
                    <div className="image-display">
                        {photoUrl && <img id="photo-image" src={photoUrl} alt={t.photoAlt || 'Messier Object Photo'} />}
                        {mapUrl && <img id="map-image" src={mapUrl} alt={t.mapAlt || 'Star Map'} />}
                    </div>

                    <div className={`feedback-label feedback-${feedbackType}`}>{feedback}</div>

                    <form onSubmit={handleAnswerSubmit} className="input-controls">
                        <label htmlFor="number-input">{t.enterNumber || 'Enter Messier Number (1-110):'}</label>
                        <input 
                            type="number" 
                            id="number-input" 
                            min="1" 
                            max="110" 
                            value={userAnswer}
                            onChange={handleAnswerChange}
                            autoComplete="off"
                            disabled={isPaused || isGameOver}
                        />
                        <button type="submit" id="submit-button" disabled={isPaused || isGameOver || userAnswer.trim() === ''}>
                            {t.submit || 'Submit'}
                        </button>
                    </form>

                    <div className="game-controls">
                        <button id="pause-button" onClick={togglePause} disabled={isGameOver}>
                            {isPaused ? t.resume || 'Resume' : t.pause || 'Pause'}
                        </button>
                        <button id="next-button" onClick={nextQuestion} disabled={isPaused || isGameOver || !currentMessierObject}>
                            {t.next || 'Next'}
                        </button>
                        <button id="hint-button" onClick={showHint} disabled={isPaused || isGameOver}>
                            {t.hint || 'Hint'}
                        </button>
                    </div>

                    <div className="game-info">
                        <p>{t.score || 'Score:'} {score}</p>
                        <p>{t.timeRemaining || 'Time Remaining:'} {timeLeft}{t.secondsSuffix || 's'}</p>
                        <progress id="progress-bar" value={gameProgress} max={totalQuestions}></progress>
                        <p>{gameProgress} / {totalQuestions}</p>
                    </div>
                </div>
            ) : (
                <div className="game-over-summary">
                    <h3>{t.gameOver || 'Game Over!'}</h3>
                    <p>{t.finalScore || 'Your Final Score:'} {score}</p>
                    <p>{feedback}</p> {/* Display final game over message from hook */}
                    {isSubmittingScore && <p>{t.submittingScore || 'Submitting score...'}</p>}
                    <button onClick={() => resetGame(difficulty, language)} className="form-button">
                        {t.playAgain || 'Play Again?'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default GamePage;

