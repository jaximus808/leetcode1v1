export type Match = {
  id: number;
  player1_id: number;
  player2_id: number;
  problem_id: number;
  difficulty: string;
  title: string;
  description: string;
  duration: number;
};

export type MatchResponse = {
  matches: Match[];
  timestamp: string; // ISO string or number for unix timestamp
};
