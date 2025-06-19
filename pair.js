//_____ _    _ _      _    __  __ ____  
 // / ____| |  | | |    / \  |  \/  |  _ \ 
 //| (___ | |  | | |   / _ \ | |\/| | | | |
 // \___ \| |  | | |  / ___ \| |  | | |_| |
 // ____) | |__| | |_/ /   \ \_|  |_|____/ 
 //|_____/ \____/|_____/     \_\          
 
//             S U L A - M D

import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser } from '@whiskeysockets/baileys';
import { upload } from './mega.js';

const router = express.Router();

// Ensure the session directory exists
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('Error removing file:', e);
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    let dirs = './' + (num || `session`);
    
    // Remove existing session if present
    await removeFile(dirs);
    
    async function initiateSession() {
        const { state, saveCreds } = await useMultiFileAuthState(dirs);

        try {
            let SUPUNMDInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
            });

            if (!SUPUNMDInc.authState.creds.registered) {
                await delay(2000);
                num = num.replace(/[^0-9]/g, '');
                const code = await SUPUNMDInc.requestPairingCode(num);
                if (!res.headersSent) {
                    console.log({ num, code });
                    await res.send({ code });
                }
            }

            SUPUNMDInc.ev.on('creds.update', saveCreds);
            SUPUNMDInc.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(10000);
                    const sessionGlobal = fs.readFileSync(dirs + '/creds.json');

                    // Helper to generate a random Mega file ID
                    function generateRandomId(length = 6, numberLength = 4) {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let result = '';
                        for (let i = 0; i < length; i++) {
                            result += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                        const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                        return `${result}${number}`;
                    }

                    // Upload session file to Mega
                    const megaUrl = await upload(fs.createReadStream(`${dirs}/creds.json`), `${generateRandomId()}.json`);
                    let stringSession = megaUrl.replace('https://i.ibb.co/rKXJXkts/bmb-xmd.jpg/', ''); // Extract session ID from URL
                    stringSession = '𝚉𝙰𝙽𝚃𝙰-𝚇𝙼𝙳=' + stringSession;  // Prepend your name to the session ID

                    // Send the session ID to the target number
                    const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                    await SUPUNMDInc.sendMessage(userJid, { text: stringSession });

                    // Send confirmation message
                    await SUPUNMDInc.sendMessage(userJid, { text: "𝐙𝐀𝐍𝐓𝐀-𝐗𝐌𝐃  𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐅𝐔𝐋𝐋👇*\n\n*⭕ WHATSAPP CHANNEL :*\n\n> https://whatsapp.com/channel/0029Vb4rsUd1CYoZLmQ8o82R\n\n*⭕Contact Owner :*\n\n> wa.me/9494760879639\n\n\n🚫 *𝗗𝗢𝗡𝗧 𝗦𝗛𝗔𝗥𝗘 𝗬𝗢𝗨𝗥 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 𝗜𝗗* 🚫" });
                    
                    // Clean up session after use
                    await delay(100);
                    removeFile(dirs);
                    process.exit(0);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log('Connection closed unexpectedly:', lastDisconnect.error);
                    await delay(10000);
                    initiateSession(); // Retry session initiation if needed
                }
            });
        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) {
                res.status(503).send({ code: 'Service Unavailable' });
            }
        }
    }

    await initiateSession();
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
    console.log('Caught exception: ' + err);
});

export default router;