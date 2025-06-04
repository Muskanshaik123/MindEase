const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

let pendingVerifications = new Map();
let users = new Map();

// Excel file paths
const USERS_FILE_PATH = './users_data.xlsx';
const JOURNAL_FILE_PATH = './journal_entries.xlsx';

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shaikmuskan471@gmail.com',
        pass: 'rknb xyek fpab hoas'
    }
});

// Initialize Excel Files
async function initializeExcelFiles() {
    try {
        // Initialize Users Excel
        if (!fs.existsSync(USERS_FILE_PATH)) {
            const usersWorkbook = new ExcelJS.Workbook();
            const usersWorksheet = usersWorkbook.addWorksheet('Users');
            usersWorksheet.columns = [
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Registration Date', key: 'registrationDate', width: 25 },
                { header: 'Last Login', key: 'lastLogin', width: 25 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            await usersWorkbook.xlsx.writeFile(USERS_FILE_PATH);
            console.log('Users Excel file created');
        }

        // Initialize Journal Entries Excel
        if (!fs.existsSync(JOURNAL_FILE_PATH)) {
            const journalWorkbook = new ExcelJS.Workbook();
            const journalWorksheet = journalWorkbook.addWorksheet('Journal');
            journalWorksheet.columns = [
                { header: 'ID', key: 'id', width: 15 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Date', key: 'date', width: 25 },
                { header: 'Mood', key: 'mood', width: 10 },
                { header: 'Entry', key: 'entry', width: 50 },
                { header: 'Goals Completed', key: 'goals', width: 30 }
            ];
            await journalWorkbook.xlsx.writeFile(JOURNAL_FILE_PATH);
            console.log('Journal Excel file created');
        }
    } catch (err) {
        console.error('Error initializing Excel files:', err);
        throw err;
    }
}

// Save User to Excel
async function saveUserToExcel(userData) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(USERS_FILE_PATH);
        const worksheet = workbook.getWorksheet('Users');

        worksheet.addRow({
            email: userData.email,
            registrationDate: new Date().toISOString(),
            lastLogin: userData.lastLogin || 'Never',
            status: userData.status || 'Active'
        });

        await workbook.xlsx.writeFile(USERS_FILE_PATH);
    } catch (err) {
        console.error('Error saving user to Excel:', err);
        throw err;
    }
}

// Update Last Login in Excel
async function updateUserLogin(email) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(USERS_FILE_PATH);
        const worksheet = workbook.getWorksheet('Users');

        let userFound = false;

        worksheet.eachRow((row, rowNum) => {
            if (rowNum > 1 && row.getCell(1).value === email) {
                row.getCell(3).value = new Date().toISOString();
                row.getCell(4).value = 'Active';
                userFound = true;
            }
        });

        if (!userFound) {
            throw new Error('User not found in Excel file');
        }

        await workbook.xlsx.writeFile(USERS_FILE_PATH);
    } catch (err) {
        console.error('Error updating user login:', err);
        throw err;
    }
}

// Save Journal Entry to Excel
async function saveJournalEntry(entryData) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(JOURNAL_FILE_PATH);
        const worksheet = workbook.getWorksheet('Journal');

        worksheet.addRow({
            id: Date.now(),
            email: entryData.email,
            date: new Date().toISOString(),
            mood: entryData.mood,
            entry: entryData.entry,
            goals: entryData.goals || 'None'
        });

        await workbook.xlsx.writeFile(JOURNAL_FILE_PATH);
        console.log('Journal entry saved to Excel');
    } catch (err) {
        console.error('Error saving journal entry:', err);
        throw err;
    }
}

// Get Journal Entries for a User
async function getUserJournalEntries(email) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(JOURNAL_FILE_PATH);
        const worksheet = workbook.getWorksheet('Journal');

        const entries = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
            if (rowNum > 1 && row.getCell(2).value === email) {
                entries.push({
                    id: row.getCell(1).value,
                    date: row.getCell(3).value,
                    mood: row.getCell(4).value,
                    entry: row.getCell(5).value,
                    goals: row.getCell(6).value
                });
            }
        });

        return entries;
    } catch (err) {
        console.error('Error getting journal entries:', err);
        throw err;
    }
}

// Serve Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (users.has(email)) return res.status(400).json({ error: 'User already exists' });

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Basic password strength check
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const verificationLink = `http://${req.headers.host}/api/verify-email?token=${token}`;

    pendingVerifications.set(token, {
        email,
        password,
        createdAt: new Date()
    });

    const mailOptions = {
        from: 'Mind Ease <shaikmuskan471@gmail.com>',
        to: email,
        subject: '🎉 Welcome to Mind Ease - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; text-align: center;">
                <h2 style="color: #4a4a4a;">Welcome to Mind Ease!</h2>
                <p style="font-size: 16px; color: #333;">Hi there,</p>
                <p style="font-size: 16px; color: #333;">We're excited to have you on board! To get started, please verify your email address:</p>
                
                <a href="${verificationLink}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">
                   Verify My Email
                </a>
                
                <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
                
                <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Mind Ease Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ 
            message: 'Verification email sent! Please check your inbox.', 
            success: true 
        });
    } catch (err) {
        console.error('Email sending error:', err);
        res.status(500).json({ 
            error: 'Failed to send verification email', 
            details: err.message 
        });
    }
});

