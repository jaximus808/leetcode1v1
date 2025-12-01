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
  const { groups } = matchData

  const matchesInsertions = []

  for (const group of groups) {

    const { difficulty, time_duration, matches } = group

    const { data: problem_data, error: problem_error } = await supabase
      .from("problems")
      .select("id")
      .eq("difficulty", difficulty)
    if (problem_error) {
      console.error('Could not get problems for the difficulty', problem_error)
      continue
    }

    if (!problem_data) {
      console.error('Could not get problems for the difficulty')
      continue
    }
    for (const match of matches) {
      const problem_id = problem_data[Math.floor(Math.random() * problem_data.length)]

      matchesInsertions.push(
        {
          player1_id: parseInt(match.player_ids[0]),
          player2_id: parseInt(match.player_ids[1]),
          status: 'pending',
          problem_id: problem_id,
          time_duration: time_duration,
        }
      )
    }
  }

  const { data: matches_data, error: match_err } = await supabase.from('matches').insert(matchesInsertions).select('id, player1_id, player2_id')

  if (match_err) {
    console.error("failed to insert all new matches", error)
    return
  }

  for (const match_data of matches_data) {
    io.to(`player-${match_data.player1_id}`).emit('match-found');
    io.to(`player-${match_data.player2_id}`).emit('match-found');
  }
  try {
    await producer.send({
      topic: 'room-create',
      messages: [{
        key: `room-create-${Date.now()}`,
        value: JSON.stringify({
          matches: matchesInsertions,
          timestamp: Date.now()
        })
      }]
    });

  } catch (error) {
    console.error("failed to produce kafka message for creating rooms", error)
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
