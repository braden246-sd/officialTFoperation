import { compare } from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db";
// This route handles user authentication. It accepts a POST request with email and password, verifies the credentials against the database, and returns a JWT token if successful. If the credentials are invalid or an error occurs, it responds with an appropriate error message.
const router = Router();

// its a post request to the /login endpoint
router.post("/login", async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    // Query the database for a user with the provided email
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [String(email).toLowerCase()],
    );
    const user = result.rows[0];

    // Same message for "no such user" and "wrong password" so attackers learn nothing
    const ok = user && (await compare(password, user.password_hash));
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });

    // Create a JWT token with user information and a 12-hour expiration
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "12h" },
    );
    // Respond with the token and user information
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
