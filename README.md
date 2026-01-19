# 🧠 MindEase – AI-Powered Mental Wellness Companion 🌿

MindEase is a **full-stack AI-powered mental wellness web application** designed especially for students to **track emotions, analyze mental health patterns, and receive real, data-driven AI insights** in a secure and calming digital environment.

Unlike basic wellness apps, MindEase uses **Machine Learning, NLP, and the Google Gemini API** to understand user mood trends and journal sentiment, enabling **personalized mental health guidance, intelligent chatbot support, and AI-based diary recommendations**.

> 🌈 *MindEase is not just a wellness tracker — it’s an intelligent digital companion for self-reflection and mental clarity.*

---

## ✨ Features

### 🔐 Secure User Authentication

* Email-based signup and login
* Email verification before account activation
* Secure email handling using **Nodemailer + Google App Passwords**
* Sensitive credentials managed using **`.env`**

---

### 📊 AI-Driven Wellness Dashboard

* Daily mood tracking
* Visual mood history & trend analysis
* ML algorithms analyze emotional data to:

  * Detect stress patterns
  * Identify emotional fluctuations
  * Generate personalized wellness insights

---

### 📖 Personal AI Journal Diary (NLP + Gemini AI)

* Daily **personal diary-style journal entries**
* Uses **NLP + Gemini API** to:

  * Perform sentiment analysis
  * Detect emotional tone and stress indicators
  * Generate **AI-based reflective feedback & self-improvement suggestions**
* Helps users understand emotions and receive **empathetic AI recommendations**
* Journal insights adapt over time based on user patterns

---

### 🤖 AI Wellness Chatbot (Gemini API Powered)

* Conversational assistant powered by **Google Gemini API**
* Provides:

  * Emotional support and motivation
  * Guided breathing and relaxation exercises
  * Productivity, focus, and stress-management tips
* Chatbot responses are **context-aware**, adapting based on:

  * User mood history
  * Journal sentiment and diary insights

---

### 🎵 Personalized Meditation Player

* Upload and play custom relaxing music
* Create a calming and mindful environment
* Supports focus, stress relief, and relaxation

---

### 📚 Smart Wellness Recommendations

* AI-generated wellness tips based on:

  * Current mood
  * Mood trends over time
  * Personal diary analysis
* Delivers **context-aware and personalized mental health guidance**

---

## 🛠️ Tech Stack

| Category       | Technology                       |
| -------------- | -------------------------------- |
| Frontend       | HTML, CSS, JavaScript            |
| Backend        | Node.js, Express                 |
| AI / ML        | Machine Learning, NLP            |
| AI API         | **Google Gemini API**            |
| Database       | SQLite                           |
| Email Services | Nodemailer, Google App Passwords |
| Configuration  | `.env`                           |

---

## 🚀 How It Works

1. User signs up using email
2. Account is verified via email link
3. User logs into the dashboard
4. Mood and personal diary entries are recorded
5. ML + NLP models analyze emotional patterns
6. Gemini-powered chatbot provides intelligent responses
7. AI generates diary-based recommendations and insights
8. Mood analytics and AI feedback are displayed

---

## 📈 AI & ML Highlights

* NLP-based sentiment analysis on journal entries
* Mood trend detection over time
* Gemini API–powered conversational intelligence
* Personalized diary insights and recommendations
* Context-aware mental wellness guidance

---

## 🧩 Project Structure

```
project/
│
├── backend/                # Server-side logic (Node.js, Express, AI & Gemini APIs)
├── config/                 # Configuration files (email, Gemini API, environment)
├── database/
│   ├── data/               # Stored mood & journal data
│   └── database.js         # SQLite database logic
├── frontend/
│   ├── assets/             # Images, icons, styles, media files
│   └── pages/              # Login, Dashboard, Journal, Chatbot pages
├── node_modules/           # Installed dependencies
├── .gitignore              # Git ignored files
└── README.md               # Project documentation
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/mindease.git
cd mindease
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
GEMINI_API_KEY=your_gemini_api_key
```

### 4️⃣ Start the Server

```bash
npm start
```

### 5️⃣ Open in Browser

```
http://localhost:3000
```

---

## 📌 Future Enhancements

* 🌍 Multi-language AI chatbot
* 📱 Fully responsive mobile UI
* 🧠 Advanced ML-based stress prediction
* 📊 Detailed emotional analytics & mental health reports

---

## 🤝 Contributing

Contributions are welcome!
Fork the repository and submit a pull request for improvements or features.

---

## 📜 License

This project is intended for **educational and learning purposes**.

---

## 💙 Author

**Muskan**
Computer Science Student
AI & Full-Stack Development Enthusiast

---

⭐ *If you find this project helpful, don’t forget to star the repository!* ⭐

### 🎥 Sample Video Demo

🔗 [https://drive.google.com/file/d/1fP0K5IrSDnTOz1y6FOR95cevPM8-qom4/view](https://drive.google.com/file/d/1fP0K5IrSDnTOz1y6FOR95cevPM8-qom4/view)
