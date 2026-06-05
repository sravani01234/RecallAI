import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mongoose from 'mongoose';
import Note from '../models/Note.js';
import DocumentChunk from '../models/DocumentChunk.js';
import ChatSession from '../models/ChatSession.js';
import { generateEmbedding, chunkText, generateCompletion } from '../services/aiService.js';

// Helper function to extract text from buffer
const extractText = async (file) => {
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } else {
    return file.buffer.toString('utf-8');
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const text = await extractText(file);
    if (!text || text.trim().length === 0) {
       console.error('Text extraction failed or returned empty text for file:', file.originalname);
       return res.status(400).json({ message: 'Could not extract text from file' });
    }
    const trimmedText = text.trim();

    // 1. Save Note Metadata
    const note = await Note.create({
      user: req.user._id,
      title: req.body.title || file.originalname,
      content: trimmedText, 
      metadata: {
        fileName: file.originalname,
        fileType: file.mimetype,
      }
    });

    // 2. Chunk Text
    const chunks = chunkText(trimmedText, 1000, 200);

    // 3. Generate Embeddings & Save Chunks
    const chunkDocs = [];
    for (const chunk of chunks) {
      if (chunk.trim()) {
        const embedding = await generateEmbedding(chunk);
        chunkDocs.push({
          user: req.user._id,
          note: note._id,
          text: chunk,
          embedding: embedding
        });
      }
    }

    if (chunkDocs.length > 0) {
      await DocumentChunk.insertMany(chunkDocs);
    }

    res.status(201).json({ message: 'Document processed and saved successfully', noteId: note._id });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error processing document' });
  }
};

export const chatWithNotes = async (req, res) => {
  try {
    const { query, history, noteId, image } = req.body;
    if (!query && !image) return res.status(400).json({ message: 'Query or image is required' });

    let searchQuery = query || '';

    // If an image is provided but no query, extract text from the image to use for vector search
    if (image && !searchQuery) {
        try {
            searchQuery = await generateCompletion("Extract all text, questions, and key concepts from this image. Output only the raw text to be used for a search query.", "", image);
        } catch (err) {
            console.error("Failed to extract text from image:", err);
            searchQuery = "image upload"; // Fallback to avoid empty embedding
        }
    }

    // Optional Note Filter
    const noteFilter = noteId ? { note: new mongoose.Types.ObjectId(noteId) } : {};

    // 1. Generate Embedding for the query
    const queryEmbedding = await generateEmbedding(searchQuery);

    // 2. Perform Vector Similarity Search using MongoDB Aggregation Pipeline
    // Note: This requires MongoDB Atlas Vector Search index configured on 'embedding' field
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 40,
        }
      },
      {
        $match: {
          user: req.user._id, // Ensure user only searches their own notes
          ...noteFilter       // Filter by specific note if provided
        }
      },
      {
        $project: {
          text: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    let similarChunks = [];
    try {
        similarChunks = await DocumentChunk.aggregate(pipeline);
    } catch (dbError) {
        // Fallback: If vector index isn't setup (e.g. running locally without Atlas),
        // try to find chunks related to keywords in the query or just recent chunks
        console.warn("Vector search failed, falling back to basic search:", dbError.message);
        const keywords = query.split(' ').filter(w => w.length > 3);
        if (keywords.length > 0) {
            similarChunks = await DocumentChunk.find({ 
                user: req.user._id,
                ...(noteId && { note: noteId }),
                text: { $regex: keywords.join('|'), $options: 'i' }
            }).limit(40);
        }
        if (similarChunks.length === 0) {
            similarChunks = await DocumentChunk.find({ 
                user: req.user._id, 
                ...(noteId && { note: noteId }) 
            }).sort({ createdAt: -1 }).limit(40);
        }
    }

    const contextTexts = similarChunks.map(chunk => chunk.text).join('\n\n---\n\n');

    // 3. Construct Prompt for Gemini
    const systemInstruction = `You are a highly capable Personal AI Assistant. Provide detailed, comprehensive, and well-structured answers to the user's questions based STRICTLY on the provided context from their uploaded notes. If the user provides an image containing questions, you MUST answer ALL questions found in the image using the context. Use your intelligence to synthesize and explain the context clearly and deeply, acting properly as Gemini, but never hallucinate facts outside the provided context. If the context does not contain the answer, say "I cannot find the answer to this in your uploaded notes."`;
    
    const historyText = history && history.length > 0 
      ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
      : '';
    
    const prompt = `Context:\n${contextTexts}\n\n${historyText ? `Chat History:\n${historyText}\n\n` : ''}User Question/Input: ${query || 'Please answer the questions in the image.'}\n\nAnswer:`;

    // 4. Generate Completion
    const answer = await generateCompletion(prompt, systemInstruction, image);

    res.json({ answer, contextUsed: similarChunks.length });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ message: 'Error generating response' });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const { noteIds } = req.body;

    let matchStage = { user: req.user._id };
    if (noteIds && noteIds.length > 0) {
      matchStage.note = { $in: noteIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Get a random sample of user's note chunks to generate quiz from
    const chunks = await DocumentChunk.aggregate([
      { $match: matchStage },
      { $sample: { size: 30 } }
    ]);
    
    if (!chunks || chunks.length === 0) {
      return res.status(404).json({ message: 'Not enough notes to generate a quiz.' });
    }

    const contextTexts = chunks.map(c => c.text).join('\n');
    
    const systemInstruction = "You are an educational AI. Create a 10-question multiple-choice quiz based on the provided context. Format your response strictly as a JSON array of exactly 10 objects. Each object must have: 'question' (string), 'options' (array of exactly 4 strings), and 'answer' (the exact string of the correct option from the options array). Return ONLY the JSON array. CRITICAL RULES: 1. Prevent length bias by keeping all 4 options roughly the exact same length. 2. Do not make the correct answer significantly longer or more detailed than the distractors. 3. Randomize the position of the correct answer so it is completely unpredictable.";
    const prompt = `Context:\n${contextTexts}\n\nGenerate quiz:`;

    const resultText = await generateCompletion(prompt, systemInstruction);
    
    // Attempt to parse JSON with robust regex
    let quizData = [];
    try {
      // Extract content between [ and ] to handle potential preamble/postamble
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : resultText;
      quizData = JSON.parse(jsonStr);
      
      // Basic validation of structure
      if (!Array.isArray(quizData) || quizData.length === 0) {
          throw new Error("Invalid quiz format returned from AI");
      }
    } catch (e) {
      console.error("Failed to parse quiz JSON. Raw output:", resultText);
      return res.status(500).json({ message: "Failed to generate structured quiz. Please try again." });
    }

    res.json(quizData);
  } catch (error) {
    res.status(500).json({ message: 'Error generating quiz' });
  }
};

