const crypto = require('crypto');

// Code verifier
const code_verifier = crypto.randomBytes(32).toString('base64url');

// Code challenge (SHA256)
const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');

console.log('Verifier:', code_verifier);
console.log('Challenge:', code_challenge);
