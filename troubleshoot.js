
console.log('=== WhatsApp Bot Troubleshooting ===\n');

// Check Node.js version
console.log('1. Node.js version:', process.version);
if (parseInt(process.version.slice(1)) < 14) {
    console.log('❌ Node.js version is too old. Please upgrade to v14 or higher.');
} else {
    console.log('✅ Node.js version is compatible.');
}

// Check dependencies
console.log('\n2. Checking dependencies...');

try {
    require('whatsapp-web.js');
    console.log('✅ whatsapp-web.js is installed');
} catch (error) {
    console.log('❌ whatsapp-web.js is missing. Run: npm install whatsapp-web.js');
}

try {
    require('qrcode-terminal');
    console.log('✅ qrcode-terminal is installed');
} catch (error) {
    console.log('❌ qrcode-terminal is missing. Run: npm install qrcode-terminal');
}

try {
    require('axios');
    console.log('✅ axios is installed');
} catch (error) {
    console.log('❌ axios is missing. Run: npm install axios');
}

// Check file system permissions
const fs = require('fs');
const path = require('path');

console.log('\n3. Checking file system...');
try {
    const testDir = './test_write';
    fs.mkdirSync(testDir, { recursive: true });
    fs.rmSync(testDir, { recursive: true });
    console.log('✅ File system write permissions OK');
} catch (error) {
    console.log('❌ File system permission issue:', error.message);
}

// Check if auth folder exists
console.log('\n4. Checking auth folder...');
if (fs.existsSync('./wwebjs_auth') || fs.existsSync('./.wwebjs_auth')) {
    console.log('ℹ️  Auth folder exists - delete it if having issues');
    console.log('   Run: rm -rf wwebjs_auth .wwebjs_auth');
} else {
    console.log('✅ No existing auth folder (fresh start)');
}

// Test QR code generation
console.log('\n5. Testing QR code generation...');
try {
    const qrcode = require('qrcode-terminal');
    console.log('Testing QR display:');
    qrcode.generate('TEST123', { small: true });
    console.log('✅ QR code generation works');
} catch (error) {
    console.log('❌ QR code generation failed:', error.message);
}

console.log('\n=== Troubleshooting Complete ===');
console.log('\nIf issues persist, try:');
console.log('1. npm install --force');
console.log('2. Delete node_modules and run npm install again');
console.log('3. Try a different terminal/command prompt');
console.log('4. Check if you have Chrome/Chromium installed');