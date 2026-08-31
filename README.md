# Teachers' Day Live Quiz Web Application

Classroom Notebook Edition & Real-Time Event Platform

```text
+-----------------------------------------------------------------------+
|                                                                       |
|   TEACHERS' DAY LIVE QUIZ WEB APPLICATION                             |
|   Classroom Notebook Edition & Event System                           |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Overview & Essentials

The Teachers' Day Live Quiz is a high-concurrency real-time event web application designed for college celebrations. Built with Next.js, TypeScript, and Server-Sent Events (SSE), it supports 1,000+ simultaneous campus participants over local Wi-Fi without server bottlenecks.

> **Sticky Note: Yellow**
> 
> **Core Features**:
> - **Zero-PIN Instant Join**: Participants scan the live QR code to open the join page directly without typing 6-digit game PINs.
> - **Pen & Notebook Aesthetic**: Tactile off-white ruled paper design, dark ink borders, paper drop-shadows, and yellow/mint/lavender cards.
> - **Automatic Game Engine**: Host starts the quiz once; questions, timers, reveals, fun facts, and leaderboards progress automatically.
> - **Custom Question Timers**: Set individualized time limits per question (5s, 10s, 15s, 20s, 30s, etc.) with automatic scoring curve scaling.
> - **Live Floating Reactions**: Real-time interactive emoji bursts (❤️, 👏, 🔥, 🎓, 🌟) broadcast across participant and projector displays.
> - **Web Audio SFX Engine**: Zero-asset synthesizer providing instant tap feedback, countdown ticks, correct/wrong chimes, and results fanfare with volume toggle.
> - **Host Console Hotkeys & Kick Moderation**: Keyboard shortcuts (<kbd>Space</kbd>, <kbd>S</kbd>, <kbd>Q</kbd>) for stage operators and instant one-click removal of disruptive participants.
> - **Projector-Ready Leaderboard**: Real-time Top 10 rankings display with podium visualization and rank shift movement badges.

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

> **Sticky Note: Mint**
> 
> **Technology Stack**:
> - **Framework**: Next.js 15 App Router (React 19)
> - **Primary Language**: TypeScript
> - **Styling**: Vanilla CSS & Tailwind CSS (Pen & Notebook Tokens)
> - **Realtime Engine**: Server-Sent Events (SSE)
> - **Server Database**: SQLite (better-sqlite3) with WAL Mode enabled
> - **Client Storage**: IndexedDB (Local participant persistence)

---

## Directory Structure

```text
/
|-- src/
|   |-- app/
|   |   |-- [adminRoute]/       Secret URL area for host management panel
|   |   |-- api/                SSE stream, join, answer, and admin routes
|   |   |-- join/               Participant name & avatar join screen
|   |   |-- play/               Live question prompt & choice controller
|   |   |-- leaderboard/        Full screen projector rankings display
|   |   |-- results/            Participant end-of-quiz final stats
|   |   `-- globals.css         Notebook paper background & card rules
|   |-- components/             Tactile UI components (Timer, Avatar, etc)
|   `-- lib/                    QuizEngine, EventHub, Auth, & DB logic
|-- public/                     Static vector assets
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
ADMIN_PASSWORD=teachersday2026
DATABASE_PATH=data/quiz.db
```

### 3. Development Mode

```bash
npm run dev
```

**Access URLs**:
- **Participant Join**: `http://localhost:3000/join`
- **Leaderboard**: `http://localhost:3000/leaderboard`
- **Host Console**: `http://localhost:3000/event-control-x7k92m/login`

### 4. Production Build & Execution

```bash
npm run build
npm start
```

---

## Environment Variables Reference

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `ADMIN_ROUTE_SECRET` | Yes | `event-control-x7k92m` | Secret URL segment for host panel |
| `ADMIN_USERNAME` | Yes | `host` | Host login username |
| `ADMIN_PASSWORD` | Yes | `teachersday2026` | Host login password |
| `DATABASE_PATH` | No | `data/quiz.db` | Path to local SQLite file |

---

## Vercel Serverless Deployment

1. Import the repository into your Vercel Dashboard.
2. Configure Environment Variables (`ADMIN_ROUTE_SECRET`, `ADMIN_USERNAME`, etc.).
3. Deploy. The database automatically resolves to `/tmp/quiz.db` on Vercel.

> **Sticky Note: Lavender**
> 
> **License**:
> This project is open-source under the MIT License.
