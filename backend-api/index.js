require('dotenv').config();

const express = require("express");

const connectDB = require('./db'); 
const { connectKafka, producer } = require('./kafka');
const app = express();
app.use(express.json());


connectDB();
connectKafka().catch(err => {
  console.error("Kafka connection error:", err);
});

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
