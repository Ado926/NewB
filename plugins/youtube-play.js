import fetch from 'node-fetch';

/**
 * Handles the 'play' command to search for a YouTube video, send its information, and then send the audio.
 * @param {object} m The message object from Baileys.
 * @param {object} options Additional options.
 * @param {object} options.conn The Baileys socket connection.
 * @param {string} options.usedPrefix The prefix used to call the command.
 * @param {string} options.command The command invoked.
 * @param {string} options.text The arguments passed to the command (search query).
 */
async function handler(m, { conn, usedPrefix, command, text }) {
    if (!text) {
        await conn.sendMessage(m.chat, { text: `Usage: ${usedPrefix}${command} <search query>` }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: '❓', key: m.key } });
        return;
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        // Search for the YouTube video
        const searchApiUrl = `https://delirius-apiofc.vercel.app/youtube/search?query=${encodeURIComponent(text)}`;
        const searchResponse = await fetch(searchApiUrl);
        const searchData = await searchResponse.json();

        if (!searchData.data || searchData.data.length === 0) {
            await conn.sendMessage(m.chat, { text: 'No video results found for your query.' }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return;
        }

        const video = searchData.data[0]; // Take the first result

        // Construct the informational message
        const infoMessage = `
乂 *Y T - P L A Y*
*Title:* ${video.title}
*Duration:* ${video.duration}
*Channel:* ${video.channel}
*Published:* ${video.published}
*Views:* ${video.views}
*Link:* ${video.url}

Sending audio, please wait...
        `;

        // Send the informational message with thumbnail
        if (video.thumbnail) {
            await conn.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: infoMessage }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: infoMessage }, { quoted: m });
        }

        // Download the audio
        // Using a different API for download as per the original example structure.
        // Replace with a reliable API if this one is not working.
        const downloadApiUrl = `https://api.vreden.my.id/api/ytplay?query=${encodeURIComponent(text)}`;
        let audioBuffer;
        try {
            const audioResponse = await fetch(downloadApiUrl);
            if (!audioResponse.ok) {
                // Try another API if the first one fails
                console.log(`Primary audio download API failed with status: ${audioResponse.status}. Trying fallback.`);
                const fallbackApiUrl = `https://vihangayt.me/download/ytmp3?url=${encodeURIComponent(video.url)}`; // Example fallback
                const fallbackResponse = await fetch(fallbackApiUrl);
                if (!fallbackResponse.ok) {
                     throw new Error(`Fallback audio download failed: ${fallbackResponse.statusText}`);
                }
                const fallbackResult = await fallbackResponse.json();
                if (!fallbackResult.data || !fallbackResult.data.download_url) {
                    throw new Error('Fallback API did not return a valid download URL.');
                }
                const finalAudioResponse = await fetch(fallbackResult.data.download_url);
                 if (!finalAudioResponse.ok) {
                    throw new Error(`Audio download from fallback URL failed: ${finalAudioResponse.statusText}`);
                }
                audioBuffer = await finalAudioResponse.buffer();

            } else {
                 audioBuffer = await audioResponse.buffer();
            }


        } catch (downloadError) {
            console.error('Error downloading audio:', downloadError);
            await conn.sendMessage(m.chat, { text: `Error downloading audio: ${downloadError.message}` }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return;
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            await conn.sendMessage(m.chat, { text: 'Failed to download audio or audio is empty.' }, { quoted: m });
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return;
        }

        // Send the audio file as a voice note (PTT)
        await conn.sendMessage(
            m.chat,
            {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true, // Send as voice note
            },
            { quoted: m }
        );

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('Error in play command:', error);
        await conn.sendMessage(m.chat, { text: `An error occurred: ${error.message}` }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}

export default {
  command: ['play', 'playaudio', 'mp3'],
  help: ['play <texto>', 'playaudio <texto>'],
  tags: ['media'],
  handler
};
