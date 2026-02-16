require('dotenv').config(); // This MUST be at the very top of the file
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import your route files
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

console.log("🔍 Checking Secret:", process.env.JWT_SECRET ? "✅ Found" : "❌ Not Found");

// --- 1. MIDDLEWARE ---
app.use(cors({
    origin: [
        "https://q-by-q.vercel.app", 
        "http://localhost:3000", 
        "http://localhost:5000",
        "http://127.0.0.1:5500", 
        "http://localhost:5500"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// --- 2. DATABASE CONNECTION ---
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
};

// Ensure DB connects before handling requests
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// --- 3. HEALTH CHECK ROUTE ---
app.get("/", (req, res) => {
    res.send("Server is running perfectly on Vercel!");
});

// --- 4. API ROUTES ---
// This links your URL path to your route files
// Now, a request to /api/auth/login will go to routes/auth.js
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- 5. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Critical Server Error:", err.stack);
    res.status(err.status || 500).json({ 
        success: false,
        msg: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// --- 6. EXPORT FOR VERCEL ---
module.exports = app; 

// Keep your listen for local development
if (process.env.NODE_SERVER_LOCAL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Local Server running on port ${PORT}`));
}