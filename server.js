const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); // Added for secure tokens
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Enable cookie parsing
app.use(express.static('public'));

// Route Middleware
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
            console.log('MongoDB connected successfully');
                    app.listen(PORT, () => {
                                console.log(`Server running on port ${PORT}`);
                                        });
                                            })
                                                .catch(err => {
                                                        console.error('Database connection error:', err.message);
                                                            });
                                                            