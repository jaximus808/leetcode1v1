import { Server } from "socket.io"
import { RoomManager } from "./roommanager"

export function handleIO(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket) => {

  })
}
