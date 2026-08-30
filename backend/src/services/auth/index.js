const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { query } = require('../../config/db');

/**
 * Authentication Service Module
 * Handles user registration, login, token generation, and password hashing.
 */
class AuthService {
  async registerUser({ name, email, password }) {
    if (!name || !email || !password) {
      const err = new Error('Name, email, and password are required.');
      err.statusCode = 400;
      throw err;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const err = new Error('Email is already registered.');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into users table
    const res = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = res.rows[0];

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  async loginUser({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const res = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (res.rows.length === 0) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const user = res.rows[0];

    // Compare password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // Prepare user object for output (exclude password_hash)
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };

    // Generate token
    const token = this.generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
  }
}

module.exports = new AuthService();
