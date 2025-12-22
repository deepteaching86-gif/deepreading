import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Clock, Trophy, XCircle, Sparkles, ChevronRight, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

// Harry Potter and the Philosopher's Stone Quiz Questions
interface QuizQuestion {
  id: number;
  question: string;
  questionKo: string;
  options: string[];
  correctAnswer: number;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const harryPotterQuizzes: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the name of the three-headed dog guarding the trapdoor?",
    questionKo: "비밀 문을 지키는 머리 세 개 달린 개의 이름은?",
    options: ["Fang", "Fluffy", "Norbert", "Scabbers"],
    correctAnswer: 1,
    hint: "Despite its scary appearance, it has a very gentle name.",
    difficulty: 'easy'
  },
  {
    id: 2,
    question: "What position does Harry play in Quidditch?",
    questionKo: "해리가 퀴디치에서 맡은 포지션은?",
    options: ["Chaser", "Beater", "Keeper", "Seeker"],
    correctAnswer: 3,
    hint: "Harry's job is to catch a tiny golden ball.",
    difficulty: 'easy'
  },
  {
    id: 3,
    question: "What does the Mirror of Erised show?",
    questionKo: "소망의 거울(Mirror of Erised)은 무엇을 보여주나요?",
    options: ["The future", "The past", "Your deepest desire", "Your greatest fear"],
    correctAnswer: 2,
    hint: "Erised is 'Desire' spelled backwards.",
    difficulty: 'medium'
  },
  {
    id: 4,
    question: "What is the name of Harry's owl?",
    questionKo: "해리의 올빼미 이름은?",
    options: ["Hedwig", "Errol", "Pigwidgeon", "Hermes"],
    correctAnswer: 0,
    hint: "This snowy owl was Harry's birthday gift from Hagrid.",
    difficulty: 'easy'
  },
  {
    id: 5,
    question: "On which platform does the Hogwarts Express depart?",
    questionKo: "호그와트 익스프레스는 몇 번 플랫폼에서 출발하나요?",
    options: ["Platform 9", "Platform 9¾", "Platform 10", "Platform 7½"],
    correctAnswer: 1,
    hint: "It's between platforms 9 and 10.",
    difficulty: 'easy'
  },
  {
    id: 6,
    question: "What flavor was the first Bertie Bott's bean Harry ate on the train?",
    questionKo: "해리가 기차에서 처음 먹은 버티봇 콩은 무슨 맛이었나요?",
    options: ["Chocolate", "Vomit", "Grass", "Toast"],
    correctAnswer: 3,
    hint: "It was actually a pleasant surprise.",
    difficulty: 'hard'
  },
  {
    id: 7,
    question: "Who gives Harry the Invisibility Cloak?",
    questionKo: "누가 해리에게 투명 망토를 주었나요?",
    options: ["Hagrid", "Dumbledore", "McGonagall", "Snape"],
    correctAnswer: 1,
    hint: "It was a Christmas gift, delivered anonymously by the Headmaster.",
    difficulty: 'medium'
  },
  {
    id: 8,
    question: "What is Nicolas Flamel famous for creating?",
    questionKo: "니콜라스 플라멜이 만든 것으로 유명한 것은?",
    options: ["The Elder Wand", "The Philosopher's Stone", "The Sorting Hat", "The Marauder's Map"],
    correctAnswer: 1,
    hint: "This object can turn any metal into gold and produce the Elixir of Life.",
    difficulty: 'medium'
  },
  {
    id: 9,
    question: "What does Hagrid name his dragon?",
    questionKo: "해그리드가 자신의 드래곤에게 붙인 이름은?",
    options: ["Norbert", "Fluffy", "Fang", "Buckbeak"],
    correctAnswer: 0,
    hint: "It sounds like a Norwegian name because it's a Norwegian Ridgeback.",
    difficulty: 'easy'
  },
  {
    id: 10,
    question: "What does Harry see in the Mirror of Erised?",
    questionKo: "해리가 소망의 거울에서 본 것은?",
    options: ["Himself as Minister of Magic", "His family", "Winning the Quidditch Cup", "Defeating Voldemort"],
    correctAnswer: 1,
    hint: "Harry never knew his parents.",
    difficulty: 'easy'
  },
  {
    id: 11,
    question: "What are the four houses at Hogwarts?",
    questionKo: "호그와트의 네 개의 기숙사는?",
    options: [
      "Gryffindor, Hufflepuff, Ravenclaw, Slytherin",
      "Gryffindor, Hufflepuff, Ravenclaw, Serpentine",
      "Griffin, Badger, Eagle, Snake",
      "Lion, Badger, Raven, Snake"
    ],
    correctAnswer: 0,
    hint: "They are named after the four founders of Hogwarts.",
    difficulty: 'easy'
  },
  {
    id: 12,
    question: "What subject does Professor Snape teach?",
    questionKo: "스네이프 교수가 가르치는 과목은?",
    options: ["Defense Against the Dark Arts", "Transfiguration", "Potions", "Charms"],
    correctAnswer: 2,
    hint: "Classes are held in the dungeons.",
    difficulty: 'easy'
  },
  {
    id: 13,
    question: "How did Harry get his lightning bolt scar?",
    questionKo: "해리의 번개 모양 흉터는 어떻게 생겼나요?",
    options: [
      "A Quidditch accident",
      "Voldemort's killing curse",
      "A dragon attack",
      "A potions accident"
    ],
    correctAnswer: 1,
    hint: "The curse rebounded on Voldemort instead.",
    difficulty: 'medium'
  },
  {
    id: 14,
    question: "What type of wood is Harry's wand made from?",
    questionKo: "해리의 지팡이는 무슨 나무로 만들어졌나요?",
    options: ["Oak", "Willow", "Holly", "Elder"],
    correctAnswer: 2,
    hint: "It's a plant often associated with Christmas.",
    difficulty: 'hard'
  },
  {
    id: 15,
    question: "What is the core of Harry's wand?",
    questionKo: "해리의 지팡이 심은 무엇으로 되어 있나요?",
    options: ["Dragon heartstring", "Unicorn hair", "Phoenix feather", "Thestral tail hair"],
    correctAnswer: 2,
    hint: "It came from Dumbledore's phoenix, Fawkes.",
    difficulty: 'medium'
  },
  {
    id: 16,
    question: "Who is the head of Gryffindor House?",
    questionKo: "그리핀도르 기숙사의 사감은 누구인가요?",
    options: ["Professor Snape", "Professor McGonagall", "Professor Flitwick", "Professor Sprout"],
    correctAnswer: 1,
    hint: "She can transform into a cat.",
    difficulty: 'medium'
  },
  {
    id: 17,
    question: "What chess piece does Ron play as in the giant chess game?",
    questionKo: "거대한 체스 게임에서 론이 맡은 체스 말은?",
    options: ["King", "Queen", "Knight", "Bishop"],
    correctAnswer: 2,
    hint: "Ron had to be brave and sacrifice himself for the team.",
    difficulty: 'medium'
  },
  {
    id: 18,
    question: "What does 'Alohomora' do?",
    questionKo: "'알로호모라' 주문의 효과는?",
    options: ["Makes things fly", "Unlocks doors", "Creates light", "Disarms opponents"],
    correctAnswer: 1,
    hint: "Hermione uses this to help them escape from Filch.",
    difficulty: 'easy'
  },
  {
    id: 19,
    question: "Where does Harry live before going to Hogwarts?",
    questionKo: "호그와트에 가기 전 해리가 살던 곳은?",
    options: [
      "The Burrow",
      "Godric's Hollow",
      "4 Privet Drive",
      "12 Grimmauld Place"
    ],
    correctAnswer: 2,
    hint: "He lived with his aunt, uncle, and cousin in a cupboard under the stairs.",
    difficulty: 'easy'
  },
  {
    id: 20,
    question: "Who was secretly keeping the Philosopher's Stone safe in their pocket?",
    questionKo: "마법사의 돌을 주머니에 몰래 보관하고 있던 사람은?",
    options: ["Dumbledore", "Harry", "Quirrell", "Snape"],
    correctAnswer: 1,
    hint: "The Mirror of Erised only gave the Stone to someone who wanted to find it but not use it.",
    difficulty: 'hard'
  }
];

