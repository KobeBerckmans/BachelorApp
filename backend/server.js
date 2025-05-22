const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('bachelorapp');
    const users = db.collection('users');
    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({ email, password: hashed, accepted: false, role: 'volunteer' });
    res.status(201).json({ message: 'Registration successful. Awaiting approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Coordinator login endpoint
app.post('/api/coordinator-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('bachelorapp');
    const users = db.collection('users');
    const user = await users.findOne({ email, role: 'coordinator', accepted: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or not a coordinator.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json({ token: 'dummy-token', role: 'coordinator', email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Get pending volunteers
app.get('/api/pending-volunteers', async (req, res) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('bachelorapp');
    const users = db.collection('users');
    const pending = await users.find({ role: 'volunteer', accepted: false }).toArray();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Accept volunteer
app.post('/api/accept-volunteer', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('bachelorapp');
    const users = db.collection('users');
    const result = await users.updateOne({ _id: new ObjectId(userId), role: 'volunteer' }, { $set: { accepted: true } });
    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Volunteer not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Add coordinator
app.post('/api/add-coordinator', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('bachelorapp');
    const users = db.collection('users');
    const existing = await users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({ email, password: hashed, role: 'coordinator', accepted: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`)); 