export interface Question {
  id: string;
  question: string;
  answer: string;
  options?: string[];
}

export interface Player {
  id: string;
  email: string;
  username: string;
}

export interface GameRoom {
  _id?: string;
  roomId: string;
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  scores: { [playerId: string]: number };
  status: 'waiting' | 'playing' | 'finished';
  gameType: 'auto' | 'manual'; 
  adminId: string; 
  maxPlayers: number; 
  createdAt: Date;
  answers: { [playerId: string]: { [questionIndex: number]: { answer: string; correct: boolean; timestamp: Date } } };
}

export interface GameHistory {
  _id?: string;
  roomId: string;
  playerId: string;
  playerEmail: string;
  playerUsername: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  rank: number;
  completedAt: Date;
  questions: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}