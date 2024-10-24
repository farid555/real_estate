import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

// Helper to generate JWT token
const generateToken = (userId, isAdmin) => {
  const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
  return jwt.sign({ id: userId, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

// Register function
export const register = async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isAdmin: isAdmin || false, // Default isAdmin to false if not provided
      },
    });

    res
      .status(201)
      .json({ message: "User created successfully", userId: newUser.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create a User" });
  }
};

// Login function
export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token with isAdmin flag
    if (typeof user.isAdmin === "undefined") {
      throw new Error("isAdmin is not defined for the user");
    }
    // Generate JWT token
    const token = generateToken(user.id, user.isAdmin);

    // Send token via cookie and user info as response
    const { password: userPassword, ...userInfo } = user;
    return res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to login" });
  }
};

// Logout function
export const logout = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({ message: "Logout successful" });
};
