// const socket = io();
// const peerConnections = {};
// const downloadQueue = {};

// // Request the file list
// socket.emit('request-files');

// socket.on('file-list', (files) =>
// {
//     console.log('File list updated:', files);
// });

// // Handle WebRTC signaling
// socket.on('signal', async ({ from, message }) =>
// {
//     if (!peerConnections[from])
//     {
//         setupPeerConnection(from);
//     }
//     const pc = peerConnections[from];
//     await pc.setRemoteDescription(new RTCSessionDescription(message));

//     if (message.type === 'offer')
//     {
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit('signal', { to: from, message: pc.localDescription });
//     }
// });

// // Setup a peer connection
// function setupPeerConnection(peerId)
// {
//     const pc = new RTCPeerConnection();
//     peerConnections[peerId] = pc;

//     pc.onicecandidate = (event) =>
//     {
//         if (event.candidate)
//         {
//             socket.emit('signal', { to: peerId, message: event.candidate });
//         }
//     };

//     pc.ondatachannel = (event) =>
//     {
//         const channel = event.channel;
//         handleDataChannel(channel);
//     };

//     return pc;
// }

// // Handle data channel communication
// function handleDataChannel(channel)
// {
//     channel.onmessage = (event) =>
//     {
//         const { filename, chunk, done } = JSON.parse(event.data);

//         if (!downloadQueue[filename])
//         {
//             downloadQueue[filename] = [];
//         }
//         downloadQueue[filename].push(chunk);

//         if (done)
//         {
//             const fileData = new Blob(downloadQueue[filename]);
//             const url = URL.createObjectURL(fileData);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = filename;
//             a.click();
//             delete downloadQueue[filename];
//         }
//     };
// }

// // Trigger download via WebRTC
// document.querySelectorAll('.download-btn').forEach((btn) =>
// {
//     btn.addEventListener('click', () =>
//     {
//         const filename = btn.dataset.filename;
//         const originalName = btn.dataset.name;

//         const pc = setupPeerConnection(socket.id);
//         const channel = pc.createDataChannel('file-transfer');
//         channel.onopen = () =>
//         {
//             channel.send(JSON.stringify({ filename: originalName, request: true }));
//         };
//         handleDataChannel(channel);

//         pc.createOffer().then((offer) =>
//         {
//             pc.setLocalDescription(offer);
//             socket.emit('signal', { to: socket.id, message: offer });
//         });
//     });
// });
const socket = io();
const peerConnections = {};
const downloadQueue = {};

// Request the file list from the server
socket.emit('request-files');

// Update the file list when the server sends it
socket.on('file-list', (files) => {
    console.log('File list updated:', files);
});

// Handle WebRTC signaling messages from the server
socket.on('signal', async ({ from, message }) => {
    console.log('Signal received from:', from, 'Message:', message);

    if (!peerConnections[from]) {
        setupPeerConnection(from);
    }

    const pc = peerConnections[from];

    try {
        if (message.type) {
            // Handle SDP offer/answer messages
            console.log('Setting remote description:', message);
            await pc.setRemoteDescription(new RTCSessionDescription(message));

            if (message.type === 'offer') {
                const answer = await pc.createAnswer();
                console.log('Sending answer:', answer);
                await pc.setLocalDescription(answer);
                socket.emit('signal', { to: from, message: pc.localDescription });
            }
        } else if (message.candidate) {
            // Handle ICE candidates
            console.log('Adding ICE candidate:', message);
            await pc.addIceCandidate(new RTCIceCandidate(message));
        }
    } catch (error) {
        console.error('Error handling signaling message:', error);
    }
});

// Function to set up a WebRTC peer connection
function setupPeerConnection(peerId) {
    const pc = new RTCPeerConnection();
    peerConnections[peerId] = pc;

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate:', event.candidate);
            socket.emit('signal', { to: peerId, message: event.candidate });
        }
    };

    pc.ondatachannel = (event) => {
        console.log('Data channel opened:', event.channel.label);
        const channel = event.channel;
        handleDataChannel(channel);
    };

    return pc;
}

// Function to handle incoming data on a WebRTC data channel
function handleDataChannel(channel) {
    channel.onmessage = (event) => {
        console.log('Data received:', event.data);
        const { filename, chunk, done } = JSON.parse(event.data);

        if (!downloadQueue[filename]) {
            downloadQueue[filename] = [];
        }
        downloadQueue[filename].push(chunk);

        if (done) {
            // Reassemble file from received chunks
            const fileData = new Blob(downloadQueue[filename]);
            const url = URL.createObjectURL(fileData);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            delete downloadQueue[filename];
            console.log('Download completed for:', filename);
        }
    };
}

// Attach event listeners to the download buttons
document.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const filename = btn.dataset.filename;
        const originalName = btn.dataset.name;

        console.log('Requesting download for:', filename);

        // Create a peer connection and data channel for the download
        const pc = setupPeerConnection(socket.id);
        const channel = pc.createDataChannel('file-transfer');

        channel.onopen = () => {
            console.log('Requesting file via data channel:', originalName);
            channel.send(JSON.stringify({ filename: originalName, request: true }));
        };

        handleDataChannel(channel);

        // Start the WebRTC offer/answer process
        pc.createOffer()
            .then((offer) => {
                console.log('Sending WebRTC offer:', offer);
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                socket.emit('signal', { to: socket.id, message: pc.localDescription });
            })
            .catch((err) => {
                console.error('Error creating WebRTC offer:', err);
            });
    });
});