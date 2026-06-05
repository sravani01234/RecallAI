# 🧠 RecallAI

RecallAI is an AI-powered Personal Knowledge Assistant that transforms your documents into an intelligent, searchable knowledge base. Upload PDFs, notes, and study materials, chat with your content using AI, and generate smart quizzes to reinforce learning.

---

## 🚀 Overview

RecallAI helps users organize, retrieve, and interact with their knowledge using advanced AI capabilities. Instead of manually searching through documents, users can ask questions in natural language and receive context-aware answers based on their uploaded content.

---

## ✨ Features

### 📄 Document Upload & Processing
- Upload PDF and text documents
- Automatic text extraction and processing
- Intelligent document chunking for efficient retrieval

### 🤖 AI Knowledge Assistant
- Ask questions about uploaded documents
- Context-aware responses powered by Google Gemini
- Personalized knowledge retrieval

### 🖼️ Multimodal Support
- Upload images containing questions or notes
- AI analyzes image content
- Answers generated using both image and document context

### 📝 Smart Quiz Generation
- Generate quizzes from uploaded content
- Multiple-choice questions with balanced options
- Personalized learning assessments

### 📚 Knowledge Management
- Manage uploaded documents
- View document history
- Delete outdated documents and associated data

### 🔒 User Authentication
- Secure user registration and login
- JWT-based authentication
- Protected user data and document storage

---

## 🏗️ Architecture

```text
RecallAI
│
├── frontend      # React + Vite Application
├── backend       # Node.js + Express API
│
├── Authentication
├── Document Processing
├── AI Retrieval Engine
├── Quiz Generation
└── MongoDB Database
```

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- MongoDB Vector Search

### AI & Machine Learning
- Google Gemini AI
- Vector Embeddings
- Retrieval-Augmented Generation (RAG)

### Authentication
- JWT (JSON Web Tokens)
- bcrypt

### File Processing
- multer
- pdf-parse

---

## ⚙️ Prerequisites

Before running the project, ensure you have:

- Node.js (v18+ recommended)
- MongoDB Atlas account
- Google Gemini API Key
- Git installed

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sravani01234/RecallAI.git
cd RecallAI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend:

```bash
npm start
```

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

| Variable | Description |
|-----------|-------------|
| PORT | Backend Port |
| MONGO_URI | MongoDB Atlas Connection String |
| JWT_SECRET | Secret Key for Authentication |
| GEMINI_API_KEY | Google Gemini API Key |

---

## 📸 Core Functionalities

### Knowledge Upload
Upload PDFs and notes to build a personalized knowledge base.

### AI Chat
Ask questions and receive answers based on your uploaded content.

### Quiz Engine
Generate targeted quizzes to improve retention and understanding.

### Multimodal Learning
Use images and documents together for enhanced AI assistance.

---

## 🎯 Future Enhancements

- Voice-based AI assistant
- Flashcard generation
- Study planner integration
- Document summarization
- Knowledge graph visualization
- Mobile application
- Team collaboration features

---

## 🌟 Use Cases

- Students preparing for exams
- Researchers organizing papers
- Professionals managing documentation
- Lifelong learners building a second brain
- Personal knowledge management

---

## 🤝 Contributing

Contributions, feature suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Submit a pull request

---

## 📄 License

This project is available for educational and portfolio purposes.

---

## 👩‍💻 Author

**Sravani**

AI Engineer | Full Stack Developer | Machine Learning Enthusiast

GitHub: https://github.com/sravani01234

---

## ⭐ Support

If you found this project useful:

- Star the repository
- Share feedback
- Suggest new features

---

### "Your knowledge, instantly recalled."
### 🧠 RecallAI