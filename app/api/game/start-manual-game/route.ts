import { NextRequest, NextResponse } from 'next/server';
import { GameRoom } from '@/types/game';
import { getRandomQuestions } from '@/data/questions';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

let clientPromise: any;
let useLocalDB = false;

try {
  clientPromise = import('@/lib/mongodb').then(m => m.default);
} catch (error) {
  console.warn('MongoDB not available, using local storage');
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

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    let room: GameRoom | null = null;

    if (useLocalDB) {
      room = rooms.get(roomId) || null;
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms');
        room = await roomsCollection.findOne({ roomId });
      } catch (mongoError) {
        console.warn('MongoDB error, falling back to local storage:', mongoError);
        useLocalDB = true;
        room = rooms.get(roomId) || null;
      }
    }

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.adminId !== user.id) {
      return NextResponse.json({ error: 'Only room admin can start the game' }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Game cannot be started' }, { status: 400 });
    }

    if (room.players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 });
    }

    room.status = 'playing';
    room.questions = getRandomQuestions(10);
    room.currentQuestionIndex = 0;

    if (useLocalDB) {
      rooms.set(roomId, room);
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms');
        await roomsCollection.updateOne(
          { roomId },
          { 
            $set: { 
              status: 'playing',
              questions: room.questions,
              currentQuestionIndex: 0
            }
          }
        );
      } catch (mongoError) {
        console.warn('MongoDB update failed, using local storage');
        rooms.set(roomId, room);
      }
    }

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    console.error('Start manual game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

