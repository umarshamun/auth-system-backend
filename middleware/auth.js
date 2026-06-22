const jwt = require('jsonwebtoken');

// 1. Authenticate the User using the Access Token
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

        if (!token) {
                return res.status(401).json({ message: 'No token, authorization denied' });
                    }

                        try {
                                const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
                                        const decoded = jwt.verify(cleanToken, process.env.JWT_ACCESS_SECRET);
                                                
                                                        req.user = decoded; // Attaches { id, role } to the request object
                                                                next();
                                                                    } catch (err) {
                                                                            res.status(401).json({ message: 'Token is not valid or has expired' });
                                                                                }
                                                                                };

                                                                                // 2. Gate Routes by Role (RBAC Requirement)
                                                                                exports.requireRole = (...allowedRoles) => {
                                                                                    return (req, res, next) => {
                                                                                            if (!req.user) {
                                                                                                        return res.status(401).json({ message: 'Unauthorized' });
                                                                                                                }
                                                                                                                        
                                                                                                                                // Check if the user's role matches the allowed roles for this route
                                                                                                                                        if (!allowedRoles.includes(req.user.role)) {
                                                                                                                                                    return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
                                                                                                                                                            }
                                                                                                                                                                    next();
                                                                                                                                                                        };
                                                                                                                                                                        };
                                                                                                                                                                        