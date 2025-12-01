import { MatchResponse } from "../kafka/match"
import { Player } from "./player"

type Room = {
  roomCode: string
  problemID: number
  difficulty: 'Easy' | 'Meduim' | 'Hard'
  timeDuration: '10' | '20' | '30'
  players: Record<string, Player>
  player2Score: number
  status: 'waiting' | 'ingame' | 'completed'
  gameTimemout: NodeJS.Timeout | null
}


class RoomManager {
  private rooms: Record<string, Room> = {}

  createRoom(match: MatchResponse) {

  }

}

export const roomManager = new RoomManager();
