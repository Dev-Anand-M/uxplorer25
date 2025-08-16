const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');

// Set up the database
const adapter = new JSONFile('backend/db.json');
const db = new Low(adapter);

// Set default data
async function initializeDatabase() {
    await db.read();
    db.data = db.data || { users: [], meetings: [], templates: [] };
    await db.write();
}

initializeDatabase();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Simple test route
app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the Timekeeper API!' });
});

// Meetings API
app.get('/api/meetings', async (req, res) => {
    await db.read();
    res.json(db.data.meetings);
});

app.post('/api/meetings', async (req, res) => {
    await db.read();
    const newMeeting = req.body;
    db.data.meetings.push(newMeeting);
    await db.write();
    res.status(201).json(newMeeting);
});

app.put('/api/meetings/:id', async (req, res) => {
    await db.read();
    const { id } = req.params;
    const updatedMeetingData = req.body;
    const meetingIndex = db.data.meetings.findIndex(m => m.id === id);

    if (meetingIndex === -1) {
        return res.status(404).json({ message: 'Meeting not found' });
    }

    db.data.meetings[meetingIndex] = { ...db.data.meetings[meetingIndex], ...updatedMeetingData };
    await db.write();
    res.json(db.data.meetings[meetingIndex]);
});

app.delete('/api/meetings/:id', async (req, res) => {
    await db.read();
    const { id } = req.params;
    db.data.meetings = db.data.meetings.filter(m => m.id !== id);
    await db.write();
    res.status(204).send();
});

// Templates API
app.get('/api/templates', async (req, res) => {
    await db.read();
    res.json(db.data.templates);
});

app.post('/api/templates', async (req, res) => {
    await db.read();
    const newTemplate = req.body;
    db.data.templates.push(newTemplate);
    await db.write();
    res.status(201).json(newTemplate);
});

app.put('/api/templates/:id', async (req, res) => {
    await db.read();
    const { id } = req.params;
    const updatedTemplateData = req.body;
    const templateIndex = db.data.templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
        return res.status(404).json({ message: 'Template not found' });
    }

    db.data.templates[templateIndex] = { ...db.data.templates[templateIndex], ...updatedTemplateData };
    await db.write();
    res.json(db.data.templates[templateIndex]);
});

app.delete('/api/templates/:id', async (req, res) => {
    await db.read();
    const { id } = req.params;
    db.data.templates = db.data.templates.filter(t => t.id !== id);
    await db.write();
    res.status(204).send();
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
