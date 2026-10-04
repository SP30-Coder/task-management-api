# Task Management REST API

## Prerequisites
- Node.js 18+
- MongoDB running locally

## Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/` (or copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskmanagement
JWT_SECRET=Sid123
JWT_EXPIRE=7d
```

## Run
```bash
cd server
npm start
```

For development with auto-restart:
```bash
cd server
npm run dev
```

Server will run on `http://localhost:5000`.
Make sure MongoDB is running before starting the server.
