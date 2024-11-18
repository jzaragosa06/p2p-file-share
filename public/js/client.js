const socket = io();
const peerConnections = {};
const downloadQueue = {};

// Request the file list
socket.emit('request-files');

socket.on('file-list', (files) =>
{
    console.log('File list updated:', files);
});

// Handle WebRTC signaling
socket.on('signal', async ({ from, message }) =>
{
    if (!peerConnections[from])
    {
        setupPeerConnection(from);
    }
    const pc = peerConnections[from];
    await pc.setRemoteDescription(new RTCSessionDescription(message));

    if (message.type === 'offer')
    {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { to: from, message: pc.localDescription });
    }
});

// Setup a peer connection
function setupPeerConnection(peerId)
{
    const pc = new RTCPeerConnection();
    peerConnections[peerId] = pc;

    pc.onicecandidate = (event) =>
    {
        if (event.candidate)
        {
            socket.emit('signal', { to: peerId, message: event.candidate });
        }
    };

    pc.ondatachannel = (event) =>
    {
        const channel = event.channel;
        handleDataChannel(channel);
    };

    return pc;
}

// Handle data channel communication
function handleDataChannel(channel)
{
    channel.onmessage = (event) =>
    {
        const { filename, chunk, done } = JSON.parse(event.data);

        if (!downloadQueue[filename])
        {
            downloadQueue[filename] = [];
        }
        downloadQueue[filename].push(chunk);

        if (done)
        {
            const fileData = new Blob(downloadQueue[filename]);
            const url = URL.createObjectURL(fileData);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            delete downloadQueue[filename];
        }
    };
}

// Trigger download via WebRTC
document.querySelectorAll('.download-btn').forEach((btn) =>
{
    btn.addEventListener('click', () =>
    {
        const filename = btn.dataset.filename;
        const originalName = btn.dataset.name;

        const pc = setupPeerConnection(socket.id);
        const channel = pc.createDataChannel('file-transfer');
        channel.onopen = () =>
        {
            channel.send(JSON.stringify({ filename: originalName, request: true }));
        };
        handleDataChannel(channel);

        pc.createOffer().then((offer) =>
        {
            pc.setLocalDescription(offer);
            socket.emit('signal', { to: socket.id, message: offer });
        });
    });
});