type GameState = 'setup' | 'playing' | 'success' | 'failed';

export default function EscapeRoomQuiz() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLimit, setTimeLimit] = useState(180); // 3 minutes default
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [showHint, setShowHint] = useState(false);
  const [isLockShaking, setIsLockShaking] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio functions
  const playSound = useCallback((type: 'success' | 'fail' | 'tick' | 'unlock' | 'wrong') => {
    if (!soundEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'success':
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'unlock':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'fail':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
      case 'wrong':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
      case 'tick':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
    }
  }, [soundEnabled]);

  // Select random questions
  const selectRandomQuestions = useCallback(() => {
    let filteredQuestions = harryPotterQuizzes;
    if (difficulty !== 'all') {
      filteredQuestions = harryPotterQuizzes.filter(q => q.difficulty === difficulty);
    }
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  }, [questionCount, difficulty]);

  // Start game
  const startGame = useCallback(() => {
    const questions = selectRandomQuestions();
    setSelectedQuestions(questions);
    setCurrentQuestion(0);
    setTimeRemaining(timeLimit);
    setShowHint(false);
    setWrongAnswer(null);
    setGameState('playing');
  }, [selectRandomQuestions, timeLimit]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameState('failed');
            playSound('fail');
            return 0;
          }
          if (prev <= 21 && prev > 1) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, playSound]);

  // Handle answer selection
  const handleAnswer = useCallback((answerIndex: number) => {
    if (gameState !== 'playing') return;

    const currentQ = selectedQuestions[currentQuestion];

    if (answerIndex === currentQ.correctAnswer) {
      playSound('unlock');

      if (currentQuestion === selectedQuestions.length - 1) {
        // All questions answered correctly
        setGameState('success');
        playSound('success');
      } else {
        // Move to next question
        setCurrentQuestion(prev => prev + 1);
        setShowHint(false);
        setWrongAnswer(null);
      }
    } else {
      // Wrong answer - shake the lock
      setIsLockShaking(true);
      setWrongAnswer(answerIndex);
      playSound('wrong');
      setTimeout(() => {
        setIsLockShaking(false);
      }, 500);
    }
  }, [gameState, selectedQuestions, currentQuestion, playSound]);

  // Reset game
  const resetGame = () => {
    setGameState('setup');
    setCurrentQuestion(0);
    setTimeRemaining(timeLimit);
    setSelectedQuestions([]);
    setShowHint(false);
    setWrongAnswer(null);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (timeRemaining / timeLimit) * 100;
  const isWarning = timeRemaining <= 20;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Magical background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-center border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
            🧙‍♂️ Harry Potter Escape Room
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-purple-800/50 hover:bg-purple-700/50 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          {gameState === 'setup' && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-purple-800/50 hover:bg-purple-700/50 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {/* Setup Screen */}
          {gameState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <motion.div
                  animate={{
                    rotateY: [0, 10, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block"
                >
                  <Lock className="w-32 h-32 mx-auto text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                </motion.div>
                <h2 className="text-3xl font-bold mt-6 mb-2">
                  🔮 The Philosopher's Stone Challenge
                </h2>
                <p className="text-purple-300 text-lg">
                  Answer the questions correctly to unlock the chamber!
                </p>
                <p className="text-purple-400 mt-2">
                  마법사의 돌을 지키는 방을 열어라!
                </p>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 p-6 bg-purple-900/50 rounded-2xl border border-purple-500/30"
                  >
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Game Settings
                    </h3>

                    {/* Difficulty */}
                    <div className="mb-4">
                      <label className="block text-sm text-purple-300 mb-2">Difficulty / 난이도</label>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {[
                          { value: 'all', label: 'All / 전체' },
                          { value: 'easy', label: 'Easy / 쉬움' },
                          { value: 'medium', label: 'Medium / 보통' },
                          { value: 'hard', label: 'Hard / 어려움' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setDifficulty(opt.value as typeof difficulty)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                              difficulty === opt.value
                                ? 'bg-amber-500 text-black font-semibold'
                                : 'bg-purple-800/50 hover:bg-purple-700/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Count */}
                    <div className="mb-4">
                      <label className="block text-sm text-purple-300 mb-2">
                        Number of Questions / 문항 수: {questionCount}
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Time Selection */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" /> Select Time Limit / 제한 시간 선택
                </h3>
                <div className="flex gap-3 flex-wrap justify-center">
                  {[
                    { seconds: 60, label: '1 min' },
                    { seconds: 120, label: '2 min' },
                    { seconds: 180, label: '3 min' },
                    { seconds: 240, label: '4 min' },
                    { seconds: 300, label: '5 min' }
                  ].map(time => (
                    <button
                      key={time.seconds}
                      onClick={() => {
                        setTimeLimit(time.seconds);
                        setTimeRemaining(time.seconds);
                      }}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                        timeLimit === time.seconds
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                          : 'bg-purple-800/50 hover:bg-purple-700/50 border border-purple-500/30'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-black font-bold text-xl rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:shadow-[0_0_50px_rgba(251,191,36,0.7)] transition-shadow"
              >
                🗝️ Start Challenge / 도전 시작!
              </motion.button>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && selectedQuestions.length > 0 && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Timer Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-purple-300">
                    Question {currentQuestion + 1} of {selectedQuestions.length}
                  </span>
                  <motion.span
                    className={`text-2xl font-bold ${isWarning ? 'text-red-500' : 'text-amber-400'}`}
                    animate={isWarning ? {
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.5, 1]
                    } : {}}
                    transition={{ duration: 0.5, repeat: isWarning ? Infinity : 0 }}
                  >
                    ⏱️ {formatTime(timeRemaining)}
                  </motion.span>
                </div>
                <div className="h-4 bg-purple-900/50 rounded-full overflow-hidden border border-purple-500/30">
                  <motion.div
                    className={`h-full transition-colors duration-300 ${
                      isWarning
                        ? 'bg-gradient-to-r from-red-600 to-red-400'
                        : 'bg-gradient-to-r from-green-500 via-yellow-500 to-amber-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                    animate={isWarning ? {
                      opacity: [1, 0.5, 1]
                    } : {}}
                    transition={{ duration: 0.5, repeat: isWarning ? Infinity : 0 }}
                  />
                </div>
              </div>

              {/* Progress Locks */}
              <div className="flex justify-center gap-2 mb-6">
                {selectedQuestions.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {index < currentQuestion ? (
                      <Unlock className="w-8 h-8 text-green-400" />
                    ) : index === currentQuestion ? (
                      <motion.div
                        animate={isLockShaking ? {
                          x: [-5, 5, -5, 5, 0],
                          rotate: [-5, 5, -5, 5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Lock className="w-8 h-8 text-amber-400" />
                      </motion.div>
                    ) : (
                      <Lock className="w-8 h-8 text-purple-600" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Question Card */}
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-purple-900/80 to-slate-900/80 p-8 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              >
                {/* Lock Animation */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={isLockShaking ? {
                      x: [-10, 10, -10, 10, 0],
                      rotate: [-10, 10, -10, 10, 0]
                    } : {
                      rotateY: [0, 5, -5, 0],
                    }}
                    transition={isLockShaking ? { duration: 0.5 } : { duration: 2, repeat: Infinity }}
                  >
                    <Lock className="w-20 h-20 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                  </motion.div>
                </div>

                {/* Question */}
                <div className="text-center mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs mb-3 ${
                    selectedQuestions[currentQuestion].difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : selectedQuestions[currentQuestion].difficulty === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedQuestions[currentQuestion].difficulty.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold mb-2">
                    {selectedQuestions[currentQuestion].question}
                  </h3>
                  <p className="text-purple-300">
                    {selectedQuestions[currentQuestion].questionKo}
                  </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedQuestions[currentQuestion].options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl text-left font-medium transition-all ${
                        wrongAnswer === index
                          ? 'bg-red-500/30 border-2 border-red-500 animate-pulse'
                          : 'bg-purple-800/50 hover:bg-purple-700/50 border border-purple-500/30 hover:border-amber-400/50'
                      }`}
                    >
                      <span className="inline-block w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-center leading-8 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </motion.button>
                  ))}
                </div>

                {/* Hint Button */}
                <div className="text-center">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    {showHint ? 'Hide Hint / 힌트 숨기기' : '💡 Need a hint? / 힌트가 필요해요?'}
                  </button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-amber-500/10 rounded-lg text-amber-300 text-sm"
                      >
                        💡 {selectedQuestions[currentQuestion].hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Success Screen */}
          {gameState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1, repeat: 3 }}
              >
                <div className="relative inline-block">
                  <Unlock className="w-40 h-40 text-green-400 mx-auto drop-shadow-[0_0_50px_rgba(74,222,128,0.7)]" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(74,222,128,0.3)',
                        '0 0 60px rgba(74,222,128,0.6)',
                        '0 0 20px rgba(74,222,128,0.3)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Celebration particles */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF'][i % 5],
                    left: '50%',
                    top: '30%'
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    opacity: 0,
                    scale: [1, 1.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              ))}

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-4xl font-bold mt-8 mb-4 bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent">
                  🎉 UNLOCKED! 성공!
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <span className="text-2xl text-yellow-400">
                    You've mastered the Philosopher's Stone challenge!
                  </span>
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-green-300 text-lg mb-2">
                  마법사의 돌 챌린지를 완료했어요!
                </p>
                <p className="text-purple-300 mb-8">
                  Time remaining: {formatTime(timeRemaining)} | 남은 시간: {formatTime(timeRemaining)}
                </p>
              </motion.div>

              <motion.button
                onClick={resetGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(74,222,128,0.5)] flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again / 다시 도전
              </motion.button>
            </motion.div>
          )}

          {/* Failed Screen */}
          {gameState === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  x: [-10, 10, -10, 10, 0],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <div className="relative inline-block">
                  <XCircle className="w-40 h-40 text-red-500 mx-auto drop-shadow-[0_0_50px_rgba(239,68,68,0.7)]" />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-4xl font-bold mt-8 mb-4 text-red-500">
                  ⏰ TIME'S UP! 시간 초과!
                </h2>
                <p className="text-red-300 text-lg mb-2">
                  The chamber remains locked...
                </p>
                <p className="text-purple-300 mb-4">
                  방은 여전히 잠겨있어요...
                </p>
                <p className="text-purple-400 mb-8">
                  Progress: {currentQuestion} / {selectedQuestions.length} questions answered
                </p>
              </motion.div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={resetGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)] flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again / 다시 도전
                </motion.button>
                <motion.button
                  onClick={() => {
                    setTimeLimit(timeLimit + 60);
                    startGame();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-purple-800/50 border border-purple-500/30 font-bold text-lg rounded-2xl flex items-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  +1 min & Retry
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Warning overlay when time is low */}
      <AnimatePresence>
        {gameState === 'playing' && isWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 border-8 border-red-500"
              animate={{
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-purple-400 text-sm border-t border-purple-500/30">
        <p>🏰 Hogwarts Escape Room Challenge | Based on Harry Potter and the Philosopher's Stone</p>
      </footer>
    </div>
  );
}
