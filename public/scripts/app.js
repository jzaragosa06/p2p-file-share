const socket = io();

document.getElementById('registerForm').addEventListener('submit', (e) =>
{
    e.preventDefault();
    const username = document.getElementById('username').value;
    socket.emit('register', username);
});

socket.on('updateUsers', (users) =>
{
    const usersList = document.getElementById('users');
    usersList.innerHTML = ''; // Clear the list
    users.forEach(user =>
    {
        const listItem = document.createElement('li');
        listItem.textContent = user.username;

        const connectButton = document.createElement('button');
        connectButton.textContent = 'Send File';
        connectButton.className = 'bg-green-500 text-white px-2 py-1 rounded ml-2';
        connectButton.addEventListener('click', () => initiateFileTransfer(user.id));

        listItem.appendChild(connectButton);
        usersList.appendChild(listItem);
    });
});

function initiateFileTransfer(receiverId)
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
            socket.emit('sendFile', { receiverId, fileData, fileName: file.name });
            alert(`File "${file.name}" sent!`);
        };

        reader.readAsDataURL(file);
    });

    fileInput.click();
}

socket.on('receiveFile', ({ fileData, fileName }) =>
{
    const downloadLink = document.createElement('a');
    downloadLink.href = fileData;
    downloadLink.download = fileName;
    downloadLink.textContent = `Download ${fileName}`;
    downloadLink.className = 'block mt-2 text-blue-500 underline';

    document.body.appendChild(downloadLink);
});
