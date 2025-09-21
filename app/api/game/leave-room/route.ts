import { NextRequest, NextResponse } from 'next/server';
import { GameRoom } from '@/types/game';
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

    room.players = room.players.filter(p => p.id !== user.id);
    delete room.scores[user.id];
    delete room.answers[user.id];

    if (room.players.length === 0 || room.adminId === user.id) {
      if (useLocalDB) {
        rooms.delete(roomId);
      } else {
        try {
          const client = await clientPromise;
          const db = client.db('flashcard-frenzy');
          const roomsCollection = db.collection('game-rooms');
          await roomsCollection.deleteOne({ roomId });
        } catch (mongoError) {
          console.warn('MongoDB delete failed');
          rooms.delete(roomId);
        }
      }
    } else {
      if (room.adminId === user.id && room.players.length > 0) {
        room.adminId = room.players[0].id;
      }

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
                players: room.players,
                scores: room.scores,
                answers: room.answers,
                adminId: room.adminId
              }
            }
          );
        } catch (mongoError) {
          console.warn('MongoDB update failed, using local storage');
          rooms.set(roomId, room);
        }
      }
    }

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

