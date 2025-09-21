"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinRoomPage() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a Room ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/game/join-manual-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomId.trim() })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        router.push(`/game/lobby/${roomId.trim()}`);
      }
    } catch (err) {
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Private Room</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="Enter Room ID..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
          />
        </div>

        <button
          onClick={joinRoom}
          disabled={loading || !roomId.trim()}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-white hover:text-black border disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Joining Room...' : 'Join Room'}
        </button>

        <button
          onClick={() => router.push('/game/mode')}
          className="w-full mt-4 text-gray-500 hover:text-gray-700"
        >
          Back to Game Modes
        </button>
      </div>
    </div>
  );
}