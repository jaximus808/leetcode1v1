import { Socket } from "socket.io"

export type Player = {
  Id: number
  name: string
  socketId: string
  score: number
}
