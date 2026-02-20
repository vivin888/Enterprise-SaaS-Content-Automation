# 🎬 AI Video Generator

<div align="center">
  <p><strong>Generate stunning AI-powered product videos in seconds — powered by Google Gemini AI, Cloudinary, and a modern full-stack architecture.</strong></p>

  ![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/ai-video-generator?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
  ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
</div>

---

## 🚀 Tech Stack

### 🖥️ Frontend

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.x-646cff?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-ff0055?style=for-the-badge&logo=framer&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7.x-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

### 🛠️ Backend

![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2d3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)

### ☁️ Services & Integrations

![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362D59?style=for-the-badge&logo=sentry&logoColor=white)

---

## ✨ Features

- 🤖 **AI-Powered Video Generation** — Describe your product and let Google Gemini generate high-quality video content
- 🖼️ **Image Upload & Management** — Upload product images via Cloudinary with secure media handling
- 🔐 **Authentication** — Full auth flow (sign-up, sign-in, webhooks) powered by Clerk
- 💳 **Credit System** — Users start with 20 credits; each video generation consumes credits
- 📐 **Aspect Ratio Control** — Support for multiple video formats (e.g., 9:16 portrait, 16:9 landscape)
- ⏱️ **Target Length** — Configure video duration per project
- 📤 **Publish Projects** — Share and publish your generated videos publicly
- 📡 **Error Monitoring** — Real-time error tracking with Sentry
- 🔄 **Smooth Animations** — Fluid UI transitions with Framer Motion & Lenis smooth scroll

---

## 📁 Project Structure

```
Root/
├── client/                        # React Frontend (Vite + TypeScript)
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── assets/                # Images, icons, SVGs
│   │   ├── components/            # Reusable UI components
│   │   ├── configs/               # Axios & API configurations
│   │   ├── pages/                 # Page-level route components
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── App.tsx                # Root component with routes
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── server/                        # Express Backend (TypeScript)
    ├── configs/                   # Sentry & server configuration
    ├── controllers/
    │   ├── clerk.ts               # Clerk webhook handler
    │   ├── projectController.ts   # Video project CRUD + AI generation
    │   └── userController.ts      # User management
    ├── middlewares/               # Auth & other middleware
    ├── prisma/
    │   ├── schema.prisma          # Database models (User, Project)
    │   └── migrations/            # Database migration history
    ├── routes/
    │   ├── projectRoutes.ts       # /api/project routes
    │   └── userRoutes.ts          # /api/user routes
    ├── types/                     # Shared TypeScript types
    ├── server.ts                  # Express app entry point
    └── package.json
```

---

## 🗄️ Database Schema

| Model       | Key Fields                                                                                  |
|-------------|--------------------------------------------------------------------------------------------|
| **User**    | `id`, `email`, `name`, `image`, `credits (default: 20)`, `createdAt`, `updatedAt`         |
| **Project** | `id`, `name`, `productName`, `productDescription`, `userPrompt`, `aspectRatio`, `targetLength`, `uploadedImages`, `generatedImage`, `generatedVideo`, `isGenerating`, `isPublished`, `error` |

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) database
- [Clerk](https://clerk.com/) account
- [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- [Cloudinary](https://cloudinary.com/) account
- [Sentry](https://sentry.io/) project (optional, for monitoring)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/vivin888/Enterprise-SaaS-Content-Automation.git
cd Enterprise-SaaS-Content-Automation
```

---

### 2️⃣ Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3️⃣ Configure Environment Variables

- Fill in your **Clerk**, **Gemini**, **Cloudinary**, **PostgreSQL**, and **Sentry** keys inside `.env` in both `/server` and `/client`

### 4️⃣ Run Migrations & Start

```bash
# In /server
npx prisma migrate dev
npm run server      # → http://localhost:5000

# In /client
npm run dev         # → http://localhost:5173
```

---

## 📜 Scripts

| Location | Command | Description |
|----------|---------|-------------|
| Client | `npm run dev` | Start frontend dev server |
| Client | `npm run build` | Build for production |
| Server | `npm run server` | Start backend with hot reload |
| Server | `npm run start` | Start backend (no hot reload) |

---
