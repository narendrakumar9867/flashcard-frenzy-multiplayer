"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/types/game';

interface GameRoomPageProps {
  params: Promise<{ roomId: string }>; 
}

export default function GameRoomPage({ params }: GameRoomPageProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showResult, setShowResult] = useState<{ isCorrect: boolean; correctAnswer: string; timedOut?: boolean } | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScores, setFinalScores] = useState<{ [key: string]: number }>({});
  const [roomId, setRoomId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initRoom = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
      loadRoom(resolvedParams.roomId);
    };
    
    initRoom();
  }, [params]);

  useEffect(() => {
    if (roomId && !gameStarting) {
      const interval = setInterval(() => loadRoom(roomId), 3000);
      return () => clearInterval(interval);
    }
  }, [roomId, gameStarting]);

  useEffect(() => {
    if (!loading && room && room.status === 'playing' && !isAnswered && !showResult && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft, loading, room, isAnswered, showResult]);

  useEffect(() => {
    if (room && !isAnswered && !showResult && currentQuestionIndex > 0) {
      setTimeLeft(10);
    }
  }, [currentQuestionIndex, room, isAnswered, showResult]);

  const loadRoom = async (currentRoomId: string) => {
    try {
      const response = await fetch(`/api/game/room/${currentRoomId}`);
      const roomData = await response.json();
      
      if (roomData.error) {
        router.push('/');
        return;
      }

      setRoom(roomData);
      setLoading(false);

      if (roomData.status === 'finished') {
        setGameEnded(true);
        setFinalScores(roomData.scores);
      }
    } catch (error) {
      console.error('Error loading room:', error);
      router.push('/');
    }
  };

  const handleTimeUp = async () => {
    if (!room) return;
    
    await submitAnswer(true);
  };

  const submitAnswer = async (timedOut = false) => {
    if (!room || isAnswered) return;

    setIsAnswered(true);

    try {
      const response = await fetch('/api/game/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          answer: currentAnswer.trim(),
          questionIndex: currentQuestionIndex,
          timedOut: timedOut
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowResult({
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          timedOut: result.timedOut
        });
        setCurrentAnswer('');

        setTimeout(() => {
          setShowResult(null);
          setIsAnswered(false);
          setGameStarting(false);
          
          if (result.gameEnded) {
            setGameEnded(true);
          } else if (result.userFinished) {
            setCurrentQuestionIndex(10); 
          } else {
            setCurrentQuestionIndex(result.nextQuestionIndex);
            setGameStarting(true);
            setTimeLeft(10); 
          }
        }, 3000);
      } else {
        console.error('Submit answer failed:', result.error);
        setIsAnswered(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsAnswered(false);
    }
  };

  const handleSubmitClick = () => {
    submitAnswer(false);
  };

  const goHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Game not found</div>
      </div>
    );
  }

  if (gameEnded) {
    const sortedPlayers = room.players
      .map(player => ({
        ...player,
        score: finalScores[player.id] || 0
      }))
      .sort((a, b) => b.score - a.score);

    const highestScore = sortedPlayers[0]?.score || 0;
    const playersWithHighestScore = sortedPlayers.filter(p => p.score === highestScore);
    const isDraw = playersWithHighestScore.length > 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6">
            {isDraw ? "It's a Draw!" : "Game Over!"}
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isDraw ? "Final Results: Draw!" : "Final Results! Winner: " + sortedPlayers[0].username}
            </h2>
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className={`p-3 rounded mb-2 ${isDraw && player.score === highestScore ? 'bg-yellow-100' : index === 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {isDraw && player.score === highestScore ? "Draw: " : index === 0 ? "1. " : `${index + 1}. `}
                    {player.username}
                  </span>
                  <span className="font-bold">{player.score}/10</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goHome}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= 10) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-6">You are Done!</h1>
          <p className="text-gray-600 mb-6">
            You have answered all 10 questions. Waiting for other player to finish...
          </p>
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = room.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / 10) * 100;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Flashcard Frenzy</h1>
          <div className="text-sm text-gray-600">Room: {roomId.slice(-8)}</div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of 10</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {!showResult && (
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-black'}`}>
              {timeLeft}
            </div>
            <div className="text-sm text-gray-600">seconds left</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {room.players.map(player => (
            <div key={player.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-center">
                <span className="font-medium">{player.username}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
                  {room.scores[player.id] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          {showResult ? (
            <div className={`p-6 rounded-lg text-center ${
              showResult.timedOut 
                ? 'bg-gray-100' 
                : showResult.isCorrect 
                  ? 'bg-gray-100' 
                  : 'bg-gray-100'
            }`}>
              <h2 className={`text-2xl font-bold mb-2 ${
                showResult.timedOut 
                  ? 'text-black' 
                  : showResult.isCorrect 
                    ? 'text-black' 
                    : 'text-black'
              }`}>
                {showResult.timedOut ? 'Time Up!' : showResult.isCorrect ? 'Correct!' : 'Wrong!'}
              </h2>
              <p className="text-gray-700">
                The correct answer is: <strong>{showResult.correctAnswer}</strong>
              </p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h2 className="text-2xl font-bold mb-6">{currentQuestion?.question}</h2>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isAnswered && handleSubmitClick()}
                  placeholder="Type your answer..."
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none"
                  disabled={isAnswered}
                />
              </div>

              <button
                onClick={handleSubmitClick}
                disabled={isAnswered}
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-black border disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isAnswered ? 'Submitted...' : 'Submit Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
