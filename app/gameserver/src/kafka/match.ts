export type Match = {
  id: number;
  player1_id: number;
  player2_id: number;
};

export type MatchResponse = {
  matches: Match[];
  timestamp: string; // ISO string or number for unix timestamp
};
