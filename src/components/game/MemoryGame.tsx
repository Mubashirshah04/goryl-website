'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Timer, RefreshCw, Brain, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';

// Game Configuration - Progressive Levels
const GAME_LEVELS = [
    { level: 1, pairs: 4, time: 45, points: 10, name: 'Novice', grid: 'grid-cols-4' },
    { level: 2, pairs: 6, time: 60, points: 20, name: 'Apprentice', grid: 'grid-cols-4' },
    { level: 3, pairs: 8, time: 60, points: 35, name: 'Adept', grid: 'grid-cols-4' },
    { level: 4, pairs: 10, time: 75, points: 50, name: 'Expert', grid: 'grid-cols-5' },
    { level: 5, pairs: 12, time: 90, points: 100, name: 'Master', grid: 'grid-cols-6' },
];

// Premium Card Icons
const ICONS = [
    '🎮', '🎧', '📸', '💻', '📱', '⌚',
    '👟', '🎒', '🕶️', '🧢', '🎸', '🎹',
    '🚀', '💎', '🏆', '🎁', '🔑', '🧿',
];

interface Card {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export default function MemoryGame() {
    const { user } = useAuthStore();
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(GAME_LEVELS[0].time);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    const currentLevelConfig = GAME_LEVELS[currentLevelIndex];

    // Initialize Game Level
    const startLevel = (levelIndex: number) => {
        const config = GAME_LEVELS[levelIndex];
        const gameIcons = ICONS.slice(0, config.pairs);
        const shuffledCards = [...gameIcons, ...gameIcons]
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({
                id: index,
                icon,
                isFlipped: false,
                isMatched: false,
            }));

        setCards(shuffledCards);
        setCurrentLevelIndex(levelIndex);
        setTimeLeft(config.time);
        setFlippedCards([]);
        setIsPlaying(true);
        setIsGameOver(false);
        setIsLevelComplete(false);
        setScore(0);
    };

    // Start Initial Game
    useEffect(() => {
        startLevel(0);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isPlaying && timeLeft > 0 && !isGameOver && !isLevelComplete) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && isPlaying) {
            handleGameOver();
        }
    }, [isPlaying, timeLeft, isGameOver, isLevelComplete]);

    // Card Click Handler
    const handleCardClick = (id: number) => {
        if (!isPlaying || isGameOver || isLevelComplete || flippedCards.length >= 2 || cards[id].isFlipped || cards[id].isMatched) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);
        setFlippedCards([...flippedCards, id]);

        if (flippedCards.length === 1) {
            const firstCardId = flippedCards[0];
            const secondCardId = id;

            if (cards[firstCardId].icon === cards[secondCardId].icon) {
                // Match Found
                setTimeout(() => {
                    const matchedCards = [...newCards];
                    matchedCards[firstCardId].isMatched = true;
                    matchedCards[secondCardId].isMatched = true;
                    setCards(matchedCards);
                    setFlippedCards([]);
                    setScore((prev) => prev + 10);

                    // Check Level Completion
                    if (matchedCards.every((card) => card.isMatched)) {
                        handleLevelComplete();
                    }
                }, 500);
            } else {
                // No Match
                setTimeout(() => {
                    const resetCards = [...newCards];
                    resetCards[firstCardId].isFlipped = false;
                    resetCards[secondCardId].isFlipped = false;
                    setCards(resetCards);
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    const handleLevelComplete = async () => {
        setIsPlaying(false);
        setIsLevelComplete(true);
        const levelPoints = currentLevelConfig.points;
        setTotalScore(prev => prev + levelPoints);

        // Confetti disabled (module not installed)

        // Save points to backend
        if (user?.sub) {
            try {
                await fetch('/api/user/points', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.sub, points: levelPoints }),
                });
                toast.success(`Level Complete! +${levelPoints} Points Saved!`);
            } catch (error) {
                console.error('Error saving points:', error);
            }
        }
    };

    const handleGameOver = () => {
        setIsPlaying(false);
        setIsGameOver(true);
        toast.error("Time's up!");
    };

    const handleNextLevel = () => {
        if (currentLevelIndex < GAME_LEVELS.length - 1) {
            startLevel(currentLevelIndex + 1);
        } else {
            // Game Completed (All Levels)
            toast.success("You are a Memory Master! Game Completed!");
            startLevel(0); // Restart for now, or show a grand victory screen
        }
    };

    const handleRetryLevel = () => {
        startLevel(currentLevelIndex);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 animate-pulse"></div>
                        <div className="relative bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <Brain className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            Memory Match
                        </h2>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                Level {currentLevelConfig.level}
                            </span>
                            <span>•</span>
                            <span>{currentLevelConfig.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time Left</span>
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-700 dark:text-gray-200'}`}>
                            {timeLeft}s
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end pl-4 border-l border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Score</span>
                        <div className="text-2xl font-mono font-bold text-yellow-500">
                            {totalScore}
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div className="relative min-h-[400px] bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/50">

                {/* Cards Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentLevelIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`grid gap-4 mx-auto ${currentLevelConfig.grid}`}
                    >
                        {cards.map((card) => (
                            <motion.button
                                key={card.id}
                                layout
                                onClick={() => handleCardClick(card.id)}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                                whileTap={{ scale: 0.95 }}
                                className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-500 transform perspective-1000 relative group ${card.isFlipped || card.isMatched
                                        ? 'rotate-y-180'
                                        : ''
                                    }`}
                                disabled={card.isMatched || isGameOver || isLevelComplete}
                            >
                                {/* Front of Card (Hidden) */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg backface-hidden flex items-center justify-center border-2 border-white/20 ${card.isFlipped || card.isMatched ? 'opacity-0 rotate-y-180' : 'opacity-100'
                                    }`}>
                                    <Sparkles className="w-8 h-8 text-white/30" />
                                </div>

                                {/* Back of Card (Revealed) */}
                                <div className={`absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backface-hidden flex items-center justify-center border-2 border-purple-500/50 ${card.isFlipped || card.isMatched ? 'opacity-100 rotate-y-180' : 'opacity-0'
                                    }`}>
                                    <span className="transform scale-110 drop-shadow-md">{card.icon}</span>
                                    {card.isMatched && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center"
                                        >
                                            <div className="absolute inset-0 border-4 border-green-500 rounded-2xl animate-pulse"></div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Overlays */}
                <AnimatePresence>
                    {/* Level Complete Overlay */}
                    {isLevelComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl"
                        >
                            <div className="text-center p-8">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30"
                                >
                                    <Trophy className="w-12 h-12 text-white" />
                                </motion.div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Level Complete!</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                    You earned <span className="font-bold text-purple-600">{currentLevelConfig.points} points</span>
                                </p>
                                <button
                                    onClick={handleNextLevel}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden"
                                >
                                    <span className="relative z-10">Next Level</span>
                                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Game Over Overlay */}
                    {isGameOver && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl"
                        >
                            <div className="text-center p-8">
                                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Timer className="w-12 h-12 text-red-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Out of Time!</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                    Don't worry, you can try this level again.
                                </p>
                                <button
                                    onClick={handleRetryLevel}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
