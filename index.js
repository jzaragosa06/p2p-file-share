
import express from 'express';
import WebTorrent from 'webtorrent';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20;



const app = express();
const client = new WebTorrent();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));
app.use(express.static(path.join(path.resolve(), 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// In-memory storage for magnet URIs and file metadata
const filesShared = [];

// Render the homepage
app.get('/', (req, res) =>
{
    res.render('index', { magnetURI: null, files: filesShared });
});

// Update /seed route to store URI and metadata
app.post('/seed', upload.single('file'), (req, res) =>
{
    if (!req.file)
    {
        return res.status(400).send('No file uploaded!');
    }


    const filePath = req.file.path;
    const fileName = req.file.originalname;

    client.seed(filePath, (torrent) =>
    {
        const magnetURI = torrent.magnetURI;

        // Add the file info to the list
        filesShared.push({
            name: fileName,
            magnetURI: magnetURI,
        });

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        // Render the page with the updated list of files
        res.render('index', { magnetURI: null, files: filesShared });
    });
});

function serveTorrentFiles(torrent, res)
{
    // Ensure the torrent is fully ready before accessing its files
    if (torrent.ready)
    {
        handleFiles(torrent, res);
    } else
    {
        torrent.once('ready', () =>
        {
            handleFiles(torrent, res);
        });
    }
}

// Helper to handle the files in a torrent
function handleFiles(torrent, res)
{
    torrent.files.forEach((file) =>
    {
        file.getBuffer((err, buffer) =>
        {
            if (err)
            {
                console.error(`Error getting buffer: ${err.message}`);
                return res.status(500).send('Error downloading file');
            }

            res.writeHead(200, {
                'Content-Disposition': `attachment; filename="${file.name}"`,
                'Content-Length': buffer.length,
            });
            res.end(buffer);
        });
    });
}
app.post('/download', (req, res) =>
{
    const magnetURI = req.body.magnetURI;

    // Check if the torrent is already being handled
    const existingTorrent = client.get(magnetURI);
    if (existingTorrent)
    {
        console.log(`Reusing existing torrent: ${magnetURI}`);
        serveTorrentFiles(existingTorrent, res); // Reuse the existing torrent
        return;
    }

    // Add the torrent if it doesn't already exist
    client.add(magnetURI, (torrent) =>
    {
        console.log(`Downloading new torrent: ${torrent.name}`);
        serveTorrentFiles(torrent, res);

        // Clean up the torrent when done
        torrent.on('done', () =>
        {
            console.log(`Torrent download complete: ${torrent.name}`);
            client.remove(magnetURI, () =>
            {
                console.log('Torrent removed from client');
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () =>
{
    console.log(`Server is running on http://localhost:${PORT}`);
});
