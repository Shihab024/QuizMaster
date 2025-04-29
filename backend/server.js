import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import userRoutes from './routes/userRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import dotenv from 'dotenv'
import connectDB from './config/db.js';

// Load environment variables
dotenv.config()
const app = express();
connectDB();
// Create Express App

// Database Connection Function

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'http://localhost:3000' : '*',
  credentials: true
}));
app.use(express.json())

// Routes
app.use("/api/users", userRoutes)
app.use("/api/quizzes", quizRoutes)

// Basic route
app.get("/", (req, res) => {
  res.send("API is running...")
})

// Only start the server in development mode
// In production (Vercel), we just export the app
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Handle unhandled promise rejections without closing server in production
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error)
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Export the Express app for Vercel
export default app
