import { connectDB } from './config/db.js';
await connectDB()
  .then(() => console.log('✅ Connection test succeeded'))
  .catch(err => console.error('❌ Connection test failed', err));
