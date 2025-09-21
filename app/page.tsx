"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-8">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Flashcard Frenzy</h1>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span>Welcome, {user.user_metadata?.username || user.user_metadata?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-white text-black border px-4 py-2 rounded hover:bg-black hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-white text-black px-4 py-2 rounded hover:bg-black hover:text-white border"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black border"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex flex-col justify-center items-center flex-grow text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Flashcard Frenzy!
        </h1>
        
        {user ? (
          <div>
            <p className="text-xl mb-6">Ready to play?</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-black text-white px-8 py-4 rounded-lg text-lg hover:bg-white hover:text-black border">
              Start Playing
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xl mb-6">Real-time multiplayer flashcard game</p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="bg-black text-white px-6 py-3 rounded-lg text-lg hover:bg-white hover:text-black border"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
