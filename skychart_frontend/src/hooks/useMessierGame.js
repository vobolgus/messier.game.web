import { useState, useEffect, useCallback, useRef } from 'react';
import { messierData } from './data/messierData'; // Assuming messierData.js is in src/data
import { translations } from './data/translations'; // Assuming translations.js is in src/data

const PHOTO_PATH = '/photos_avif/'; // Path in public folder
const MAP_PATH = '/maps_avif/';     // Path in public folder

export const useMessierGame = (difficulty = 'medium', initialLang = 'en') => {
    const [currentLanguage, setCurrentLanguage] = useState(initialLang);
    const [currentMessierObject, setCurrentMessierObject] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [showFullMap, setShowFullMap] = useState(false);

    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameProgress, setGameProgress] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sequence, setSequence] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [feedbackType, setFeedbackType] = useState(''); // 'correct', 'incorrect', 'hint', 'info', 'error'
    const [isGameOver, setIsGameOver] = useState(false);
    const [waitingForNext, setWaitingForNext] = useState(false);

    const timerRef = useRef(null);
    const feedbackTimeoutRef = useRef(null);
    const nextQuestionTimeoutRef = useRef(null);

    const timePerQuestionRef = useRef(30);
    const allowHintsRef = useRef(true);

    const t = translations[currentLanguage] || translations.en;

    const shuffleArray = useCallback((array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }, []);

    const getObjectListByDifficulty = useCallback((diff) => {
        switch (diff) {
            case 'easy':
                return [1, 13, 31, 42, 45, 51, 57, 81, 82, 104];
            case 'medium':
                return Array.from({ length: 50 }, (_, i) => i + 1);
            case 'hard':
                return Array.from({ length: 110 }, (_, i) => i + 1);
            default:
                return Array.from({ length: 50 }, (_, i) => i + 1);
        }
    }, []);

    const resetGame = useCallback((newDifficulty, newLang) => {
        setIsGameOver(false);
        setScore(0);
        setCurrentIndex(0);
        setGameProgress(0);
        setFeedback('');
        setFeedbackType('');
        setIsPaused(false);
        setWaitingForNext(false);
        setCurrentLanguage(newLang || currentLanguage);

        let currentDifficulty = newDifficulty || difficulty;
        switch (currentDifficulty) {
            case 'easy':
                timePerQuestionRef.current = 45;
                allowHintsRef.current = true;
                break;
            case 'medium':
                timePerQuestionRef.current = 30;
                allowHintsRef.current = true;
                break;
            case 'hard':
                timePerQuestionRef.current = 15;
                allowHintsRef.current = false;
                break;
            default:
                timePerQuestionRef.current = 30;
                allowHintsRef.current = true;
        }
        setTimeLeft(timePerQuestionRef.current);

        const objectList = getObjectListByDifficulty(currentDifficulty);
        setTotalQuestions(objectList.length);
        const newSequence = shuffleArray(objectList);
        setSequence(newSequence);

        if (newSequence.length > 0) {
            loadQuestion(0, newSequence, newLang || currentLanguage, false);
        }

        if (timerRef.current) clearInterval(timerRef.current);
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

    }, [difficulty, currentLanguage, getObjectListByDifficulty, shuffleArray]); // Added dependencies

    const loadQuestion = useCallback((idx, seq, lang, showFull = false) => {
        if (idx >= seq.length) {
            endGame();
            return;
        }
        const currentLang = lang || currentLanguage;
        const currentT = translations[currentLang] || translations.en;

        setCurrentMessierObject(seq[idx]);
        setPhotoUrl(`${PHOTO_PATH}M${seq[idx]}.avif`);
        setMapUrl(`${MAP_PATH}M${seq[idx]}_map${showFull ? '_full' : ''}.avif`);
        setShowFullMap(showFull);
        setTimeLeft(timePerQuestionRef.current);
        setFeedback('');
        setFeedbackType('');
        setGameProgress(idx + 1);
        setWaitingForNext(false);
    }, [currentLanguage]); // Added dependencies

    useEffect(() => {
        resetGame(difficulty, currentLanguage);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
            if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
        };
    }, [difficulty, resetGame]); // Removed currentLanguage from here as resetGame handles it

    useEffect(() => {
        if (isPaused || isGameOver || waitingForNext) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        if (!timerRef.current && !isPaused && !isGameOver && !waitingForNext) {
             timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        }

        if (timeLeft <= 0 && !isGameOver && !waitingForNext) {
            setFeedback(t.timesUp);
            setFeedbackType('error');
            setShowFullMap(true);
            setMapUrl(`${MAP_PATH}M${currentMessierObject}_map_full.avif`);
            setWaitingForNext(true);
            if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
            nextQuestionTimeoutRef.current = setTimeout(() => nextQuestion(), 2000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [timeLeft, isPaused, isGameOver, waitingForNext, t, currentMessierObject, loadQuestion]); // Added dependencies

    const handleSubmit = useCallback((answer) => {
        if (isPaused || isGameOver || waitingForNext) return;

        const correctAnswer = currentMessierObject;
        let newScore = score;

        if (parseInt(answer) === correctAnswer) {
            setFeedback(t.correct);
            setFeedbackType('correct');
            newScore += Math.floor(10 + (timeLeft / timePerQuestionRef.current) * 10);
        } else {
            setFeedback(`${t.incorrect}${correctAnswer}.`);
            setFeedbackType('incorrect');
            newScore -= 5;
        }
        setScore(newScore < 0 ? 0 : newScore);
        setShowFullMap(true);
        setMapUrl(`${MAP_PATH}M${correctAnswer}_map_full.avif`);
        setWaitingForNext(true);

        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => { setFeedback(''); setFeedbackType(''); }, 2000);

        if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
        nextQuestionTimeoutRef.current = setTimeout(() => nextQuestion(), 2000);

    }, [isPaused, isGameOver, waitingForNext, currentMessierObject, score, timeLeft, t, nextQuestion]); // Added dependencies

    const nextQuestion = useCallback(() => {
        if (isGameOver) return;
        
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        if (nextQuestionTimeoutRef.current) clearTimeout(nextQuestionTimeoutRef.current);
        setFeedback('');
        setFeedbackType('');

        const nextIdx = currentIndex + 1;
        if (nextIdx >= totalQuestions) {
            endGame();
        } else {
            setCurrentIndex(nextIdx);
            loadQuestion(nextIdx, sequence, currentLanguage, false);
        }
    }, [currentIndex, totalQuestions, sequence, currentLanguage, isGameOver, loadQuestion]); // Added dependencies

    const togglePause = useCallback(() => {
        if (isGameOver) return;
        setIsPaused(prev => !prev);
        if (!isPaused) {
            setFeedback(t.paused);
            setFeedbackType('info');
        } else {
            setFeedback('');
            setFeedbackType('');
        }
    }, [isGameOver, isPaused, t]);

    const showHint = useCallback(() => {
        if (isPaused || isGameOver || !allowHintsRef.current) {
            if (!allowHintsRef.current) {
                setFeedback(t.hintsNotAllowed);
                setFeedbackType('error');
            }
            return;
        }
        const objectInfo = messierData.find(obj => obj.number === currentMessierObject);
        if (objectInfo && objectInfo.hints && objectInfo.hints[currentLanguage]) {
            setFeedback(`${t.hintText}${objectInfo.hints[currentLanguage]}`);
            setFeedbackType('hint');
        } else {
            setFeedback(t.noHintAvailable);
            setFeedbackType('info');
        }
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => { setFeedback(''); setFeedbackType(''); }, 5000);
    }, [isPaused, isGameOver, currentMessierObject, currentLanguage, t]);

    const endGame = useCallback(() => {
        setIsGameOver(true);
        if (timerRef.current) clearInterval(timerRef.current);
        // Final feedback can be set here or handled by the component using the hook
        setFeedback(`${t.gameOver} ${t.score}${score}. ${t.correctAnswers}${currentIndex}/${totalQuestions}.`);
        setFeedbackType('info');
    }, [t, score, currentIndex, totalQuestions]);

    const updateGameLanguage = useCallback((newLang) => {
        setCurrentLanguage(newLang);
        // Reload question texts if needed, or rely on components re-rendering with new 't'
        if (feedbackType === 'hint') { // Re-show hint in new language if it was active
            const objectInfo = messierData.find(obj => obj.number === currentMessierObject);
            const currentT = translations[newLang] || translations.en;
            if (objectInfo && objectInfo.hints && objectInfo.hints[newLang]) {
                setFeedback(`${currentT.hintText}${objectInfo.hints[newLang]}`);
            }
        } else if (feedbackType === 'info' && feedback === (translations[currentLanguage] || translations.en).paused) {
             const currentT = translations[newLang] || translations.en;
             setFeedback(currentT.paused);
        }

    }, [currentMessierObject, feedback, feedbackType, currentLanguage]); // Added dependencies

    return {
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
        t, // translations for the current language
        difficulty,
        currentLanguage,
        handleSubmit,
        nextQuestion,
        togglePause,
        showHint,
        resetGame, // allow components to reset/restart the game
        updateGameLanguage,
        isLoading: !currentMessierObject && !isGameOver, // Basic loading state
    };
};

