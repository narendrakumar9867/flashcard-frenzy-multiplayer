import type { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { GameRoom, GameHistory } from '@/types/game';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Collection } from 'mongodb';

let clientPromise: Promise<MongoClient> | undefined;
let useLocalDB = false;

try {
  clientPromise = import('@/lib/mongodb').then(m => m.default);
} catch {
  useLocalDB = true;
}

const rooms = new Map<string, GameRoom>();
const history: GameHistory[] = [];

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, answer, questionIndex } = await request.json();

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

    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Invalid room or game not active' }, { status: 400 });
    }

    if (!room.questions || room.questions.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 400 });
    }

    const currentQuestion = room.questions[questionIndex];
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Invalid question index' }, { status: 400 });
    }

    const isCorrect = answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();

    if (!room.answers[user.id]) {
      room.answers[user.id] = {};
    }

    if (room.answers[user.id][questionIndex]) {
      return NextResponse.json({ error: 'Already answered this question' }, { status: 400 });
    }

    room.answers[user.id][questionIndex] = {
      answer,
      correct: isCorrect,
      timestamp: new Date()
    };

    if (isCorrect) {
      room.scores[user.id] = (room.scores[user.id] || 0) + 1;
    }

    if (questionIndex === room.currentQuestionIndex) {
      room.currentQuestionIndex = Math.min(questionIndex + 1, 9);
    }

    const allQuestionsCompleted = room.currentQuestionIndex >= 9;
    const allPlayersFinished = room.players.every(player => 
      room.answers[player.id] && 
      Object.keys(room.answers[player.id]).length >= 10
    );

    const gameEnded = allQuestionsCompleted || allPlayersFinished;

    if (gameEnded) {
      room.status = 'finished';
      
      const historyPromises = room.players.map(async (player) => {
        const playerAnswers = room.answers[player.id] || {};
        const correctAnswers = Object.values(playerAnswers).filter(a => a.correct).length;
        
        const questions = room.questions.map((q, qIndex) => ({
          question: q.question,
          userAnswer: playerAnswers[qIndex]?.answer || 'No answer',
          correctAnswer: q.answer,
          isCorrect: playerAnswers[qIndex]?.correct || false
        }));

        const playerScores = Object.entries(room.scores).map(([id, score]) => ({ id, score }));
        playerScores.sort((a, b) => b.score - a.score);
        const rank = playerScores.findIndex(p => p.id === player.id) + 1;

        const gameHistory: GameHistory = {
          roomId,
          playerId: player.id,
          playerEmail: player.email,
          playerUsername: player.username,
          totalQuestions: 10,
          correctAnswers,
          score: correctAnswers,
          rank,
          completedAt: new Date(),
          questions
        };

        if (useLocalDB || !clientPromise) {
          history.push(gameHistory);
        } else {
          try {
            const client = await clientPromise;
            const db = client.db('flashcard-frenzy');
            const historyCollection = db.collection('game-history') as Collection<GameHistory>;
            await historyCollection.insertOne(gameHistory);
          } catch {
            history.push(gameHistory);
          }
        }
      });

      await Promise.all(historyPromises);
    }

    if (useLocalDB || !clientPromise) {
      rooms.set(roomId, room);
    } else {
      try {
        const client = await clientPromise;
        const db = client.db('flashcard-frenzy');
        const roomsCollection = db.collection('game-rooms') as Collection<GameRoom>;
        
        await roomsCollection.updateOne(
          { roomId },
          { $set: room }
        );
      } catch {
        rooms.set(roomId, room);
      }
    }

    return NextResponse.json({ 
      success: true, 
      isCorrect,
      correctAnswer: currentQuestion.answer,
      gameEnded,
      nextQuestionIndex: gameEnded ? -1 : room.currentQuestionIndex,
      currentScore: room.scores[user.id] || 0
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
