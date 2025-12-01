import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server } from 'socket.io'


const pubClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
const subClient = pubClient.duplicate();

export async function initializeRedis(io: Server) {
  try {
    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected');
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    process.exit(1);
  }
}

export async function stopRedis() {
  await pubClient.close()
  await subClient.close()
}


