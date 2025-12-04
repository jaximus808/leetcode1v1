import { EachMessagePayload, Kafka, Producer } from 'kafkajs'
import { RoomManager } from "../game/roommanager";
import { MatchResponse, MatchResponseSchema } from './match';
import z from 'zod';

const kafka = new Kafka({
  clientId: 'game-server',
  brokers: [process.env.KAFKA_BROKERS || "kafka-svc:9093"]
})
export async function startKafkaClient(roomManager: RoomManager): Promise<Producer> {
  const producer = kafka.producer()
  const consumer = kafka.consumer({ groupId: 'backend-gameserver' })

  await producer.connect()
  await consumer.connect()

  console.log("kafka connected")

  await consumer.subscribe({ topics: ['room-create'] })

  consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      try {
        if (message.value) {
          const data = JSON.parse(message.value.toString())

          const matchResponseData: MatchResponse = MatchResponseSchema.parse(data);

          matchResponseData.matches.forEach(async (match) => {
            console.log(`Match ID: ${match.id}`);
            const room = await roomManager.createRoom(match)

            producer.send({
              topic: 'game-made',
              messages: [{
                key: `game-made-${Date.now()}`,
                value: JSON.stringify({
                  playerIds: room.expectedPlayers,
                  roomCode: match.id,
                  problemId: match.problem_id
                })
              }]
            })
          });
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error('Validation Error: Incoming Kafka message does not match schema.', err);

        } else {
          // Handle JSON parsing errors or other exceptions
          console.error('General Error processing message:', err);
        }
      }
    }
  })
  return producer
}
