import express from 'express';
import WebTorrent from 'webtorrent';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const client = new WebTorrent();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));
app.use(express.static(path.join(path.resolve(), 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Render the homepage
app.get('/', (req, res) =>
{
    res.render('index', { magnetURI: null });
});

// Endpoint to handle file seeding
app.post('/seed', upload.single('file'), (req, res) =>
{
    const filePath = req.file.path;

    client.seed(filePath, (torrent) =>
    {
        const magnetURI = torrent.magnetURI;

        // Clean up the uploaded file after seeding
        fs.unlinkSync(filePath);

        // Render the page with the magnet URI displayed
        res.render('index', { magnetURI });
    });
});

// Endpoint to handle file downloading
app.post('/download', (req, res) =>
{
    const magnetURI = req.body.magnetURI;

    client.add(magnetURI, (torrent) =>
    {
        torrent.files.forEach((file) =>
        {
            file.getBuffer((err, buffer) =>
            {
                if (err)
                {
                    return res.status(500).send('Error downloading file');
                }

                res.writeHead(200, {
                    'Content-Disposition': `attachment; filename="${file.name}"`,
                    'Content-Length': buffer.length
                });
                res.end(buffer);
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () =>
{
    console.log(`Server is running on http://localhost:${PORT}`);
});
