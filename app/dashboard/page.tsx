"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GameHistory, Player } from '@/types/game';

export default function DashboardPage() {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Player | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadUserAndHistory();
  }, []);

  const loadUserAndHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? '',
          username: user.user_metadata?.username ?? user.email ?? ''
        });
      } else {
        setUser(null);
      }
      const response = await fetch('/api/game/history');
      if (response.ok) {
        const historyData = await response.json();
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const totalGames = history.length;
  const totalCorrect = history.reduce((sum, game) => sum + game.correctAnswers, 0);
  const totalQuestions = totalGames * 10;
  const averageScore = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;
  const wins = history.filter(game => game.rank === 1).length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.username || user?.email}!</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/game/mode')}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-white hover:text-black border"
            >
              Play Now
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black border"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-black px-4 py-2 rounded hover:bg-black hover:text-white border"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-black">{totalGames}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Games Won</h3>
            <p className="text-3xl font-bold text-black">{wins}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Game History</h2>
          </div>
          
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-2">No games played yet</h3>
                <p className="text-gray-600 mb-4">Start your first game to see your history here!</p>
                <button
                  onClick={() => router.push('/game/mode')}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-white hover:text-black border"
                >
                  Play Your First Game
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((game, index) => (
                  <div key={game._id || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            game.rank === 1 
                              ? 'bg-black text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {game.rank === 1 ? 'Winner' : `#${game.rank}`}
                          </span>
                          
                          <span className="text-sm text-gray-600">
                            {new Date(game.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Score: {game.correctAnswers}/10 ({((game.correctAnswers/10) * 100)}%)
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          game.rank === 1 ? 'text-black' : 'text-gray-600'
                        }`}>
                          {game.correctAnswers}/10
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-600 hover:text-gray-800">
                          View Questions ({game.questions.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {game.questions.slice(0, 10).map((q, qIndex) => (
                            <div key={qIndex} className={`text-sm p-2 rounded ${
                              q.isCorrect ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                              <div className="font-medium">{q.question}</div>
                              <div className={`${q.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                Your answer: {q.userAnswer}
                              </div>
                              {!q.isCorrect && (
                                <div className="text-gray-600">
                                  Correct: {q.correctAnswer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
