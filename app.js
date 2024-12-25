// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');

// // Mock user list (In future, replace with a database)
// const users = [];

// // Routes
// app.get('/', (req, res) =>
// {
//     res.render('index', { users });
// });

// app.get('/users', (req, res) =>
// {
//     res.render('users', { users });
// });

// // WebSocket setup
// io.on('connection', (socket) =>
// {
//     console.log('A user connected: ' + socket.id);

//     // Register user
//     socket.on('register', (username) =>
//     {
//         users.push({ id: socket.id, username });
//         io.emit('updateUsers', users); // Broadcast user list update
//     });

//     // File transfer initiation
//     socket.on('sendFile', ({ receiverId, fileData, fileName }) =>
//     {
//         io.to(receiverId).emit('receiveFile', { fileData, fileName, senderId: socket.id });
//     });

//     // Handle user disconnection
//     socket.on('disconnect', () =>
//     {
//         const index = users.findIndex(user => user.id === socket.id);
//         if (index !== -1)
//         {
//             users.splice(index, 1);
//             io.emit('updateUsers', users);
//         }
//         console.log('User disconnected: ' + socket.id);
//     });
// });

// // Start server
// const PORT = 3000;
// server.listen(PORT, () =>
// {
//     console.log(`Server running on http://localhost:${PORT}`);
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const users = [];

app.get('/', (req, res) =>
{
    res.render('index');
});

io.on('connection', (socket) =>
{
    console.log('A user connected: ' + socket.id);

    socket.on('register', (username) =>
    {
        users.push({ id: socket.id, username });
        io.emit('updateUsers', users);
    });

    socket.on('sendFile', ({ receiverId, fileData, fileName, timestamp, receiverName }) =>
    {
        const sender = users.find(user => user.id === socket.id);
        io.to(receiverId).emit('receiveFile', {
            fileData,
            fileName,
            senderId: socket.id,
            senderName: sender.username,
            timestamp
        });
    });

    socket.on('disconnect', () =>
    {
        const index = users.findIndex(user => user.id === socket.id);
        if (index !== -1)
        {
            users.splice(index, 1);
            io.emit('updateUsers', users);
        }
        console.log('User disconnected: ' + socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () =>
{
    console.log(`Server running on http://localhost:${PORT}`);
});