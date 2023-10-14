const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tmi = require('tmi.js');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})

const names = ['Malenia', 'Radahn', 'Margit'];
const images = {
  Malenia: ['malenia.png', 'malenia2.png'],
  Radahn: ['radahn.png', 'radahn2.png'],
  Margit: ['margit.png']
};

let correctAnswer = null;
let timer = null;
const imageUrl = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-300x300.png';

showImage()

const options = {
  options: {
    debug: false
  },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: process.env.TMI_USERNAME,
    password: process.env.TMI_PASSWORD
  },
  channels: ['fanatsy68']
}

const client = tmi.Client(options);
client.connect();

client.on('chat', (channel, userstate, message, self) => {
  const username = userstate['display-name'];
  const userId = userstate['user-id'];
  if (timer != null && (message.toLowerCase() === correctAnswer.toLowerCase() || message === correctAnswer)) {
    console.log('Correct answer! ' + username);
    timer = null;
    correctAnswer = null;
    client.say(channel, `@${username} has guessed the correct answer!`);
    try {
      updateExtensionGuesses(userId, username)
    } catch (err) {
      console.log(err);
    }
  }

});

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function updateExtensionGuesses(userId, username) {
  return new Promise((resolve, reject) => {
    let sql = `
  INSERT INTO pets (userId, name, imageUrl, xp, level, subs, gifts, messages, bits, guess, quiz)
  VALUES (?, ?, ?, 1, 1, 0, 0, 0, 0, 1, 0)
  ON DUPLICATE KEY UPDATE guess = guess + 1, xp = xp + VALUES(xp)
  `;
    db.query(sql, [userId, username, imageUrl], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function showImage() {
  const delay = Math.floor(Math.random() * (1740000 - 900000 + 1)) + 900000;

  setTimeout(() => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomImage = images[randomName][Math.floor(Math.random() * images[randomName].length)];

    io.emit('newImage', randomImage);
    correctAnswer = randomName;
    console.log(correctAnswer);

    timer = setTimeout(() => {
      correctAnswer = null;
      timer = null;
    }, 5 * 60 * 1000);

    showImage();
  }, delay);
}