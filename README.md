
📚 Buddy Study

Site Link - https://buddy-study-portal.netlify.app/

> **Manage all your study groups in one place.**

Buddy Study is a modern **virtual, real-time study space** built to help students collaborate remotely in a structured and distraction-free environment.

Instead of using generic messaging apps, Buddy Study provides dedicated study rooms where users can join, communicate, and focus together.

---

## 🚀 Features

* 🔐 Google Authentication (Firebase)
* 🛡 Protected Routes
* 🏫 Room-Based Study System
* 💬 Real-Time Chat
* 🌙 Clean Dark UI (Navy Theme)
* ⚡ Fast Single Page Application (SPA)

---

## 🛠 Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* React Router

**Backend / Services**

* Firebase Authentication
* Firebase Realtime Database / Firestore

---

## 🏗 Project Structure

```
src/
│
├── components/
│   ├── Chat.jsx
│   ├── Room.jsx
│   └── ProtectedRoute.jsx
│
├── hooks/
│   └── useAuth.js
│
├── pages/
│   ├── Login.jsx
│   └── Dashboard.jsx
│
├── App.jsx
└── main.jsx
```

---

## 🔐 Authentication Flow

* Users sign in using **Google Sign-In**
* `useAuth.js` listens to Firebase authentication state
* `ProtectedRoute.jsx` restricts access to authenticated users only
* Unauthorized users are redirected to the Login page

---

## 🏫 Study Rooms

The core of Buddy Study is the **Room** system:

* Users can join study rooms
* Each room supports real-time communication
* Designed to create a focused study environment

### Planned Enhancements

* Pomodoro Timer
* Invite-by-Link
* Video Integration
* Shared Whiteboard
* Notifications

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/buddy-study.git
cd buddy-study
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 📌 Project Status

### ✅ Completed

* Project Setup
* Google Authentication
* Protected Routes
* Login Page UI
* Dashboard Layout

### 🔄 In Progress

* Real-time Chat integration
* Dynamic Room Data
* Collaboration features

---

## 🤝 Contributing

Pull requests are welcome.
For major changes, please open an issue first to discuss what you would like to change.

