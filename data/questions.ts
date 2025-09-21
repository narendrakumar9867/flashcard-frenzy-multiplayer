import { Question } from '@/types/game';

export const questionsPool: Question[] = [
  { id: '1', question: 'What is the capital of India?', answer: 'New Delhi' },
  { id: '2', question: 'What is 5 + 7?', answer: '12' },
  { id: '3', question: 'Which planet is known as the Red Planet?', answer: 'Mars' },
  { id: '4', question: 'Who wrote "Romeo and Juliet"?', answer: 'William Shakespeare' },
  { id: '5', question: 'What is the largest ocean on Earth?', answer: 'Pacific Ocean' },
  { id: '6', question: 'What is 8 × 6?', answer: '48' },
  { id: '7', question: 'Which country is known as the Land of the Rising Sun?', answer: 'Japan' },
  { id: '8', question: 'What is the chemical symbol for gold?', answer: 'Au' },
  { id: '9', question: 'How many continents are there?', answer: '7' },
  { id: '10', question: 'What is the capital of France?', answer: 'Paris' },
  { id: '11', question: 'Which animal is known as the King of the Jungle?', answer: 'Lion' },
  { id: '12', question: 'What is 15 - 8?', answer: '7' },
  { id: '13', question: 'Which gas do plants absorb from the atmosphere?', answer: 'Carbon Dioxide' },
  { id: '14', question: 'What is the smallest prime number?', answer: '2' },
  { id: '15', question: 'Which river is the longest in the world?', answer: 'Nile River' },
  { id: '16', question: 'What is 3 × 9?', answer: '27' },
  { id: '17', question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
  { id: '18', question: 'What is the hardest natural substance?', answer: 'Diamond' },
  { id: '19', question: 'How many sides does a triangle have?', answer: '3' },
  { id: '20', question: 'What is the capital of United States?', answer: 'Washington D.C.' }
];

export function getRandomQuestions(count: number = 10): Question[] {
  const shuffled = [...questionsPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}