const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const server = http.createServer(app);

const wssToClient = new WebSocket.Server({ noServer: true });
const wssToESP32 = new WebSocket.Server({ noServer: true });

const userInfo = [
    {
        name: 'Pencil',
        type: 'Inorganic'
    },
    {
        name: 'Food',
        type: 'Organic',
    },
    {
        name: 'Bottle',
        type: 'Inorganic'
    },
    {
        name: 'Null',
        type: 'Null'
    },
    {
        name: 'Cake',
        type: 'Organic'
    },
    {
        name: 'Board',
        type: 'Inorganic'
    },
    {
        name: 'Botle',
        type: 'Inorganic'
    }
];

let latestCommand = "";

wssToClient.on('connection', ws => {
    ws.on('message', message => {
        const prediction = JSON.parse(message);
        console.log('Class: ', prediction.className);
        console.log('Probability: ', prediction.probability);

        const userMatch = userInfo.find(user => user.name === prediction.className);

        if (userMatch) {
            console.log('Matched user info:', userMatch);
            ws.send(JSON.stringify({
                message: 'User information found',
                user: userMatch
            }));

            if (userMatch.type === 'Organic') {
                latestCommand = "open_organic";
            } else if (userMatch.type === 'Inorganic') {
                latestCommand = "open_inorganic";
            }
        } else {
            console.log('No matching user information found.');
        }
    });

    ws.send('Hello! Message From Server to ReactJS!!');
});

app.get('/api/events', (req, res) => {
    res.json({ command: latestCommand });
    latestCommand = "";
});

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/toClient') {
        wssToClient.handleUpgrade(request, socket, head, (ws) => {
            wssToClient.emit('connection', ws, request);
        });
    } else if (request.url === '/toESP32') {
        wssToESP32.handleUpgrade(request, socket, head, (ws) => {
            wssToESP32.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});
