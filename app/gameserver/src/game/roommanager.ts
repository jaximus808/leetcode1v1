import { createClient, RedisClientType } from "redis"
import { MatchResponse, Match } from "../kafka/match"
import { Player } from "./player"
import { Producer } from "kafkajs"
import { Server } from "socket.io"
import { v4 } from "uuid"
type Room = {
  roomCode: number
  problemID: number
  difficulty: string
  timeDuration: number
  players: Record<string, Player>
  expectedPlayers: number[]
  status: 'waiting' | 'ingame' | 'completed'
  startTime: number | null
  timoutOwnerPod: string | null
  description: string
  title: string
}


export class RoomManager {
  private podId: string
  private redis: RedisClientType;
  private redisPub: RedisClientType
  private redisSub: RedisClientType
  private io: Server
  private roomTimeouts: Map<number, NodeJS.Timeout> = new Map()


  constructor(io: Server, redisUrl: string) {
    this.io = io
    this.podId = process.env.POD_ID || v4()
    this.redis = createClient({ url: redisUrl })
    this.redisPub = createClient({ url: redisUrl })
    this.redisSub = createClient({ url: redisUrl })
  }

  async initialize() {
    await this.redis.connect()
    await this.redisPub.connect()
    await this.redisSub.connect()

    await this.redisSub.subscribe('room:control', (message) => {
      this.handleControlMessage(message)
    })
  }

  async createRoom(match: Match) {
    const room: Room = {
      roomCode: match.id,
      problemID: match.problem_id,
      players: {},
      expectedPlayers: [match.player1_id, match.player2_id],
      status: 'waiting',
      startTime: null,
      timoutOwnerPod: null,
      difficulty: match.difficulty,
      description: match.description,
      title: match.title,
      timeDuration: match.duration * 60
    }
    await this.redis.set(
      `room:${match.id}`,
      JSON.stringify(room),
      { EX: 3600 }
    )


    await this.redis.set(
      `player:${match.player1_id}:room`,
      match.id,
      { EX: 3600 }
    );
    await this.redis.set(
      `player:${match.player2_id}:room`,
      match.id,
      { EX: 3600 }
    );
    console.log("Room Created")
    return room
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    const data = await this.redis.get(`room:${roomCode}`);
    return data ? JSON.parse(data) : null;
  }

  async findRoomByUserId(userId: number): Promise<Room | null> {
    const roomCode = await this.redis.get(`player:${userId}:room`);
    if (!roomCode) return null;
    return this.getRoom(roomCode);
  }
  async updateRoom(room: Room): Promise<void> {
    await this.redis.set(
      `room:${room.roomCode}`,
      JSON.stringify(room),
      { EX: 3600 }
    );
  }

  async connectPlayer(socketId: string, userId: number, username: string): Promise<Room | null> {
    // Find the room this player is assigned to
    const room = await this.findRoomByUserId(userId);
    if (!room) {
      console.log(`❌ No room found for user ${userId}`);
      return null;
    }

    // Update the correct player
    room.players[userId] = {
      Id: userId,
      socketId: socketId,
      name: username,
      score: 0

    }
    await this.updateRoom(room);

    // Notify room that player connected
    this.io.to(`room:${room.roomCode}`).emit('player_connected', {
      userId,
      username,
    });

    // If both players connected, start the game
    if (Object.keys(room.players).length == 2) {
      await this.startGame(room)
    }
    console.log("playerAdded")
    return room;
  }

  async startGame(room: Room) {
    room.status = 'ingame';
    room.startTime = Date.now();
    room.timoutOwnerPod = this.podId; // This pod owns the timer

    await this.updateRoom(room);
    this.startTimeout(room);

    // Notify all pods
    this.io.to(`room:${room.roomCode}`).emit('game_started', {
      roomCode: room.roomCode,
      problemID: room.problemID,
      difficulty: room.difficulty,
      startTime: room.startTime,
      duration: room.timeDuration,
    })
  }

  private startTimeout(room: Room) {
    if (room.timoutOwnerPod !== this.podId) return;

    const duration = room.timeDuration

    const roomTimeout = setTimeout(async () => {
      const currentRoom = await this.getRoom(room.roomCode.toString());
      this.endGame(room.roomCode)
      clearTimeout(roomTimeout)
      this.roomTimeouts.delete(room.roomCode)
      return
    }, duration)

    this.roomTimeouts.set(room.roomCode, roomTimeout)

  }

  private async endGame(roomCode: number) {
    const room = await this.getRoom(roomCode.toString());
    if (!room || room.status === 'completed') return;

    room.status = 'completed'

    await this.updateRoom(room)

    if (room.timoutOwnerPod && room.timoutOwnerPod !== this.podId) {
      await this.sendControlMessage({
        type: 'stop_timer',
        roomCode,
        fromPod: this.podId
      });
    } else if (room.timoutOwnerPod === this.podId) {
      // We own the timer, stop it locally
      const timer = this.roomTimeouts.get(roomCode);
      if (timer) {
        clearInterval(timer);
        this.roomTimeouts.delete(roomCode);
      }
    }


    const playerKeys = Object.keys(room.players)
    const score1 = room.players[playerKeys[0]].score
    const score2 = room.players[playerKeys[1]].score

    const winner = (score1 > score2) ? playerKeys[0] : ((score1 < score2) ? playerKeys[1] : -1)
    const loser = (score1 < score2) ? playerKeys[0] : ((score1 > score2) ? playerKeys[1] : -1)

    // Broadcast game end to all players (via Socket.IO adapter)
    this.io.to(`room:${roomCode}`).emit('game_ended', {
      winner,
    });

    return {winner, loser}
    // CALL THIS IN SOCKET IO
    // this.producer.send({
    //   topic: 'game-over',
    //   messages: [{
    //     key: `game-over-${Date.now()}`,
    //     value: JSON.stringify({
    //       roomCode: roomCode,
    //       winner: winner,
    //        loser: loser
    //     })
    //   }]
    // })

  }

  private async sendControlMessage(message: any) {
    await this.redisPub.publish('room:control', JSON.stringify(message));
  }

  private async handleControlMessage(message: any) {
    if (message.type === 'stop_timer' && message.fromPod !== this.podId) {
      const timeout = this.roomTimeouts.get(message.roomCode);
      if (timeout) {
        clearTimeout(timeout);
        this.roomTimeouts.delete(message.roomCode);
        console.log(`⏹️ Stopped timer for ${message.roomCode} (requested by pod ${message.fromPod})`);
      }
    }
  }

  async cleanup() {
    this.roomTimeouts.forEach((timeout) => clearTimeout(timeout));
    await this.redis.quit();
    await this.redisPub.quit();
    await this.redisSub.quit();
  }
}
