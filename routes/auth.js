const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { requireAuth } = require('../middleware/auth');
const { requiredText, validEmail } = require('../utils/validate');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const error = requiredText(name, 'Name', 100) || (!validEmail(email) ? 'Enter a valid email address.' : null)
      || (typeof password !== 'string' || password.length < 8 ? 'Password must contain at least 8 characters.' : null);
    if (error) return res.status(400).json({ error });
    const normalizedEmail = email.trim().toLowerCase();
    const { data: existing, error: lookupError } = await supabase.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
    const password_hash = await bcrypt.hash(password, 12);
    const { data, error: insertError } = await supabase.from('profiles')
      .insert({ name: name.trim(), email: normalizedEmail, password_hash, role: 'user' })
      .select('id,name,email,role,created_at').single();
    if (insertError) throw insertError;
    return res.status(201).json({ message: 'Account created. You can now sign in.', user: data });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }
    const { data: user, error } = await supabase.from('profiles')
      .select('id,name,email,role,password_hash').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('profiles')
      .select('id,name,email,role,created_at').eq('id', req.user.sub).single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) { next(err); }
});

module.exports = router;
