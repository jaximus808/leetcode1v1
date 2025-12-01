import { create } from 'domain';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';


export function InitSocket(app: Express.Application) {
  const httpServer = createServer(app)
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });


  return { httpServer, io }

}
