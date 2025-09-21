import { NextResponse } from 'next/server';
import { GameHistory } from '@/types/game';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Collection } from 'mongodb';

let clientPromise: any;
let useLocalDB = false;

try {
  clientPromise = import('@/lib/mongodb').then(m => m.default);
} catch (error) {
  console.warn('MongoDB not available, using local storage');
  useLocalDB = true;
}

const history: GameHistory[] = [];

export async function GET() {
  try {
    const cookieStore = cookies(); 
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userHistory: GameHistory[] = [];

    if (useLocalDB) {
      userHistory = history
        .filter(h => h.playerId === user.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 20);
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const historyCollection = db.collection('game-history') as Collection<GameHistory>;

        userHistory = await historyCollection
          .find({ playerId: user.id })
          .sort({ completedAt: -1 })
          .limit(20)
          .toArray();
      } catch (mongoError) {
        console.warn('MongoDB error, falling back to local storage:', mongoError);
        useLocalDB = true;
        userHistory = history
          .filter(h => h.playerId === user.id)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 20);
      }
    }

    return NextResponse.json(userHistory);
  } catch (error) {
    console.error('Game history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
