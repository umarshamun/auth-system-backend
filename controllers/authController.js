const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Validation Rules
const registerSchema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// 1. REGISTER A NEW USER
exports.register = async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, email, password } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) return res.status(409).json({ message: 'Username or Email already taken' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 2. LOGIN A USER
exports.login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Email or Password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Email or Password' });

        const accessToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_ACCESS_SECRET, 
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Logged in successfully!',
            accessToken,
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 3. REFRESH TOKEN ENDPOINT
exports.refresh = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: 'No refresh token, access denied' });

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({ accessToken });
    } catch (err) {
        res.status(401).json({ message: 'Token expired or invalid' });
    }
};

// 4. LOGOUT ENDPOINT
exports.logout = async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// 5. GENERATE PASSWORD RESET TOKEN
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User with this email does not exist' });

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
        await user.save();

        res.status(200).json({
            message: 'Password reset token generated successfully. Valid for 15 minutes.',
            resetToken,
            resetUrl: `http://localhost:5000/api/auth/reset-password/${resetToken}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 6. RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been updated successfully! You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
