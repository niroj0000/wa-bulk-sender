const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');

const messageTemplate = fs.readFileSync('message.txt', 'utf8');

function fillMessage(template, contact) {
    let msg = template;
    for (const key in contact) {
        msg = msg.replace(new RegExp(`{${key}}`, 'g'), contact[key]);
    }
    return msg;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readContacts() {
    return new Promise((resolve) => {
        const contacts = [];
        fs.createReadStream('contacts.csv')
            .pipe(csv())
            .on('data', (row) => contacts.push(row))
            .on('end', () => resolve(contacts));
    });
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Users\\Niroj\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with your WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('\n✅ WhatsApp Connected!\n');
    const contacts = await readContacts();
    console.log(`📋 Found ${contacts.length} contacts\n`);
    let sent = 0;
    let failed = 0;
    for (const contact of contacts) {
        try {
            const phone = '977' + contact.phone.trim();
            const message = fillMessage(messageTemplate, contact);
            const chatId = phone + '@c.us';
            await client.sendMessage(chatId, message);
            console.log(`✅ Sent to ${contact.name} (${contact.phone})`);
            sent++;
            await wait(10000);
        } catch (err) {
            console.log(`❌ Failed: ${contact.phone} — ${err.message}`);
            failed++;
        }
    }
    console.log(`\n📊 Done! Sent: ${sent} | Failed: ${failed}`);
    process.exit();
});

client.on('auth_failure', () => {
    console.log('❌ Auth failed. Delete .wwebjs_auth folder and try again.');
});

client.initialize();