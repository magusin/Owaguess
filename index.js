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

// const names = ['Malenia', 'Radahn', 'Loup', 'Hoarah'];
// const images = {
//   Malenia: ['malenia.png'],
//   Radahn: ['radahn.png'],
//   Hoarah: ['hoarah.png'],
//   Loup: ['loup.png']
// };
const names = ['Fortissax', 'Loup', 'Maliketh', 'Placidusax', 'Godfrey', 'Géant', 'O\'neil', 'Malenia', 'Rennala', 'Mohg', 'Radahn'];
const media = {
  Fortissax: ['fortissax.mp4'],
  Malenia: ['malenia.png', 'malenia.mp4'],
  Loup: ['loup.mp4'],
  Maliketh: ['maliketh.mp4'],
  Placidusax: ['placidusax.mp4'],
  Godfrey: ['godfrey.mp4'],
  Géant: ['géant.mp4'],
  "O'neil": ['o\'neil.mp4'],
  Rennala: ['rennala.mp4'],
  Mohg: ['mohg.mp4'],
  Radahn: ['radahn.mp4']
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
  if (timer != null && message.toLowerCase().includes(correctAnswer.toLowerCase())) {
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
  if (message === '!myguess') { 
    try {
      db.query('SELECT guess FROM pets WHERE userId = ?', [userId], (err, result) => {
        if (err) {
          console.log(err);
        } if (result.length === 0) {
          client.say(channel, `@${username} has not guessed yet!`);
        }   
        else {
          client.say(channel, `@${username} has guessed ${result[0].guess} times!`);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
  if (message === '!topguess') {
    try {
      db.query('SELECT name, guess FROM pets ORDER BY guess DESC LIMIT 5', (err, result) => {
        if (err) {
          console.log(err);
        } else {
          client.say(channel, `Top guessers:`);
          for (let i = 0; i < result.length; i++) {
            client.say(channel, `${i+1}${i + 1 === 1 ? 'er' : 'ème'}. ${result[i].name} : ${result[i].guess} guesses`);
          }
        }
      });
    } catch (err) {
      console.error(err);
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
  // const delay = Math.floor(Math.random() * (1740000 - 900000 + 1)) + 900000;
  const delay = 60000;
  setTimeout(() => {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomMedia = media[randomName][Math.floor(Math.random() * media[randomName].length)];

    io.emit('newMedia', randomMedia);
    correctAnswer = randomName;
    console.log(correctAnswer);

    timer = setTimeout(() => {
      correctAnswer = null;
      timer = null;
    }, 45000); //5 * 60 * 1000

    showImage();
  }, delay);
}