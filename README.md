# Mini Jum JB (WhatsApp Bot)

A WhatsApp bot built with Node.js and Baileys.

## Features
- Plugin-based architecture.
- YouTube audio search and download.
- Configurable bot name and owner numbers.

## Prerequisites
- Node.js (v24.x recommended, as used during recent development updates; ensure compatibility with `@adiwajshing/baileys` dependencies)
- npm (comes with Node.js)

## Installation & Setup
1. **Clone the repository (or download the files):**
   ```bash
   git clone https://github.com/Ado926/NewB.git # Replace with your actual repository URL if different
   cd NewB # Replace with your actual project directory name
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure the bot:**
   - Edit `config.js` and add your WhatsApp number(s) to `ownerNumbers`. Example: `ownerNumbers: ["yournumber@s.whatsapp.net"]`.
   - You can also change `botName` in `config.js`.
4. **Run the bot:**
   ```bash
   npm start
   ```
   - On the first run, you will likely need to scan a QR code from your terminal to link the bot to your WhatsApp account. This creates an `auth_info_baileys` folder for session data.

## Available Commands

### Media
- **`.play <search query>`** (also works with `!play`, `/play`, `#play`)
  - Aliases: `playaudio`, `mp3`
  - Searches for the query on YouTube, sends information about the first result, and then sends the audio of that video as a voice note.
  - Example: `.play Shakira Acrostico`

(Add more commands here as they are created)

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Test your changes thoroughly.
5. Commit your changes (`git commit -am 'Add some feature'`).
6. Push to the branch (`git push origin feature/your-feature-name`).
7. Create a new Pull Request.

## License
This project is licensed under the MIT License. (You can create a `LICENSE` file with the MIT License text if you wish to formally include it).

---
*This bot is named "Mini Jum JB" as per user request.*
