import { Socket } from "socket.io"

export type Player = {
  Id: string
  name: string
  socket: Socket | null
  score: 0
}
