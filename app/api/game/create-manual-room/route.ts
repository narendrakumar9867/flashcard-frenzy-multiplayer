import type { Collection, MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { GameRoom, Player } from '@/types/game';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

let clientPromise: Promise<MongoClient> | undefined;
let useLocalDB = false;

try {
  clientPromise = import('@/lib/mongodb').then(m => m.default);
} catch {
  useLocalDB = true;
}

const rooms = new Map<string, GameRoom>();

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maxPlayers } = await request.json();

    if (!maxPlayers || maxPlayers < 2 || maxPlayers > 10) {
      return NextResponse.json({ error: 'Max players must be between 2 and 10' }, { status: 400 });
    }

    const player: Player = {
      id: user.id,
      email: user.email!,
      username: user.user_metadata?.username || user.email!
    };

    const roomId = `ROOM${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const newRoom: GameRoom = {
      roomId,
      players: [player],
      currentQuestionIndex: 0,
      questions: [],
      scores: { [user.id]: 0 },
      status: 'waiting',
      gameType: 'manual',
      adminId: user.id,
      maxPlayers,
      createdAt: new Date(),
      answers: {}
    };

    if (useLocalDB || !clientPromise) {
      rooms.set(roomId, newRoom);
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms') as Collection<GameRoom>;
        await roomsCollection.insertOne(newRoom);
      } catch {
        rooms.set(roomId, newRoom);
      }
    }

    return NextResponse.json({ 
      success: true,
      roomId,
      adminId: user.id
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
