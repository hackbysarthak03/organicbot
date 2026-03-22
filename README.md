# Organic Bot - Svayambhu Organics AI Assistant

A modern, responsive, and highly interactive AI chatbot tailored specifically for **Svayambhu Organics**. Built with React, Tailwind CSS, and the Google Gemini API, this chatbot provides customers with intelligent, context-aware information about organic products, specifically focusing on Moringa and Curcumin supplements.

## 🌟 Key Features

### 1. Dedicated Corporate AI
- **Context-Restricted**: Powered by the powerful Google Gemini 2.5 Flash model but strictly scoped to only answer queries related to Svayambhu Organics, maintaining brand voice and accuracy.
- **Product Knowledge**: Built-in system prompt containing detailed specs, pricing, sizes, and health benefits for Moringa Powder, Moringa Capsules, Curcumin Powder, and Moringa Tablets.
- **Smart Recommendations**: Suggests specific products based on user health queries (e.g., suggesting Curcumin for joint pain).

### 2. Premium User Interface
- **Organic Aesthetic**: A beautiful "glassmorphic" interface featuring an organic green gradient, smooth GSAP animations, and floating product imagery.
- **Typographic Consistency**: Uses Google's modern `Outfit` font for a highly legible and elegant appearance across all responsive devices.
- **Smart Scrolling**: Instant and precise bottom-scrolling physics that flawlessly align the newest sent or received message right above the chat bar.

### 3. Voice & Accessibility
- **Voice Typing**: Fully integrated with the Web Speech API, allowing users to tap the microphone icon to dictate messages smoothly.
- **Auto-Formatting**: The bot structures out responses cleanly via Markdown-styled spacing and semantic text.

### 4. Authentication & Data Persistence
- **Firebase Auth**: Secure Google Sign-In support.
- **Chat History**: Firebase Firestore integration saves all user chat sessions. The interactive sidebar lets users seamlessly jump back into previous "Recent Chats", start a "New Chat", or delete older sessions.

---

## 🛠️ Technology Stack
- **Frontend Framework**: React (via Vite)
- **Styling**: Tailwind CSS, `clsx`, `tailwind-merge`
- **Animations**: Framer Motion & GSAP
- **Icons**: Lucide React
- **AI Brain**: Google Generative AI (`@google/generative-ai`)
- **Backend / DB**: Firebase (Authentication & Cloud Firestore)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd ChatBot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your API credentials. You will need a Gemini API Key and your Firebase configuration keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start, usually on `http://localhost:5173`.

---

## 🏗️ Structure Overview
- `src/components/ChatBot.jsx`: The core conversational interface driving user input, interactions, and AI logic fetching.
- `src/hooks/useChats.js`: Custom hook controlling the saving, persisting, and querying of active AI sessions mapped to specific Firebase user IDs.
- `src/botPrompt.js`: The central "Brain" detailing precisely what the bot knows, how it acts, and its explicit operational boundaries.
- `src/firebase.js`: Firebase application and Firestore instance initialization.

## 📝 License
This project is proprietary and built exclusively for Svayambhu Organics.
