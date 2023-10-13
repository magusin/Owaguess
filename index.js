const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const names = ['Malenia', 'Radahn'];
const images = {
    Malenia: ['malenia.jpg', 'malenia2.png'],
    Radahn: ['radahn.jpg', 'radahn2.png']
};

setInterval(() => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomImage = images[randomName][Math.floor(Math.random() * images[randomName].length)];

    io.emit('newImage', randomImage);
}, 10000); 

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});