export const suggestRevision = async (req, res) => {
  try {
     const notes = await Note.find({ user: req.user._id }).select('title metadata.uploadDate');
     if (!notes || notes.length === 0) {
       return res.json({ suggestions: "Upload some notes first so I can suggest revision topics!" });
     }

     const notesList = notes.map(n => `- ${n.title} (uploaded: ${n.metadata.uploadDate})`).join('\n');
     
     const prompt = `Here is a list of my uploaded notes:\n${notesList}\n\nBased on these titles and dates, suggest 3 topics I should review today to keep my memory fresh. Keep it brief and encouraging.`;
     const suggestions = await generateCompletion(prompt);

     res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Error generating suggestions' });
  }
};

// DELETE /api/ai/notes/:id - delete a note and its chunks
export const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findOne({ _id: noteId, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    await DocumentChunk.deleteMany({ note: noteId });
    await Note.deleteOne({ _id: noteId });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

// GET /api/ai/notes — list all uploaded notes for this user
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id })
      .select('title metadata createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notes);
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ message: 'Error fetching notes' });
  }
};

// POST /api/ai/chat/save — save a message to a chat session
export const saveChatMessage = async (req, res) => {
  try {
    const { sessionId, userMessage, botMessage, userImage } = req.body;
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    }
    if (!session) {
      session = await ChatSession.create({
        user: req.user._id,
        title: userMessage.slice(0, 60) || 'New Chat',
        history: []
      });
    }
    session.history.push({ role: 'user', content: userMessage, image: userImage });
    session.history.push({ role: 'model', content: botMessage });
    await session.save();
    res.json({ sessionId: session._id });
  } catch (error) {
    console.error('Save Chat Error:', error);
    res.status(500).json({ message: 'Error saving chat' });
  }
};

// GET /api/ai/chat/history — get all chat sessions for this user
export const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('title createdAt history')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(sessions);
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};
