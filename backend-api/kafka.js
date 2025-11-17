const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"]   // your Kafka broker
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "group1" });

async function connectKafka() {
  await producer.connect();
  await consumer.connect();
  console.log("Kafka connected");

  await consumer.subscribe({ topic: "test-topic", fromBeginning: true });

  consumer.run({
    eachMessage: async ({ message }) => {
      console.log(`Received: ${message.value.toString()}`);
    }
  });
}

module.exports = { producer, consumer, connectKafka };
