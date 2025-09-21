import { NextRequest, NextResponse } from 'next/server';
import { GameRoom } from '@/types/game';
import { Collection } from 'mongodb';

let clientPromise: Promise<any> | undefined;
let useLocalDB = false;

try {
  clientPromise = import('@/lib/mongodb').then(m => m.default);
} catch {
  useLocalDB = true;
}

const rooms = new Map<string, GameRoom>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    let room: GameRoom | null = null;

    if (useLocalDB) {
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

    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}