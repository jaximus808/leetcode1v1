import express from 'express'
import cors from 'cors';
import dotenv from 'dotenv';

import { InitSocket } from './socket';
import { initializeRedis, stopRedis } from './redis';

const app = express()

const { httpServer, io } = InitSocket(app)

const PORT = process.env.PORT || 4000;

async function start() {
  await initializeRedis(io);

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

