const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Load MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define a schema and model for storing words
const wordSchema = new mongoose.Schema({
    text: { type: String, required: true, unique: true },
    count: { type: Number, default: 1 }
});
const Word = mongoose.model('Word', wordSchema);

// Handle word submission
app.post('/submit', async (req, res) => {
    const { word } = req.body;
    if (!word) return res.status(400).send({ error: 'Word is required' });

    try {
        let existingWord = await Word.findOne({ text: word });
        if (existingWord) {
            existingWord.count += 1;
            await existingWord.save();
        } else {
            await Word.create({ text: word });
        }

        io.emit('newWord', word);
        res.status(200).send({ message: 'Word added successfully' });
    } catch (error) {
        console.error("❌ Error saving word:", error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Send words to new clients
io.on('connection', async (socket) => {
    console.log('A user connected');

    try {
        const words = await Word.find();
        const wordMap = words.reduce((acc, w) => ({ ...acc, [w.text]: w.count }), {});
        socket.emit('initialWords', wordMap);
    } catch (error) {
        console.error("❌ Error loading words:", error);
    }

    socket.on('disconnect', () => console.log('A user disconnected'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Health check route
app.get('/', (req, res) => res.send('Server is running! Try submitting words.'));
