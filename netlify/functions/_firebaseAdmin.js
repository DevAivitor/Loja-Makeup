// netlify/functions/_firebaseAdmin.js
// Arquivo auxiliar — NÃO é uma rota, é usado internamente pelas outras functions.

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// ============================================
// Este projeto usa um Firestore com ID de banco de dados customizado
// (não é o banco "(default)"), por isso precisamos especificar qual usar.
// Esse valor veio do arquivo firebase-applet-config.json do projeto.
// ============================================
const FIRESTORE_DATABASE_ID = 'ai-studio-8a527d65-fcd2-4834-8f27-aba88318ffb8';

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

const db = getFirestore(admin.app(), FIRESTORE_DATABASE_ID);

module.exports = { admin, db };
