const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET, NODE_ENV } = require('../config');

const prisma = new PrismaClient();

/**
 * POST /api/auth/signup
 * Creates a new user account. Password is hashed with bcrypt (12 rounds).
 */
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, hashedPassword },
    });

    // Issue JWT immediately on signup so user is logged in
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
};

/**
 * POST /api/auth/login
 * Verifies credentials and issues a JWT stored in an httpOnly cookie.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'Lax' });
  return res.status(200).json({ message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 * Returns the current user's profile + all orgs they belong to.
 * Protected by the authenticate middleware.
 */
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orgs: {
          select: {
            role: true,
            joinedAt: true,
            organization: {
              select: { id: true, name: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { signup, login, logout, me };
