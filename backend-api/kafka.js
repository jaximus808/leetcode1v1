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

    const { player_ids, difficulty, duration } = matchData

    const { problem_data, problem_error } = await supabase
      .from("problems")
      .select("id")
      .eq("difficulty", difficulty)
      .order("random()")
      .limit(1);

    if (problem_error) {
      console.error('Error saving match to database:', problem_error);
      return
    }

    if (!problem_data) {
      console.error('Error saving match to database: NO PROLBME FOR GIVEN DIFFICULTY');
      return
    }

    const problem_id = problem_data.id

    const { match_data, error } = await supabase
      .from('matches')
      .insert([
        {
          player1_id: parseInt(player_ids[0]),
          player2_id: parseInt(player_ids[1]),
          status: 'pending',
          problem_id: problem_id
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving match to database:', error);
      return
    }

    const match_id = match_data.id


    await producer.send({
      topic: 'room-create',
      messages: [{
        key: match_id.toString(),
        value: JSON.stringify({
          players: player_ids,
          duration: duration,
          problem_id: problem_id,
          match_id: match_id,
          timestamp: Date.now()
        })
      }]
    });

    io.to(`player-${data.player1_id}`).emit('match-found');
    io.to(`player-${data.player2_id}`).emit('match-found');

    console.log('Match pushed via WebSocket');
  } catch (err) {
    console.error('Error processing match message:', err);
  }
}

/**
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 * @param {any} matchData - The match data.
 * @returns {Promise<void>}
 */
async function queueUpdate(io, matchData) {
  try {
    const { type, player_id } = matchData

    switch (type) {
      case "joined_queue":
        io.to(`player-${player_id}`).emit('joined-queue')
        break
    }
  } catch (err) {
    console.error('Error processing match message:', err);
  }
}

/**
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 * @param {any} matchData - The match data.
 * @returns {Promise<void>}
 */
async function gameMade(io, matchData) {
  try {
    const { type, player_id, room_code } = matchData

    switch (type) {
      case "joined_queue":
        io.to(`player-${player_id}`).emit('game-made', room_code)
        break
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
            queueUpdate(io, matchData)
            break;
          case "match-found":
            createMatch(io, matchData)
            break;
          case "game-made":
            gameMade(io, matchData)
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
