// netlify/functions/lib/firebaseAdmin.js
// Arquivo auxiliar — NÃO é uma rota, é usado internamente pelas outras functions.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // O Netlify guarda a chave com \n literais — precisamos converter de volta para quebras de linha reais
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
