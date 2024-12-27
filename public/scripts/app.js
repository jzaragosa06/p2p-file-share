

const socket = io();
let currentUser = null;

// Function to switch between screens
function showScreen(screenId)
{
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById(screenId).classList.remove('hidden');
}

// Function to clear all file history
function clearFileHistory()
{
    document.getElementById('sentFiles').innerHTML = '';
    document.getElementById('receivedFiles').innerHTML = '';
}

// Handle user registration
document.getElementById('registerForm').addEventListener('submit', (e) =>
{
    e.preventDefault();
    const username = document.getElementById('username').value;
    currentUser = username;
    socket.emit('register', username);

    // Update UI
    document.getElementById('currentUserDisplay').textContent = `Logged in as: ${username}`;
    showScreen('mainScreen');
});

// Handle logout
document.getElementById('logoutButton').addEventListener('click', () =>
{
    // Notify server about logout
    socket.emit('logout');

    // Clear current user state
    currentUser = null;

    // Clear form and file history
    document.getElementById('username').value = '';
    clearFileHistory();

    // Switch to login screen
    showScreen('loginScreen');
});

socket.on('updateUsers', (users) =>
{
    const usersList = document.getElementById('users');
    usersList.innerHTML = '';
    users.forEach(user =>
    {
        // Skip current user
        if (user.id === socket.id) return;

        const listItem = document.createElement('li');
        listItem.className = 'flex items-center justify-between p-2 hover:bg-gray-50';
        listItem.innerHTML = `
            <span>${user.username}</span>
            <button class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors">
                Send File
            </button>
        `;

        const button = listItem.querySelector('button');
        button.addEventListener('click', () => initiateFileTransfer(user.id, user.username));
        usersList.appendChild(listItem);
    });
});

function initiateFileTransfer(receiverId, receiverName)
{
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    fileInput.addEventListener('change', () =>
    {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = () =>
        {
            const fileData = reader.result;
            const timestamp = new Date().toISOString();

            socket.emit('sendFile', {
                receiverId,
                fileData,
                fileName: file.name,
                timestamp,
                receiverName
            });

            addToSentFiles({
                fileName: file.name,
                receiver: receiverName,
                timestamp
            });
        };

        reader.readAsDataURL(file);
    });

    fileInput.click();
}

function addToSentFiles({ fileName, receiver, timestamp })
{
    const sentFiles = document.getElementById('sentFiles');
    const listItem = document.createElement('li');
    listItem.className = 'border-b p-2';
    listItem.innerHTML = `
        <div class="text-sm">
            <div class="font-medium">${fileName}</div>
            <div class="text-gray-500">To: ${receiver}</div>
            <div class="text-gray-400">${new Date(timestamp).toLocaleString()}</div>
        </div>
    `;
    sentFiles.appendChild(listItem);
}

function addToReceivedFiles({ fileName, sender, timestamp, fileData })
{
    const receivedFiles = document.getElementById('receivedFiles');
    const listItem = document.createElement('li');
    listItem.className = 'border-b p-2';
    listItem.innerHTML = `
        <div class="text-sm">
            <div class="font-medium">${fileName}</div>
            <div class="text-gray-500">From: ${sender}</div>
            <div class="text-gray-400">${new Date(timestamp).toLocaleString()}</div>
            <a href="${fileData}" download="${fileName}" 
               class="text-blue-500 hover:underline inline-block mt-1">
                Download
            </a>
        </div>
    `;
    receivedFiles.appendChild(listItem);
}

socket.on('receiveFile', ({ fileData, fileName, senderId, timestamp, senderName }) =>
{
    addToReceivedFiles({
        fileName,
        sender: senderName,
        timestamp,
        fileData
    });
});

// Handle connection/disconnection feedback
socket.on('connect', () =>
{
    console.log('Connected to server');
});

socket.on('disconnect', () =>
{
    console.log('Disconnected from server');
    // If disconnected unexpectedly, show login screen
    if (currentUser)
    {
        alert('Lost connection to server. Please log in again.');
        showScreen('loginScreen');
        currentUser = null;
    }
});