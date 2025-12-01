import { Server, Socket } from "socket.io"
import { RoomManager } from "./roommanager"

export function handleIO(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join_room', async (data: { roomCode: string, userId: number, username: string }) => {
      const { roomCode, userId, username } = data;
      
      // Join the Socket.IO room
      socket.join(`room:${roomCode}`);
      
      // Connect player to the game room
      const room = await roomManager.connectPlayer(socket.id, userId, username);
      
      if (room) {
        socket.emit('room_joined', { 
          roomCode, 
          problemId: room.problemID,
          duration: room.timeDuration 
        });
      } else {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}