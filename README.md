# 🧠 MindEase – AI-Powered Mental Wellness Companion 🌿

MindEase is a **full-stack AI-powered mental wellness web application** designed especially for students to **track emotions, analyze mental health patterns, and receive real, data-driven AI insights** in a secure and calming digital environment.

Unlike basic wellness apps, MindEase uses **Machine Learning and NLP** to understand user mood trends and journal sentiment, enabling **personalized mental health guidance and intelligent chatbot support**.

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

### 📖 Intelligent Journaling System (NLP-Based)

* Daily journal entry logging
* **Natural Language Processing (NLP)** used to:

  * Perform sentiment analysis
  * Detect stress-related keywords
  * Generate reflective AI insights
* Export journal and mood logs in **Excel (.xlsx)** format

---

### 🤖 AI Wellness Chatbot

* Machine Learning powered conversational assistant
* Provides:

  * Emotional support & motivation
  * Breathing and relaxation exercises
  * Productivity and focus tips
* Chatbot responses adapt based on:

  * User mood history
  * Journal sentiment analysis

---

### 🎵 Personalized Meditation Player

* Upload and play custom relaxing music
* Helps users create a calming environment
* Supports mindfulness, focus, and stress relief

---

### 📚 Smart Wellness Recommendations

* AI-generated wellness tips based on:

  * Current mood
  * Mood trends
  * Journal sentiment
* Context-aware mental health suggestions



---

## 🛠️ Tech Stack

| Category       | Technology                       |
| -------------- | -------------------------------- |
| Frontend       | HTML, CSS, JavaScript            |
| Backend        | Node.js, Express                 |
| AI / ML        | Machine Learning, NLP            |
| Email Services | Nodemailer, Google App Passwords |
| Data Storage   | Excel (.xlsx)                    |
| Configuration  | `.env`                           |

---

## 🚀 How It Works

1. User signs up using email
2. Verification link is sent to the email
3. User logs in after verification
4. Mood and journal entries are recorded
5. ML models analyze emotional patterns
6. AI chatbot provides personalized support
7. Mood analytics and insights are displayed
8. Data can be exported for self-analysis

---

## 📈 AI & ML Highlights

* Sentiment analysis on journal entries
* Mood pattern detection over time
* Personalized insight generation
* Context-aware chatbot responses
* Data-driven wellness recommendations

---

## 🧩 Project Structure

```
project/
│
├── backend/                # Server-side logic (Node.js, Express, ML APIs)
│
├── config/                 # Configuration files (email, ML, environment setup)
│
├── database/
│   ├── data/               # Stored mood & journal data (Excel / logs)
│   └── database.js         # Database connection & data handling logic
│
├── frontend/
│   ├── assets/             # Images, icons, styles, media files
│   └── pages/              # HTML pages (Login, Dashboard, Journal, etc.)
│
├── node_modules/           # Installed dependencies
│
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
* 📊 Detailed emotional analytics & reports

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



Sample Video Link:
