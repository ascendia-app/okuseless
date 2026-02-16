const express = require("express");
const router = express.Router();
const User = require('../models/User.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authMiddleware.js");

// Helper function to create token
const createToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET, // Remove the || "your_secret_key"
        { expiresIn: "7d" }
    );
};

/* --- SIGNUP --- */
router.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        user = new User({ email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const token = createToken(user.id);
        res.json({ token });
    } catch (err) {
        res.status(500).send("Server Error during Signup");
    }
});

/* --- LOGIN --- */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = createToken(user.id);
        res.json({ token });
    } catch (err) {
        res.status(500).send("Server Error during Login");
    }
});

/* --- VERIFY (Used by checkAuth in frontend) --- */
router.get("/verify", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ valid: false });
        res.json({ valid: true, email: user.email });
    } catch (err) {
        res.status(401).json({ valid: false, msg: "Token expired or invalid" });
    }
});

module.exports = router;