// GET /api/verify-email
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;

    if (!token || !pendingVerifications.has(token)) {
        return res.send(`
            <div style="text-align: center; font-family: Arial; margin-top: 50px;">
                <h2 style="color: #ff4444;">⚠️ Invalid Verification Link</h2>
                <p>The verification link is invalid or has already been used.</p>
                <p><a href="/signup" style="color: #0066cc; text-decoration: none;">Click here to sign up again</a></p>
            </div>
        `);
    }

    const userData = pendingVerifications.get(token);
    const tokenAge = new Date() - userData.createdAt;

    if (tokenAge > 24 * 60 * 60 * 1000) {
        pendingVerifications.delete(token);
        return res.send(`
            <div style="text-align: center; font-family: Arial; margin-top: 50px;">
                <h2 style="color: #ff4444;">⏳ Verification Link Expired</h2>
                <p>This verification link has expired (valid for 24 hours only).</p>
                <p><a href="/signup" style="color: #0066cc; text-decoration: none;">Click here to request a new verification email</a></p>
            </div>
        `);
    }

    // Save user and mark as verified
    users.set(userData.email, {
        email: userData.email,
        password: userData.password,
        verified: true,
        createdAt: new Date()
    });

    try {
        await saveUserToExcel({ 
            email: userData.email, 
            status: 'Active' 
        });

        pendingVerifications.delete(token);

        res.send(`
            <div style="text-align: center; font-family: Arial; margin-top: 50px;">
                <h2 style="color: #4CAF50;">✅ Email Verified Successfully!</h2>
                <p>Your email address has been confirmed. You can now log in to your account.</p>
                <div style="margin-top: 30px;">
                    <a href="/" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 0 10px;">Login</a>
                    <a href="/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 0 10px;">Go to Dashboard</a>
                </div>
            </div>
        `);
    } catch (err) {
        console.error('Error during verification:', err);
        res.send(`
            <div style="text-align: center; font-family: Arial; margin-top: 50px;">
                <h2 style="color: #ff4444;">⚠️ Verification Error</h2>
                <p>An error occurred during verification. Please try again later.</p>
                <p><a href="/" style="color: #0066cc; text-decoration: none;">Return to login</a></p>
            </div>
        `);
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password are required' 
        });
    }

    const user = users.get(email);
    if (!user || user.password !== password) {
        return res.status(401).json({ 
            error: 'Invalid email or password' 
        });
    }

    if (!user.verified) {
        return res.status(401).json({ 
            error: 'Please verify your email first. Check your inbox for the verification link.' 
        });
    }

    try {
        await updateUserLogin(email);
        res.json({ 
            message: 'Login successful', 
            success: true, 
            user: { 
                email: user.email 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Failed to update login information' 
        });
    }
});

// POST /api/save-journal
app.post('/api/save-journal', async (req, res) => {
    const { email, mood, entry, goals } = req.body;

    if (!email || !mood) {
        return res.status(400).json({ 
            error: 'Email and mood are required' 
        });
    }

    try {
        await saveJournalEntry({
            email,
            mood,
            entry: entry || '',
            goals: goals || ''
        });

        res.json({ 
            success: true, 
            message: 'Journal entry saved successfully' 
        });
    } catch (err) {
        console.error('Error saving journal entry:', err);
        res.status(500).json({ 
            error: 'Failed to save journal entry' 
        });
    }
});

// GET /api/journal-entries
app.get('/api/journal-entries', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ 
            error: 'Email is required' 
        });
    }

    try {
        const entries = await getUserJournalEntries(email);
        res.json({ 
            success: true, 
            entries 
        });
    } catch (err) {
        console.error('Error getting journal entries:', err);
        res.status(500).json({ 
            error: 'Failed to retrieve journal entries' 
        });
    }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(USERS_FILE_PATH);
        const worksheet = workbook.getWorksheet('Users');

        const usersList = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
            if (rowNum === 1) return; // Skip headers
            usersList.push({
                email: row.getCell(1).value,
                registrationDate: row.getCell(2).value,
                lastLogin: row.getCell(3).value,
                status: row.getCell(4).value
            });
        });

        res.json(usersList);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ 
            error: 'Failed to retrieve user data' 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

// Initialize and start server
initializeExcelFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Mind Ease server is running on http://localhost:${PORT}`);
        console.log(`Available endpoints:`);
        console.log(`- GET  /                 - Login page`);
        console.log(`- GET  /signup           - Signup page`);
        console.log(`- GET  /dashboard        - Dashboard page`);
        console.log(`- POST /api/signup       - User registration`);
        console.log(`- POST /api/login        - User login`);
        console.log(`- GET  /api/verify-email - Email verification`);
        console.log(`- POST /api/save-journal - Save journal entry`);
        console.log(`- GET  /api/journal-entries - Get journal entries`);
        console.log(`- GET  /api/users        - Get all users`);
    });
}).catch(err => {
    console.error('Failed to initialize server:', err);
    process.exit(1);
});