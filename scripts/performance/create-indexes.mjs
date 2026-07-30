#!/usr/bin/env node
import mongoose from 'mongoose';

const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/';

const plans = [
  {
    collection: 'answers',
    indexes: [
      {
        key: { CENTRO_ID: 1, updatedAt: -1 },
        options: { name: 'idx_answers_centro_updatedAt' },
      },
      {
        key: { QUESTION_ID: 1, CENTRO_ID: 1, QUIZ_ID: 1 },
        options: { name: 'idx_answers_question_centro_quiz' },
      },
      {
        key: { updatedAt: -1 },
        options: { name: 'idx_answers_updatedAt' },
      },
    ],
  },
  {
    collection: 'summaries',
    indexes: [
      {
        key: { CENTRO_ID: 1, updatedAt: -1 },
        options: { name: 'idx_summaries_centro_updatedAt' },
      },
      {
        key: { CENTRO_ID: 1, createdAt: 1, updatedAt: -1 },
        options: { name: 'idx_summaries_centro_createdAt_updatedAt' },
      },
      {
        key: { createdAt: 1, updatedAt: -1 },
        options: { name: 'idx_summaries_createdAt_updatedAt' },
      },
      {
        key: { FORM_ID: 1, createdAt: 1 },
        options: { name: 'idx_summaries_form_createdAt' },
      },
    ],
  },
  {
    collection: 'centros',
    indexes: [
      {
        key: { REGIONAL: 1, NOME_CENTRO: 1 },
        options: { name: 'idx_centros_regional_nomeCentro' },
      },
      {
        key: { REGIONAL: 1 },
        options: { name: 'idx_centros_regional' },
      },
    ],
  },
];

async function run() {
  console.log(`Connecting to MongoDB: ${uri.replace(/:[^:@/]+@/, ':***@')}`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection not initialized');
  }

  for (const plan of plans) {
    const col = db.collection(plan.collection);
    console.log(`\nCollection: ${plan.collection}`);

    for (const idx of plan.indexes) {
      const name = await col.createIndex(idx.key, idx.options);
      console.log(`  created/exists: ${name}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(async (err) => {
  console.error('Index creation failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
