const express = require("express");
const router = express.Router();

/** * IMPORTANT: Pathing for Vercel 
 * Since this file is in 'api/routes/', we go up ONE level (..) 
 * to reach the 'api' folder, then into middleware or models.
 */
const auth = require("../middleware/authMiddleware.js"); // One level up
const User = require("../models/User.js"); // One level up
/**
 * @route   GET /api/dashboard/dashboard-data
 * @desc    Get logged in user data for dashboard
 * @access  Private (Requires JWT Token)
 */
router.get("/dashboard-data", auth, async (req, res) => {
    try {
        // Log to Vercel console to confirm the request reached the backend
        console.log("Dashboard request received for user ID:", req.user.id);

        // Find user by ID but do not return the password
       // Inside api/routes/dashboard.js
// Ensure you are accessing 'id' inside the 'user' object you attached in middleware
const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            console.error("User ID not found in database:", req.user.id);
            return res.status(404).json({ msg: "User not found" });
        }

        // Send back a clean user object for the frontend
        res.json({ 
            user: {
                email: user.email,
                id: user._id
            } 
        });
    } catch (err) {
        // Log the exact error to Vercel for debugging
        console.error("Dashboard Route Error:", err.message);
        res.status(500).json({ 
            msg: "Server Error", 
            error: err.message 
        });
    }
});

module.exports = router;