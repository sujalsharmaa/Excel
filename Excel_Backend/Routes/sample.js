import crypto from "crypto"


const token = crypto.randomBytes(8).toString('base64');

console.log(token)