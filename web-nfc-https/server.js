const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/registro', (req,res)=>{
  console.log('Registro recebido:', req.body);
  const backend = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
  fetch(backend + '/api/registro', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body)})
    .then(r => r.json()).then(j => res.json(j)).catch(e => res.status(500).json({ error: String(e) }));
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const cert = fs.readFileSync('cert.pem');
const key = fs.readFileSync('key.pem');
https.createServer({ cert, key }, app).listen(3443, ()=> console.log('HTTPS server running at https://localhost:3443'));
