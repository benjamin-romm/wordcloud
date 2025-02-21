const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const FILE_PATH = path.join(__dirname, 'words.json');

// Function to load words from JSON file
function loadWords() {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const data = fs.readFileSync(FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading words:', err);
    }
    return {};
}

// Function to save words to JSON file
function saveWords(words) {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(words, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving words:', err);
    }
}

let words = loadWords(); // Load words when server starts

// Send existing words when a user connects
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('initialWords', words);
    socket.on('disconnect', () => console.log('A user disconnected'));
});

// Handle word submissions
app.post('/submit', (req, res) => {
    const { word } = req.body;
    if (!word) {
        return res.status(400).send({ error: 'Word is required' });
    }

    words[word] = (words[word] || 0) + 5; // Increase word count
    saveWords(words); // Save to JSON file

    io.emit('newWord', word); // Update frontend
    res.status(200).send({ message: 'Word added successfully' });
});

// Start server
server.listen(1000, () => console.log('Server running on port 1000'));

app.get('/', (req, res) => {
    res.send('Server is running! Try submitting words.');
});

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Connection Error:", err));