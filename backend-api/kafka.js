const { Kafka } = require('kafkajs');
const supabase = require('./supabase');

const kafka = new Kafka({
  clientId: "backend-api",
  brokers: ["localhost:9092"]   // our Kafka broker
});

const producer = kafka.producer();
const matchRequestConsumer = kafka.consumer({ groupId: "backend-match-results" });

/**
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 * @param {any} matchData - The match data.
 * @returns {Promise<void>}
 */
async function createMatch(io, matchData) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          player1_id: parseInt(matchData.player_ids[0]),
          player2_id: parseInt(matchData.player_ids[1]),
          status: 'pending',
          problem_id: null
        }
      ])
      .select(`
            *,
            player1:players!player1_id(id, username, elo),
            player2:players!player2_id(id, username, elo)
          `)
      .single();

    if (error) {
      console.error('Error saving match to database:', error);
    } else {
      console.log('Match saved to database:', data);


      io.to('player-${data.player1_id}').emit('match-found', data);
      io.to('player-${data.player2_id}').emit('match-found', data);

      console.log('Match pushed via WebSocket');
    }
  } catch (err) {
    console.error('Error processing match message:', err);
  }
}

/**
 * @param { import('express').Express } app - The Express application.
 * @returns {Promise<void>}
  */
async function connectKafka(io) {
  await producer.connect();
  await matchRequestConsumer.connect();
  console.log("Kafka connected");

  await matchRequestConsumer.subscribe({ topic: ["match-found", "queue-update", "game-made"], fromBeginning: false });

  // TODO FINISH THIS SHIT
  matchRequestConsumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const matchData = JSON.parse(message.value.toString());
        console.log('Received match:', matchData);
        switch (topic) {
          case "queue-update":
            break;
          case "match-found":
            createMatch(io, matchData)
            break;
          case "game-made":
            break;


        }
      }
      catch (err) {

        console.error('Error processing match message:', err);
      }

      // Save match to database
    }
  });
}

module.exports = { producer, connectKafka };
