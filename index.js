const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const names = ['Malenia', 'Radahn', 'Margit'];
const images = {
    Malenia: ['malenia.png', 'malenia2.png'],
    Radahn: ['radahn.png', 'radahn2.png'],
    Margit: ['margit.png']
};

setInterval(() => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomImage = images[randomName][Math.floor(Math.random() * images[randomName].length)];

    io.emit('newImage', randomImage);
}, 20000); 

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});