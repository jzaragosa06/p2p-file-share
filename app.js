const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');

// Store users in memory (in a production app, you'd use a database)
const users = new Map();

app.get('/', (req, res) =>
{
    // res.render('index');
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

io.on('connection', (socket) =>
{
    console.log('A user connected: ' + socket.id);

    // Handle user registration
    socket.on('register', (username) =>
    {
        users.set(socket.id, { id: socket.id, username });
        // Broadcast updated user list to all clients
        io.emit('updateUsers', Array.from(users.values()));
    });

    // Handle explicit logout
    socket.on('logout', () =>
    {
        if (users.has(socket.id))
        {
            users.delete(socket.id);
            // Broadcast updated user list to all clients
            io.emit('updateUsers', Array.from(users.values()));
            console.log('User logged out: ' + socket.id);
        }
    });

    // Handle file transfer
    socket.on('sendFile', ({ receiverId, fileData, fileName, timestamp, receiverName }) =>
    {
        const sender = users.get(socket.id);
        if (sender && users.has(receiverId))
        {
            io.to(receiverId).emit('receiveFile', {
                fileData,
                fileName,
                senderId: socket.id,
                senderName: sender.username,
                timestamp
            });
        }
    });

    // Handle disconnection (including unexpected disconnects)
    socket.on('disconnect', () =>
    {
        if (users.has(socket.id))
        {
            users.delete(socket.id);
            // Broadcast updated user list to all clients
            io.emit('updateUsers', Array.from(users.values()));
            console.log('User disconnected: ' + socket.id);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${PORT}`);
});