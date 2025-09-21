"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/types/game';

interface GameLobbyPageProps {
  params: Promise<{ roomId: string }>;
}

export default function GameLobbyPage({ params }: GameLobbyPageProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [gameStarting, setGameStarting] = useState(false);
  const [countdown, setCountdown] = useState(0);
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
      const interval = setInterval(() => loadRoom(roomId), 2000);
      return () => clearInterval(interval);
    }
  }, [roomId, gameStarting]);

  useEffect(() => {
    if (gameStarting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameStarting && countdown === 0) {
      router.push(`/game/room/${roomId}`);
    }
  }, [gameStarting, countdown, roomId, router]);

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

      if (roomData.status === 'playing' && !gameStarting && countdown === 0) {
        setGameStarting(true);
        setCountdown(5);
      }
    } catch (error) {
      console.error('Error loading room:', error);
      router.push('/');
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
  }, []);

  const startGame = async () => {
    if (!room || !user) return;

    try {
      const response = await fetch('/api/game/start-manual-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });

      const result = await response.json();
      
      if (result.success) {
        setGameStarting(true);
        setCountdown(5);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const leaveRoom = async () => {
    if (!room || !user) return;

    try {
      await fetch('/api/game/leave-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });

      router.push('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      router.push('/');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading lobby...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Room not found</div>
      </div>
    );
  }

  const isAdmin = user && room.adminId === user.id;
  const canStartGame = room.players.length >= 2 && room.players.length <= room.maxPlayers;

  if (gameStarting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6">Game Starting!</h1>
          <div className="text-6xl font-bold text-black mb-4">{countdown}</div>
          <p className="text-gray-600">Get ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Game Lobby</h1>
            <button
              onClick={leaveRoom}
              className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black border"
            >
              Leave Room
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Room ID</h3>
              <div className="flex items-center gap-2">
                <code className="bg-gray-200 px-3 py-1 rounded text-sm">{roomId}</code>
                <button
                  onClick={copyRoomId}
                  className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-white hover:text-black border"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Players</h3>
              <div className="text-lg">
                {room.players.length}/{room.maxPlayers}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-4">
              <p className="text-black text-sm">
                You are the room admin. You can start the game when ready.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Players in Room</h2>
          <div className="grid gap-3">
            {room.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  player.id === room.adminId ? 'bg-gray-50 border-black' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{player.username}</span>
                </div>
                {player.id === room.adminId && (
                  <span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>
            ))}

            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded">
                <div className="w-8 h-8 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-sm text-gray-400">
                  {room.players.length + index + 1}
                </div>
                <span className="text-gray-400">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
            
            {!canStartGame && (
              <div className="bg-gray-50 border border-black p-4 rounded mb-4">
                <p className="text-black text-sm">
                  Need at least 2 players to start the game.
                </p>
              </div>
            )}

            <button
              onClick={startGame}
              disabled={!canStartGame}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-white hover:text-black border disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {canStartGame ? 'Start Game' : 'Waiting for Players...'}
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-gray-600">Waiting for the admin to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
