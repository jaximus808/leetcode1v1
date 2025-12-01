const jwt = require('jsonwebtoken');
const { Server } = require("socket.io")
const supabase = require('./supabase');
const http = require('http');
const { producer } = require('./kafka');

const getPlayerIdFromToken = (token) => {

  console.log('Verifying token:', token ? 'Token exists' : 'Token is null/undefined');
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    return user.id;
  } catch (err) {
    return null;
  }
};


// Rest of your code here without try-catch
/**
 * @param { import('express').Express } app - The Express application. 
 * @returns {import('socket.io').Server} - The Socket.IO server instance.
  */
function MakeSocketIOInstance(app) {

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {

    let currentPlayerId = null;

    console.log('User connected:', socket.id);

    socket.on('join', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('join_room', (data) => {
      const { roomCode, userId, username } = data;
      if (roomCode) {
        socket.join(`room:${roomCode}`);
        console.log(`Player ${userId} (${username}) joined room:${roomCode}`);
      }
    });

    /*
      * matchReq : {
      * playerID: num jwt
      * difficulty: num
      * time: num 
      * }
      */
    socket.on('join-queue', async (matchReq) => {

      const { token, difficulty, time } = matchReq;

      if (!token || !difficulty || !time) {
        socket.emit('queue-error', { msg: "missing important info" });
        return;
      }

      // this will be decoded by jwt 

      const playerID = getPlayerIdFromToken(token);
      if (!playerID) {
        socket.emit('queue-error', { msg: "not authorized" });
        return;
      }

      // Get player info
      const { data: player, error } = await supabase
        .from('players')
        .select('id, username, elo')
        .eq('id', playerID)
        .single();

      if (error || !player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      try {

        /// uhhh i thought they request the difficulty and is speerate from time mapped
        // oops wait nvm this was a mistake with my engine lol - Jaxon
        // const timeMapping = {
        //   '10': 'easy',
        //   '20': 'medium',
        //   '30': 'hard'
        // }

        // const mappedTime = timeMapping[time] || 'easy';

        await producer.send({
          topic: 'match-requests',
          messages: [{
            key: player.id.toString(),
            value: JSON.stringify({
              player_id: player.id.toString(),
              elo_rank: player.elo,
              difficulty: difficulty,
              time: time,
              timestamp: Date.now()
            })
          }]
        });

        currentPlayerId = playerID
        socket.join(`player-${playerID}`)

        console.log(`Player ${playerID} joined room: player-${playerID}`);
        console.log(`Player ${socket.id} is now in rooms:`, Array.from(socket.rooms));

        console.log(`Player ${playerID} sent to matchmaking queue`);
        socket.emit('joined-queue')
      } catch (error) {
        socket.emit('queue-error', { msg: "not authorized" });
      }
      // send to kafka for matchmaking
    });

    async function cancelQueue() {
      if (!currentPlayerId) {
        console.log('no player ID found');
        return;
      }

      try {
        await producer.send({
          topic: 'match-cancel', //has to be implemented in go matchmaker
          messages: [
            {
              key: currentPlayerId.toString(),
              value: JSON.stringify({
                player_id: currentPlayerId,
                timestamp: Date.now()
              })
            }
          ]
        });
      }
      catch (error) {
        console.error('Error canceling search:', error);
        socket.emit('queue-error', { msg: "error trying to cancel queue" });
      }
    }

    socket.on('cancel-search', async () => {
      await cancelQueue()
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      cancelQueue()
    });
  });
  return { io, server }
}

module.exports = MakeSocketIOInstance;



