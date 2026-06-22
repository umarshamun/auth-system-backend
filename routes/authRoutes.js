const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public Auth Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password Reset Flow Endpoints (Phase 3 Requirement)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected User Route
router.get('/profile', verifyToken, async (req, res) => {
    try {
            const User = require('../models/User');
                    const user = await User.findById(req.user.id).select('-password');
                            res.json(user);
                                } catch (err) {
                                        res.status(500).send('Server Error');
                                            }
                                            });

                                            // Protected Admin Route (RBAC Requirement)
                                            router.get('/admin-dashboard', verifyToken, requireRole('admin'), (req, res) => {
                                                res.json({ message: 'Welcome to the secure Admin Dashboard! Access granted.' });
                                                });

                                                module.exports = router;
                                                