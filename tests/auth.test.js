const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', require('../routes/authRoutes'));

// Connect to MongoDB before running any tests
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
                }
                });

                // Close connection after tests complete so Jest can exit safely
                afterAll(async () => {
                    await mongoose.connection.close();
                    });

                    describe('3MTT Auth System Integration Tests', () => {
                        const uniqueUser = {
                                username: `testuser_${Date.now()}`,
                                        email: `test_${Date.now()}@example.com`,
                                                password: 'securePassword123'
                                                    };

                                                        // 1. Test Successful Registration
                                                            it('should register a new user successfully (201)', async () => {
                                                                    const res = await request(app)
                                                                                .post('/api/auth/register')
                                                                                            .send(uniqueUser);
                                                                                                    
                                                                                                            expect(res.statusCode).toEqual(201);
                                                                                                                    expect(res.body).toHaveProperty('message', 'User registered successfully!');
                                                                                                                        });

                                                                                                                            // 2. Test 409 Duplicate Requirement
                                                                                                                                it('should reject a duplicate email/username registration with 409 Conflict', async () => {
                                                                                                                                        const res = await request(app)
                                                                                                                                                    .post('/api/auth/register')
                                                                                                                                                                .send(uniqueUser);
                                                                                                                                                                        
                                                                                                                                                                                expect(res.statusCode).toEqual(409);
                                                                                                                                                                                        expect(res.body).toHaveProperty('message', 'Username or Email already taken');
                                                                                                                                                                                            });

                                                                                                                                                                                                // 3. Test Login and Dual Token Receipt
                                                                                                                                                                                                    it('should log in a user and return an access token (200)', async () => {
                                                                                                                                                                                                            const res = await request(app)
                                                                                                                                                                                                                        .post('/api/auth/login')
                                                                                                                                                                                                                                    .send({
                                                                                                                                                                                                                                                    email: uniqueUser.email,
                                                                                                                                                                                                                                                                    password: uniqueUser.password
                                                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                expect(res.statusCode).toEqual(200);
                                                                                                                                                                                                                                                                                                        expect(res.body).toHaveProperty('accessToken');
                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                        const cookies = res.headers['set-cookie'][0];
                                                                                                                                                                                                                                                                                                                                expect(cookies).toContain('refreshToken');
                                                                                                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                                                                                                    