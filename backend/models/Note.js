import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  metadata: {
    fileName: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);
export default Note;
