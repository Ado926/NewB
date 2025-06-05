const makeWASocket = require('@adiwajshing/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const Pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config'); // Import config

const plugins = new Map();

async function loadPlugins() {
    const pluginDir = path.join(__dirname, 'plugins');
    try {
        const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
        for (const file of files) {
            try {
                const pluginPath = path.join(pluginDir, file);
                const plugin = require(pluginPath); // Using require for simplicity with .js files
                if (plugin && typeof plugin.handler === 'function' && plugin.command) {
                    plugins.set(plugin.command, plugin);
                    console.log(`Loaded plugin: ${plugin.command}`);
                } else {
                    console.log(`Failed to load plugin from ${file}: Invalid structure`);
                }
            } catch (error) {
                console.log(`Error loading plugin from ${file}:`, error);
            }
        }
    } catch (error) {
        console.log('Error reading plugins directory:', error);
        // Create plugins directory if it doesn't exist
        if (error.code === 'ENOENT') {
            try {
                fs.mkdirSync(pluginDir);
                console.log('Created plugins directory.');
            } catch (mkdirError) {
                console.log('Error creating plugins directory:', mkdirError);
            }
        }
    }
}

async function connectToWhatsApp() {
    await loadPlugins(); // Load plugins before connecting
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: Pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
                                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (msgUpsert) => {
        const m = msgUpsert.messages[0];
        if (!m || !m.message) return;

        // Ensure message content is available
        const messageContent = m.message.conversation || m.message.extendedTextMessage?.text || "";
        if (!messageContent) return;

        // Simple command parsing (e.g., !ping or .ping)
        // You can customize the prefix
        const prefix = /^[\\/!#.]/;
        const usedPrefix = messageContent.match(prefix)?.[0];

        if (!usedPrefix) return; // Not a command

        const [command, ...args] = messageContent.slice(usedPrefix.length).trim().split(/ +/);
        const text = args.join(' ');

        const plugin = plugins.get(command.toLowerCase()) || Array.from(plugins.values()).find(p => p.command.includes(command.toLowerCase()));

        if (plugin) {
            try {
                console.log(`Executing command: ${command} with text: ${text} for ${m.key.remoteJid}`);
                await sock.sendMessage(m.key.remoteJid, { react: { text: '⏳', key: m.key } }); // Processing reaction
                await plugin.handler(m, { conn: sock, usedPrefix, command: command.toLowerCase(), text, config }); // Pass config to plugins
            } catch (error) {
                console.error(`Error executing plugin ${command}:`, error);
                await sock.sendMessage(m.key.remoteJid, { text: "❌ Ocurrió un error al procesar tu comando." }, { quoted: m });
                await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
            }
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: `Comando no encontrado: *${command}*` }, { quoted: m });
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❓', key: m.key } });
            console.log(`Command not found: ${command}`);
        }
    });

    console.log(`${config.botName} is starting...`);
}

connectToWhatsApp();
