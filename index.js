//_____ _    _ _      _    __  __ ____  
// / ____| |  | | |    / \  |  \/  |  _ \ 
//| (___ | |  | | |   / _ \ | |\/| | | | |
// \___ \| |  | | |  / ___ \| |  | | |_| |
// ____) | |__| | |_/ /   \ \_|  |_|____/ 
//|_____/ \____/|_____/     \_\          
//          S U L A - M D

import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import code from './pair.js'; // Pair route file

const app = express();
const PORT = process.env.PORT || 8000;

// For __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow more listeners
import('events').then(events => {
  events.EventEmitter.defaultMaxListeners = 500;
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static Routes
app.use('/code', code);

// Serve pair.html at /pair
app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

// Serve main.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🟢 Server running at: http://localhost:${PORT}`);
  console.log(`🔗 Powered by SULA-MD`);
});

export default app;