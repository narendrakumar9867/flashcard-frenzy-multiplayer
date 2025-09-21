"use client";
import { useRouter } from 'next/navigation';

export default function GameModePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-8">Choose Game Mode</h1>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/game/create-room')}
            className="w-full bg-white text-black p-6 rounded-lg hover:bg-black hover:text-white transition-colors border"
          >
            <div className="text-xl font-semibold mb-2">Create Room</div>
            <div className="text-sm">
              Create a private room and invite friends
            </div>
          </button>

          <button
            onClick={() => router.push('/game/join-room')}
            className="w-full bg-black text-white p-6 rounded-lg hover:bg-white hover:text-black transition-colors border"
          >
            <div className="text-xl font-semibold mb-2">Join Room</div>
            <div className="text-sm">
              Join a room using Room ID
            </div>
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-6 text-gray-500 hover:text-gray-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
