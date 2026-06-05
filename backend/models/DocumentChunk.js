import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Note',
  },
  text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // Array of numbers representing the vector embedding
    required: true,
  }
}, { timestamps: true });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
export default DocumentChunk;
