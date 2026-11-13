require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/models/Task');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jotai-db');
  // Delete all tasks with no dueDate created by the assistant (test cleanup)
  const result = await Task.deleteMany({ dueDate: null, title: 'review the design docs' });
  console.log('Deleted:', result.deletedCount, 'duplicate tasks');
  
  // Also delete any other null-dueDate assistant test tasks
  const result2 = await Task.deleteMany({ dueDate: null, title: { $in: ['Yoga 20 minutes', 'yoga 20 minutes', 'Registry Test Task', 'Test Task Idempotency'] } });
  console.log('Deleted:', result2.deletedCount, 'other test tasks');
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });


