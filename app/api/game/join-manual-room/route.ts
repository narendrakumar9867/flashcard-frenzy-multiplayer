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

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    let room: GameRoom | null = null;

    if (useLocalDB || !clientPromise) {
      room = rooms.get(roomId) || null;
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms') as Collection<GameRoom>;
        room = await roomsCollection.findOne({ roomId });
      } catch {
        useLocalDB = true;
        room = rooms.get(roomId) || null;
      }
    }

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Room is not accepting players' }, { status: 400 });
    }

    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    if (room.players.some(p => p.id === user.id)) {
      return NextResponse.json({ error: 'You are already in this room' }, { status: 400 });
    }

    const player: Player = {
      id: user.id,
      email: user.email!,
      username: user.user_metadata?.username || user.email!
    };

    room.players.push(player);
    room.scores[user.id] = 0;

    if (useLocalDB || !clientPromise) {
      rooms.set(roomId, room);
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms') as Collection<GameRoom>;
        await roomsCollection.updateOne(
          { roomId },
          { 
            $push: { players: player },
            $set: { [`scores.${user.id}`]: 0 }
          }
        );
      } catch {
        rooms.set(roomId, room);
      }
    }

    return NextResponse.json({ 
      success: true,
      room: room
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
