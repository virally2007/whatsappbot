const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Add error handling for missing dependencies
try {
    console.log('Loading dependencies...');
} catch (error) {
    console.error('Error loading dependencies:', error);
    process.exit(1);
}

// Configuration
const GEMINI_API_KEY = 'AIzaSyA1i4QCcIi9WUpSSio83Q4FNWrtp8oP-z8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Store for tracking users you've messaged
const allowedUsers = new Set();

// Pre-add specific users (add phone numbers without country code)
const preAllowedUsers = [
    '724070509', // Add the user number without +94
    // Add more numbers here if needed
];

// Add pre-allowed users to the set
preAllowedUsers.forEach(number => {
    allowedUsers.add(number);
    console.log(`Pre-added user to allowed list: ${number}`);
});

// Initialize WhatsApp client with better error handling
console.log('Initializing WhatsApp client...');
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

console.log('WhatsApp client created successfully!');

// Generate QR code for WhatsApp Web
client.on('qr', (qr) => {
    console.log('\n=== WHATSAPP QR CODE ===');
    console.log('Scan this QR code with your WhatsApp:');
    console.log('Go to WhatsApp > Settings > Linked Devices > Link a Device');
    console.log('========================\n');
    
    try {
        qrcode.generate(qr, { small: true });
    } catch (error) {
        console.error('Error generating QR code:', error);
        console.log('Raw QR data:', qr);
    }
});

// Add loading event
client.on('loading_screen', (percent, message) => {
    console.log('Loading...', percent, message);
});

// Client ready
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
    console.log('Bot name: Venula Personal Assistant AI');
});

// Handle authentication
client.on('authenticated', () => {
    console.log('WhatsApp bot authenticated successfully!');
});

// Handle authentication failure
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

// Function to call Gemini AI
async function getAIResponse(userMessage, userNumber) {
    try {
        const prompt = `You are Venula Personal Assistant AI. Please respond naturally and helpfully to the user's message. 
        Respond in both Sinhala and English when appropriate, or just in the language the user prefers.
        
        User message: ${userMessage}`;

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            return "Sorry, I couldn't process your message right now. Please try again.";
        }
    } catch (error) {
        console.error('Error calling Gemini AI:', error.response?.data || error.message);
        return "I'm having trouble connecting to my AI brain right now. Please try again in a moment.";
    }
}

// Function to check if user is allowed (you've messaged them before)
function isUserAllowed(userNumber) {
    return allowedUsers.has(userNumber);
}

// Function to add user to allowed list
function addAllowedUser(userNumber) {
    allowedUsers.add(userNumber);
    console.log(`Added user to allowed list: ${userNumber}`);
}

// Handle incoming messages
client.on('message_create', async (message) => {
    // Skip if message is from status broadcast
    if (message.from === 'status@broadcast') return;
    
    // Check if message is from you (outgoing)
    if (message.fromMe) {
        // Add recipient to allowed users when you send them a message
        const recipientNumber = message.to.replace('@c.us', '');
        addAllowedUser(recipientNumber);
        return;
    }

    // Only respond to direct messages (not groups)
    if (message.from.includes('@g.us')) {
        console.log('Ignoring group message');
        return;
    }

    // Get sender's number
    const senderNumber = message.from.replace('@c.us', '');
    
    // Check if user is allowed
    if (!isUserAllowed(senderNumber)) {
        console.log(`Ignoring message from non-allowed user: ${senderNumber}`);
        console.log(`To allow this user, send them a message first or add them to preAllowedUsers array`);
        return;
    }

    // Skip if message is empty or only media without text
    if (!message.body || message.body.trim() === '') return;

    console.log(`Received message from ${senderNumber}: ${message.body}`);

    try {
        // Show typing indicator
        await message.getChat().then(chat => chat.sendStateTyping());

        // Get AI response
        const aiResponse = await getAIResponse(message.body, senderNumber);

        // Send response
        await client.sendMessage(message.from, aiResponse);
        
        console.log(`Sent AI response to ${senderNumber}`);
        
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Send error message
        try {
            await client.sendMessage(message.from, 
                "Sorry, I encountered an error. Please try again later.");
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('WhatsApp bot disconnected:', reason);
});

// Initialize the client with error handling
console.log('Starting WhatsApp bot initialization...');

client.initialize().catch(error => {
    console.error('Failed to initialize WhatsApp client:', error);
    process.exit(1);
});

// Add timeout for initialization
setTimeout(() => {
    console.log('If QR code is not showing, try:');
    console.log('1. Delete the wwebjs_auth folder');
    console.log('2. Restart the bot');
    console.log('3. Make sure all dependencies are installed');
}, 10000);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down bot...');
    await client.destroy();
    process.exit(0);
});

// Export for use in other modules
module.exports = {
    client,
    addAllowedUser,
    isUserAllowed
};