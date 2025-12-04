import express from 'express'
import cors from 'cors';
import dotenv from 'dotenv';

import { InitSocket } from './socket';
import { initializeRedis, stopRedis } from './redis';
import { RoomManager } from './game/roommanager';
import { handleIO } from './game/sockethandlers';
import { startKafkaClient } from './kafka/kafka';

const app = express()

// Health check endpoint for Kubernetes
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'gameserver' });
});

const { httpServer, io } = InitSocket(app)

const PORT = process.env.PORT || 4000;

async function start() {
  await initializeRedis(io);

  const roomManager = new RoomManager(io, process.env.REDIS_URL ?? 'redis://localhost:6379')

  await roomManager.initialize()

  handleIO(io, roomManager)

  startKafkaClient(roomManager)

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(async () => {
    await stopRedis()
    process.exit(0);
  });
});

start().catch(console.error)

