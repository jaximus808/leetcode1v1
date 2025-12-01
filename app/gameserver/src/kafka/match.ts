import { z } from 'zod'

/**
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
*/
const MatchSchema = z.object({
  id: z.number(),
  player1_id: z.number(),
  player2_id: z.number(),
  problem_id: z.number(),
  difficulty: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.number(),
});

// Define the schema for the entire MatchResponse message
export const MatchResponseSchema = z.object({
  matches: z.array(MatchSchema),
  timestamp: z.union([z.string().datetime(), z.number()]), // Accepts ISO string or number
});

export type Match = z.infer<typeof MatchSchema>;
export type MatchResponse = z.infer<typeof MatchResponseSchema>;
