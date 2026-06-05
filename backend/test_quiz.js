import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Note from './models/Note.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    await connectDB();
    const user = await User.findOne();
    if (!user) { console.log('no user'); process.exit(); }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const notes = await Note.find({ user: user._id });
    const noteIds = notes.map(n => n._id.toString());
    
    console.log('Sending POST /api/ai/quiz with noteIds:', noteIds);
    const response = await fetch('https://recall-ai-m71d-git-main-thyme4583-4862s-projects.vercel.app/api/ai/quiz', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ noteIds })
    });
    const data = await response.json();
    console.log('Quiz data response:', data);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
})();
