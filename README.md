# TECHNOVA 2026 — AI & Innovation Live Quiz Platform

Interactive Real-Time Quiz & Stage Finale Presentation Engine

```text
+-----------------------------------------------------------------------+
|                                                                       |
|   TECHNOVA 2026 LIVE QUIZ & STAGE FINALE SYSTEM                       |
|   AI & Innovation Convention • Yenepoya School of Engineering         |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Overview & Essentials

**TECHNOVA 2026** is a high-concurrency real-time event web application designed for campus conventions and large-scale technical quizzes. Built with Next.js 15, TypeScript, Tailwind CSS, and Server-Sent Events (SSE), it supports 1,000+ simultaneous participants over local Wi-Fi without server bottlenecks.

> **Key Capabilities**:
> - **Zero-PIN Instant QR Join**: Participants scan the live screen QR code to jump straight into the waiting room without typing complex game PINs.
> - **Cyber-Violet Tech Aesthetic**: Modern blueprint vector decorations, smooth animations, and responsive layouts tailored for auditorium projectors and mobile screens.
> - **Two-Stage Tournament Structure**:
>   1. **Online Preliminary Qualifier**: Fast-paced speed exam with dynamic countdown timers, instant client scoring, and live rank calculation.
>   2. **Live Stage Finale**: Projector presentation system with interactive MCQ rounds, visual clue identification, and a 60-second rapid-fire arena.
> - **Cross-Device Remote Stage Control**: Quizmasters can operate slides, reveal answers, manage rapid-fire timers, and adjust scores remotely from [`/stage/control`](file:///src/app/stage/control).
> - **SQLite WAL High-Concurrency Architecture**: Low-latency answers ingestion with write-ahead logging (WAL), automated checkpoints, and 64 MB size caps to maintain server stability.
> - **Web Audio Synthesizer**: Zero-asset sound engine providing real-time countdown ticks, chimes, and victory fanfare.

---

## System Architecture & Data Flow

```text
+-------------------+       +--------------------+       +---------------------+
|  Participant App  | <---> | Next.js SSE Stream | <---> |  Quiz Game Engine   |
| (Mobile Browsers) |       |   (/api/stream)    |       |   (Memory Loop)     |
+-------------------+       +--------------------+       +---------------------+
          |                                                         |
          v                                                         v
+-------------------+                                    +---------------------+
| Local IndexedDB   |                                    | SQLite Database WAL |
| (Session State)   |                                    | (Quizzes & Logs)    |
+-------------------+                                    +---------------------+
```

> **Technology Stack**:
> - **Framework**: Next.js 15 App Router (React 19)
> - **Primary Language**: TypeScript
> - **Styling**: Tailwind CSS & Framer Motion
> - **Realtime Engine**: Server-Sent Events (SSE) & BroadcastChannel
> - **Server Database**: SQLite (Node.js `node:sqlite` / `better-sqlite3`) with WAL Mode enabled
> - **Client Storage**: IndexedDB (Local participant persistence)

---

## Directory Structure

```text
/
|-- src/
|   |-- app/
|   |   |-- [adminRoute]/       Secret host management panel & live controller
|   |   |-- api/                SSE stream, join, answer, and stage sync routes
|   |   |-- join/               Participant name & avatar join screen
|   |   |-- play/               Live question prompt & choice controller
|   |   |-- leaderboard/        Full screen projector rankings display
|   |   |-- results/            Participant end-of-quiz final stats
|   |   |-- stage/              Auditorium presentation view (Projector-ready)
|   |   |   `-- control/        Quizmaster remote control deck
|   |   `-- globals.css         Cyber-violet theme tokens & animations
|   |-- components/             Reusable UI components (Timer, Avatar, Stage PPT)
|   `-- lib/                    QuizEngine, EventHub, Auth, & DB logic
|-- public/                     Static media and branding assets
`-- data/                       Local SQLite database path (data/quiz.db)
```

---

## Quick Start Guide

### 1. Installation

```bash
git clone git@github.com:radheshpai87/teachers-day-quiz.git
cd teachers-day-quiz
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
ADMIN_ROUTE_SECRET=event-control-x7k92m
ADMIN_USERNAME=host
ADMIN_PASSWORD=technova2026
DATABASE_PATH=data/quiz.db
QUIZ_SEED_KEY=your_aes_256_gcm_hex_key
```

### 3. Development Mode

```bash
npm run dev
```

**Access URLs**:
- **Participant Join**: `http://localhost:3000/join`
- **Leaderboard**: `http://localhost:3000/leaderboard`
- **Stage Presentation**: `http://localhost:3000/stage`
- **Stage Host Controller**: `http://localhost:3000/stage/control`
- **Host Admin Console**: `http://localhost:3000/event-control-x7k92m/login`

### 4. Production Build & Execution

```bash
npm run build
npm start
```

Or using Docker:

```bash
docker compose up -d --build
```

---

## License

This project is open-source under the MIT License.
