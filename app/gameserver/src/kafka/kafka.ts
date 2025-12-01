import { createKafkaClient } from "kafka-ts";
import { RoomManager } from "../game/roommanager";

export function startKafkaClient(clientID: string, roomManager: RoomManager) {
  const kafka = createKafkaClient({
    clientId: 'game-server',
    bootstrapServers: [{ host: 'localhost', port: 9092 }],
  })
}
