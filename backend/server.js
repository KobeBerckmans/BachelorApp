// Express backend server for BachelorApp
// Handles all API endpoints for volunteers, coordinators, help requests, and contacts.
// Only accessible/usable by Buren voor Buren Tienen.

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;

// Register endpoint
/**
 * Register a new volunteer.
 * Expects: { email, password }
 * Returns: 201 on success, 409 if user exists, 400 if missing fields.
 */
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
/**
 * Coordinator login endpoint.
 * Expects: { email, password }
 * Returns: token, role, email on success. 401/400 on error.
 */
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
/**
 * Get all pending volunteers (not yet accepted).
 * Returns: Array of pending volunteers.
 */
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
/**
 * Accept a pending volunteer by userId.
 * Expects: { userId }
 * Returns: success or error.
 */
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
/**
 * Promote a volunteer to coordinator by email.
 * Expects: { email }
 * Only works if user exists and is a volunteer.
 * Returns: success or error.
 */
app.post('/api/add-coordinator', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
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
    if (!existing) return res.status(404).json({ error: 'Gebruiker bestaat niet' });
    if (existing.role === 'coordinator') return res.status(409).json({ error: 'Gebruiker is al coördinator' });
    if (existing.role === 'volunteer') {
      await users.updateOne(
        { email },
        { $set: { role: 'coordinator', accepted: true } }
      );
      return res.json({ success: true });
    }
    return res.status(400).json({ error: 'Kan alleen vrijwilligers tot coördinator maken' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Volunteer login endpoint
/**
 * Volunteer login endpoint.
 * Expects: { email, password }
 * Returns: token, role, email, userId on success. 401/400 on error.
 */
app.post('/api/volunteer-login', async (req, res) => {
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
    const user = await users.findOne({ email, role: 'volunteer', accepted: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or not a volunteer.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json({ token: 'dummy-token', role: 'volunteer', email: user.email, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Volunteer accept help request endpoint
/**
 * Volunteer accepts a help request.
 * Expects: { requestId, volunteerId }
 * Returns: success or error.
 */
app.post('/api/accept-help-request', async (req, res) => {
  const { requestId, volunteerId } = req.body;
  if (!requestId || !volunteerId) {
    return res.status(400).json({ error: 'requestId and volunteerId are required.' });
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
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    const result = await requests.updateOne(
      { _id: new ObjectId(requestId), accepted: false },
      { $set: { accepted: true, volunteerId: new ObjectId(volunteerId) } }
    );
    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Help request not found or already accepted.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Get all help requests
/**
 * Get all help requests.
 * Returns: Array of help requests.
 * Only includes 'telefoon' if user is coordinator or accepted volunteer.
 */
app.get('/api/help-requests', async (req, res) => {
  const userEmail = req.header('x-user-email');
  const userRole = req.header('x-user-role');
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    const allRequests = await requests.find({}).toArray();
    // Map over requests and remove 'telefoon' unless allowed
    const filtered = allRequests.map(req => {
      // Always show for coordinator
      if (userRole === 'coordinator') return req;
      // Show for accepted volunteer
      if (userRole === 'volunteer' && req.acceptedBy && req.acceptedBy === userEmail) return req;
      // Otherwise, remove telefoon
      const { telefoon, ...rest } = req;
      return rest;
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Get all contacts
/**
 * Get all contacts.
 * Returns: Array of contact messages.
 */
app.get('/api/contacts', async (req, res) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const contacts = db.collection('contacts');
    const allContacts = await contacts.find({}).toArray();
    res.json(allContacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Get all volunteers
/**
 * Get all volunteers.
 * Returns: Array of volunteers.
 */
app.get('/api/volunteers', async (req, res) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const volunteers = db.collection('volunteers');
    const allVolunteers = await volunteers.find({}).toArray();
    res.json(allVolunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Delete pending volunteer
/**
 * Delete a pending volunteer by id.
 * Returns: success or error.
 */
app.delete('/api/pending-volunteers/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE] /api/pending-volunteers/${id}`);
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
    const result = await users.deleteOne({ _id: new ObjectId(id), role: 'volunteer', accepted: false });
    console.log('Delete result:', result);
    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Pending volunteer not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Delete contact
/**
 * Delete a contact by id.
 * Returns: success or error.
 */
app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE] /api/contacts/${id}`);
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const contacts = db.collection('contacts');
    const result = await contacts.deleteOne({ _id: new ObjectId(id) });
    console.log('Delete result:', result);
    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Contact not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Delete volunteer
/**
 * Delete a volunteer by id.
 * Returns: success or error.
 */
app.delete('/api/volunteers/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE] /api/volunteers/${id}`);
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const volunteers = db.collection('volunteers');
    const result = await volunteers.deleteOne({ _id: new ObjectId(id) });
    console.log('Delete result:', result);
    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Volunteer not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Delete help request
/**
 * Delete a help request by id.
 * Returns: success or error.
 */
app.delete('/api/help-requests/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE] /api/help-requests/${id}`);
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    const result = await requests.deleteOne({ _id: new ObjectId(id) });
    console.log('Delete result:', result);
    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Help request not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Cancel accepted help request
/**
 * Cancel an accepted help request by volunteer (email) or coordinator.
 * Expects: { email }
 * Returns: success or error.
 */
app.post('/api/help-requests/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userRole = req.header('x-user-role');
  if (!email) return res.status(400).json({ error: 'Email required' });
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    
    // If user is coordinator, they can cancel any request
    if (userRole === 'coordinator') {
      const result = await requests.updateOne(
        { _id: new ObjectId(id), accepted: true },
        { $set: { accepted: false, acceptedBy: null } }
      );
      if (result.modifiedCount === 1) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Help request not found or not accepted.' });
      }
    } else {
      // For volunteers, only allow canceling their own accepted requests
      const result = await requests.updateOne(
        { _id: new ObjectId(id), acceptedBy: email },
        { $set: { accepted: false, acceptedBy: null } }
      );
      if (result.modifiedCount === 1) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Help request not found or not accepted by this volunteer.' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// Accept help request by volunteer (email)
/**
 * Accept a help request by volunteer (email).
 * Expects: { email }
 * Returns: success or error.
 */
app.post('/api/help-requests/:id/accept', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    const result = await requests.updateOne(
      { _id: new ObjectId(id), accepted: { $ne: true } },
      { $set: { accepted: true, acceptedBy: email } }
    );
    if (result.modifiedCount === 1) {
    res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Help request not found or already accepted.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

// --- PUSH NOTIFICATION POLLING ---
let lastKnownRequestId = null;

/**
 * Send a push notification to a volunteer.
 * @param expoPushToken - Expo push token
 * @param message - Notification message
 */
async function sendPushNotification(expoPushToken, message) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title: 'Nieuwe hulpaanvraag!',
      body: message,
      data: { type: 'new_help_request' },
    }),
  });
}

/**
 * Poll for new help requests and send push notifications.
 * Runs every 10 seconds.
 */
async function pollNewHelpRequests() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await client.connect();
    const db = client.db('FinalWork');
    const requests = db.collection('helpRequests');
    // Vind de nieuwste aanvraag
    const newest = await requests.find().sort({ _id: -1 }).limit(1).toArray();
    if (newest.length > 0) {
      const newestId = newest[0]._id.toString();
      if (lastKnownRequestId && newestId !== lastKnownRequestId) {
        // Nieuwe aanvraag gevonden!
        const volunteers = await db.collection('volunteers').find({ expoPushToken: { $exists: true, $ne: null } }).toArray();
        for (const v of volunteers) {
          if (v.expoPushToken) {
            sendPushNotification(v.expoPushToken, 'Er is een nieuwe hulpaanvraag binnengekomen!');
          }
        }
      }
      lastKnownRequestId = newestId;
    }
  } catch (err) {
    console.error('Polling error:', err);
  } finally {
    await client.close();
  }
}

setInterval(pollNewHelpRequests, 10000); // elke 10 seconden

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`)); 