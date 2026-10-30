
const User = require("../models/User");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");

// Generate JWT token
const signToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// Register new customer
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            throw new AppError("Name, email, and password are required", 400);
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            throw new AppError("Name, email, and password must be strings", 400);
        }

        if (password.length < 8) {
            throw new AppError("Password must be at least 8 characters", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            throw new AppError("Email is already registered", 409);
        }

        // Create user in MongoDB
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: "customer"
        });

        const token = signToken(user._id);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

// Login existing user
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            throw new AppError("Valid email and password are required", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            throw new AppError("Invalid email or password", 401);
        }

        if (!user.isActive) {
            throw new AppError("Your account has been deactivated", 403);
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { register, login };
