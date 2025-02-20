const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',  // Allows requests from any origin
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));
app.use(express.json());

let words = {};

app.post('/submit', (req, res) => {
    const { word } = req.body;
    if (word) {
        words[word] = (words[word] || 0) + 1;
        io.emit('newWord', word);
        res.status(200).send({ message: 'Word added successfully' });
    } else {
        res.status(400).send({ error: 'Word is required' });
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('initialWords', words);
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Use process.env.PORT for Render hosting
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.get('/', (req, res) => {
    res.send('Server is running! Try submitting words.');
});
