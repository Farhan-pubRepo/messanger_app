# Real-Time Chat Application 💬

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-61DAFB?style=flat&logo=mongodb&logoColor=white)](https://mern.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-RealTime-010101?logo=socket.io)](https://socket.io)
[![JWT Auth](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens)](https://jwt.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

A full-stack real-time chat application with modern authentication and instant messaging capabilities.

This repository contains both the React frontend (`frontend/`) and the Express + Socket.io backend (`backend/`).

### Demo account

The deployed app has a seeded account so you can look around without signing up.
The login screen has a **Try the demo** button, or sign in manually:

```
username: demo
password: demo1234
```

## ✨ Features
- 🔒 JWT Authentication & Authorization
- ⚡ Real-time messaging with Socket.io
- 🟢 Online user status tracking
- 📱 Responsive UI with TailwindCSS + DaisyUI
- 🔄 React Context API for state management
- 🛡 Protected routes & error handling

## 🛠 Tech Stack
**Frontend**  
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=flat)

**Backend**  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb)

**Real-Time**  
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io)

## 🚀 Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Git

```bash
# Clone repository
git clone https://github.com/Farhan-pubRepo/messenger-app.git
cd chat-app

# Install dependencies
cd client && npm install
cd ../server && npm install

## Deployment

The backend serves the built frontend, so this ships as a single service rather
than a split frontend/backend deploy. `npm run build` installs both halves and
builds the client into `frontend/dist`; `npm start` runs the server, which
serves that directory and falls through to `index.html` for client-side routes.

`render.yaml` is a Render blueprint for exactly that. Point Render at this repo
via **New > Blueprint** and supply the values marked `sync:false`
(`MONGO_DB_URI`, and `ANTHROPIC_API_KEY` only if you want Aria live).

Required environment variables are documented in `.env.example`.

After the first deploy, seed the demo account against the production database:

```bash
node backend/seeds/createDemoUser.js
```

Note that Render's free tier sleeps after inactivity, so the first request after
an idle period takes roughly a minute to wake.
