// const socket = io();

// document.getElementById('registerForm').addEventListener('submit', (e) =>
// {
//     e.preventDefault();
//     const username = document.getElementById('username').value;
//     socket.emit('register', username);
// });

// socket.on('updateUsers', (users) =>
// {
//     const usersList = document.getElementById('users');
//     usersList.innerHTML = ''; // Clear the list
//     users.forEach(user =>
//     {
//         const listItem = document.createElement('li');
//         listItem.textContent = user.username;

//         const connectButton = document.createElement('button');
//         connectButton.textContent = 'Send File';
//         connectButton.className = 'bg-green-500 text-white px-2 py-1 rounded ml-2';
//         connectButton.addEventListener('click', () => initiateFileTransfer(user.id));

//         listItem.appendChild(connectButton);
//         usersList.appendChild(listItem);
//     });
// });

// function initiateFileTransfer(receiverId)
// {
//     const fileInput = document.createElement('input');
//     fileInput.type = 'file';

//     fileInput.addEventListener('change', () =>
//     {
//         const file = fileInput.files[0];
//         const reader = new FileReader();

//         reader.onload = () =>
//         {
//             const fileData = reader.result;
//             socket.emit('sendFile', { receiverId, fileData, fileName: file.name });
//             alert(`File "${file.name}" sent!`);
//         };

//         reader.readAsDataURL(file);
//     });

//     fileInput.click();
// }

// socket.on('receiveFile', ({ fileData, fileName }) =>
// {
//     const downloadLink = document.createElement('a');
//     downloadLink.href = fileData;
//     downloadLink.download = fileName;
//     downloadLink.textContent = `Download ${fileName}`;
//     downloadLink.className = 'block mt-2 text-blue-500 underline';

//     document.body.appendChild(downloadLink);
// });


const socket = io();
let currentUser = null;

document.getElementById('registerForm').addEventListener('submit', (e) =>
{
    e.preventDefault();
    const username = document.getElementById('username').value;
    currentUser = username;
    socket.emit('register', username);

    // Show main screen, hide login
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
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
            <button class="bg-green-500 text-white px-2 py-1 rounded">Send File</button>
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

            // Add to sent files list
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
            <a href="${fileData}" download="${fileName}" class="text-blue-500 hover:underline">Download</a>
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