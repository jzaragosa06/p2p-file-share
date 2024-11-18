const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Set storage for uploaded files
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.set('view engine', 'ejs');

// Store file metadata
let files = [];

// Serve the homepage
app.get('/', (req, res) =>
{
    res.render('index', { files });
});

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) =>
{
    const { originalname, filename, size } = req.file;
    files.push({ originalname, filename, size });
    res.redirect('/');
});

// Handle WebRTC signaling
io.on('connection', (socket) =>
{
    console.log('A user connected');

    // Handle signaling data
    socket.on('signal', (data) =>
    {
        const { to, message } = data;
        io.to(to).emit('signal', { from: socket.id, message });
    });

    // Send active file list to newly connected clients
    socket.on('request-files', () =>
    {
        socket.emit('file-list', files);
    });

    socket.on('disconnect', () =>
    {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${PORT}`);
});
