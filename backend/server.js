require('dotenv').config();

// Manual environment loading as fallback
if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ dotenv failed, loading manually...');
    process.env.GEMINI_API_KEY = 'Your api key';
    process.env.NODE_ENV = 'development';
    console.log('✅ Environment variables loaded manually');
}
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const https = require('https');

// Database
const { initializeDatabase, dbHelpers } = require('../database/database');

// ML Components - Simplified versions without external dependencies
const SentimentAnalyzer = require('./services/ml/sentimentAnalyzer');
const MoodPredictor = require('./services/ml/moodPredictor');
const RecommendationEngine = require('./services/ml/recommendationEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize ML components
const sentimentAnalyzer = new SentimentAnalyzer();
const moodPredictor = new MoodPredictor();
const recommendationEngine = new RecommendationEngine();

// Remove cookie parser - using localStorage only

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from frontend directory
app.use(express.static('../frontend/pages', {
    index: false, // Don't serve index.html automatically
    setHeaders: (res, path) => {
        // Add cache control headers
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// HTML page authentication middleware - simplified approach
const authenticateHTMLPage = (req, res, next) => {
    // For HTML pages, we'll just serve them and let frontend handle auth
    // This prevents the redirect loop issue
    next();
};

// Session middleware for API routes
const authenticateUser = (req, res, next) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔐 API Auth Check - Token present:', !!sessionToken);
    
    if (!sessionToken) {
        console.log('❌ No session token provided');
        return res.status(401).json({ error: 'No session token provided' });
    }

    const session = dbHelpers.getSessionByToken(sessionToken);
    if (!session) {
        console.log('❌ Invalid or expired session');
        return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = dbHelpers.getUserById(session.user_id);
    if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({ error: 'User not found' });
    }

    console.log('✅ API Auth successful for user:', user.email);
    req.user = user;
    req.sessionToken = sessionToken;
    next();
};

let pendingVerifications = new Map();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test email configuration
app.get('/test-email', async (req, res) => {
    try {
        // Test email connection
        await transporter.verify();
        res.json({ 
            success: true, 
            message: 'Email configuration is working!',
            config: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                user: process.env.EMAIL_USER,
                nodeEnv: process.env.NODE_ENV
            }
        });
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Email configuration failed',
            details: error.message 
        });
    }
});

// Test endpoint to show current user
app.get('/test-user', authenticateHTMLPage, (req, res) => {
    res.send(`
        <html>
            <head><title>Current User Test</title></head>
            <body style="font-family: Arial; padding: 40px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                    <h1>🔍 Current User Information</h1>
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2>✅ Authentication Successful!</h2>
                        <p><strong>Email:</strong> ${req.user.email}</p>
                        <p><strong>Name:</strong> ${req.user.name || 'Not set'}</p>
                        <p><strong>ID:</strong> ${req.user.id}</p>
                        <p><strong>Created:</strong> ${req.user.created_at}</p>
                        <p><strong>Last Login:</strong> ${req.user.last_login || 'Never'}</p>
                    </div>
                    <p><a href="/dashboard">Go to Dashboard</a></p>
                    <p><a href="/">Go to Login</a></p>
                </div>
            </body>
        </html>
    `);
});

// Serve Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'login.html'));
});

// Handle favicon requests to avoid 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
});

// Simple working versions
app.get('/simple-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple-login.html'));
});

app.get('/simple-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple-dashboard.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'signup.html'));
});

// Working complete app
app.get('/working-app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'working-app.html'));
});

app.get('/dashboard', (req, res) => {
    const userAgent = req.get('User-Agent') || 'Unknown';
    const referer = req.get('Referer') || 'Direct';
    console.log('📄 Serving dashboard page');
    console.log('   User-Agent:', userAgent.substring(0, 50) + '...');
    console.log('   Referer:', referer);
    console.log('   IP:', req.ip || req.connection.remoteAddress);
    
    // Add cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // Serve the main dashboard - authentication handled by frontend
    res.sendFile(path.join(__dirname, '../frontend/pages', 'dashboard.html'));
});


app.get('/main-dashboard', (req, res) => {
    console.log(' Serving main dashboard');
    res.sendFile(path.join(__dirname, '../frontend/pages', 'main-dashboard.html'));
});
app.get('/status', (req, res) => {
    console.log('📄 Serving status page');
    res.sendFile(path.join(__dirname, 'status.html'));
});

app.get('/simple-dashboard-test', (req, res) => {
    console.log('📄 Serving simple dashboard test');
    res.sendFile(path.join(__dirname, 'simple-dashboard-test.html'));
});

app.get('/debug-dashboard', (req, res) => {
    console.log('📄 Serving debug dashboard');
    
    // Add cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // Serve the debug dashboard (no auth required for debugging)
    res.sendFile(path.join(__dirname, 'debug-dashboard.html'));
});

app.get('/system-check', (req, res) => {
    console.log('📄 Serving system check page');
    
    // Add cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // Serve the system check page (no auth required)
    res.sendFile(path.join(__dirname, 'system-check.html'));
});

app.get('/dashboard-old', authenticateHTMLPage, (req, res) => {
    console.log('📄 Serving old dashboard for user:', req.user.email);
    
    // Add cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // Serve the old dashboard.html
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard-backup', authenticateHTMLPage, (req, res) => {
    console.log('📄 Serving backup dashboard for user:', req.user.email);
    
    // Add cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // Serve the backup dashboard
    res.sendFile(path.join(__dirname, 'public', 'dashboard-backup.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'chatbot.html'));
});

app.get('/meditation', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'meditation.html'));
});

app.get('/mood-history', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'mood-history-new.html'));
});

// Journal Route
app.get('/journal', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'journal.html'));
});

// Profile Route - Serve comprehensive profile page
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'profile-complete.html'));
});

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Check if user already exists
    const existingUser = dbHelpers.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Basic password strength check
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // In development mode, skip email verification
    if (process.env.NODE_ENV === 'development') {
        try {
            // Create user directly
            const result = dbHelpers.createUser(email, password, name || null);
            
            // Initialize user stats
            dbHelpers.updateUserStats(result.lastInsertRowid);

            res.json({ 
                message: 'Account created successfully! You can now log in.', 
                success: true 
            });
        } catch (err) {
            console.error('User creation error:', err);
            res.status(500).json({ 
                error: 'Failed to create account', 
                details: err.message 
            });
        }
        return;
    }

    // Production mode - send verification email
    const token = crypto.randomBytes(32).toString('hex');
    const verificationLink = `http://${req.headers.host}/api/verify-email?token=${token}`;

    pendingVerifications.set(token, {
        email,
        password,
        name: name || null,
        createdAt: new Date()
    });

    const mailOptions = {
        from: `Mind Ease <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Mind Ease - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; text-align: center;">
                <h2 style="color: #4a4a4a;">Welcome to Mind Ease!</h2>
                <p style="font-size: 16px; color: #333;">Hi ${name || 'there'},</p>
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

    try {
        // Create user in database
        const result = dbHelpers.createUser(userData.email, userData.password, userData.name);
        
        // Initialize user stats
        dbHelpers.updateUserStats(result.lastInsertRowid);

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
        res.status(500).send(`
            <div style="text-align: center; font-family: Arial; margin-top: 50px;">
                <h2 style="color: #ff4444;">❌ Verification Failed</h2>
                <p>There was an error creating your account. Please try again.</p>
                <p><a href="/signup" style="color: #0066cc; text-decoration: none;">Click here to sign up again</a></p>
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

    const user = dbHelpers.getUserByEmail(email);
    if (!user || user.password !== password) {
        return res.status(401).json({ 
            error: 'Invalid email or password' 
        });
    }

    try {
        // Create session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        dbHelpers.createSession(user.id, sessionToken, expiresAt.toISOString());
        
        // Update last login
        dbHelpers.updateUserProfile(user.id, { last_login: new Date().toISOString() });
        
        res.json({ 
            message: 'Login successful', 
            success: true, 
            sessionToken,
            user: { 
                id: user.id,
                email: user.email,
                name: user.name
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Failed to process login' 
        });
    }
});

// POST /api/save-journal - Enhanced with ML analysis
app.post('/api/save-journal', authenticateUser, async (req, res) => {
    const { mood, entry, goals, title } = req.body;
    const userId = req.user.id;

    if (!mood) {
        return res.status(400).json({ 
            error: 'Mood is required' 
        });
    }

    try {
        // Perform sentiment analysis on the journal entry
        const sentimentAnalysis = sentimentAnalyzer.analyzeSentiment(entry || '');
        
        // Get user's journal history for trend analysis
        const existingEntries = dbHelpers.getUserJournalEntries(userId, 20);
        const moodTrendAnalysis = sentimentAnalyzer.analyzeMoodTrend(existingEntries);

        // Save journal entry to database
        const result = dbHelpers.createJournalEntry(
            userId, 
            title || 'Journal Entry', 
            entry || '', 
            parseInt(mood), 
            goals || null
        );

        // Update user stats
        dbHelpers.updateUserStats(userId);

        // Generate personalized recommendations
        const moodEntries = dbHelpers.getUserMoodEntries(userId, 20);
        const userProfile = {
            currentMood: parseInt(mood),
            moodHistory: moodEntries.map(e => ({ date: e.created_at, value: e.mood_value })),
            journalEntries: existingEntries,
            timeAvailable: 30 // Default 30 minutes
        };
        
        const recommendations = recommendationEngine.generateRecommendations(userProfile);

        res.json({ 
            success: true, 
            message: 'Journal entry saved successfully',
            entryId: result.lastInsertRowid,
            analysis: {
                sentiment: sentimentAnalysis,
                moodTrend: moodTrendAnalysis,
                recommendations: recommendations
            }
        });
    } catch (err) {
        console.error('Error saving journal entry:', err);
        res.status(500).json({ 
            error: 'Failed to save journal entry',
            details: err.message
        });
    }
});

// GET /api/journal-entries
app.get('/api/journal-entries', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    try {
        const entries = dbHelpers.getUserJournalEntries(userId, limit);
        res.json({ 
            success: true, 
            entries 
        });
    } catch (err) {
        console.error('Error getting journal entries:', err);
        res.status(500).json({ 
            error: 'Failed to retrieve journal entries',
            details: err.message
        });
    }
});

// POST /api/analyze-sentiment - Analyze sentiment of text
app.post('/api/analyze-sentiment', (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required for analysis' });
    }

    try {
        const analysis = sentimentAnalyzer.analyzeSentiment(text);
        res.json({
            success: true,
            analysis
        });
    } catch (err) {
        console.error('Error analyzing sentiment:', err);
        res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
});

// GET /api/recommendations - Get personalized recommendations
app.get('/api/recommendations', authenticateUser, async (req, res) => {
    const { timeAvailable, currentMood } = req.query;
    const userId = req.user.id;

    try {
        // Get user's historical data from database
        const journalEntries = dbHelpers.getUserJournalEntries(userId, 20);
        const moodEntries = dbHelpers.getUserMoodEntries(userId, 20);

        // Create mood history from mood entries
        const moodHistory = moodEntries.map(entry => ({
            date: entry.created_at,
            value: entry.mood_value
        }));

        // Create user profile for recommendations
        const userProfile = {
            currentMood: parseInt(currentMood) || 3,
            moodHistory,
            journalEntries,
            timeAvailable: parseInt(timeAvailable) || 30,
            preferences: {} // Could be expanded with user preferences
        };

        const recommendations = recommendationEngine.generateRecommendations(userProfile);

        res.json({
            success: true,
            recommendations,
            profileData: {
                moodEntries: moodHistory.length,
                journalEntries: journalEntries.length,
                timeAvailable: userProfile.timeAvailable
            }
        });
    } catch (err) {
        console.error('Error generating recommendations:', err);
        res.status(500).json({ 
            error: 'Failed to generate recommendations',
            details: err.message
        });
    }
});

// GET /api/mood-timeline - Get recent mood entries for timeline
app.get('/api/mood-timeline', authenticateUser, (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        
        // Get the most recent mood entries
        const moodEntries = dbHelpers.getUserMoodEntries(userId, limit);
        
        if (moodEntries.length === 0) {
            return res.json({
                success: true,
                timeline: [],
                message: 'No mood entries found'
            });
        }
        
        // Format timeline data
        const timeline = moodEntries.map(entry => ({
            date: entry.created_at,
            mood: entry.mood_value,
            label: entry.mood_label,
            notes: entry.notes
        }));
        
        res.json({
            success: true,
            timeline: timeline
        });
        
    } catch (error) {
        console.error('Mood timeline error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mood timeline'
        });
    }
});

// GET /api/mood-insights - Get detailed mood insights and analytics
app.get('/api/mood-insights', authenticateUser, async (req, res) => {
    const userId = req.user.id;

    try {
        const journalEntries = dbHelpers.getUserJournalEntries(userId, 50);
        const moodEntries = dbHelpers.getUserMoodEntries(userId, 50);
        
        // Get all mood entries for streak calculation
        const allMoodEntries = dbHelpers.getUserMoodEntries(userId, 365);
        
        // Calculate streaks
        const currentStreak = calculateMoodStreak(allMoodEntries);
        const longestStreak = calculateLongestStreak(allMoodEntries);
        
        // Create mood history from mood entries
        const moodHistory = moodEntries.map(entry => ({
            date: entry.created_at,
            value: entry.mood_value
        }));

        if (moodHistory.length === 0) {
            return res.json({
                success: true,
                insights: {
                    message: 'No mood data available yet. Start tracking your mood to see insights!',
                    hasData: false,
                    currentStreak: 0,
                    longestStreak: 0
                }
            });
        }

        // Analyze mood trends
        const moodTrend = sentimentAnalyzer.analyzeMoodTrend(moodEntries);
        
        // Analyze mood patterns if we have enough data
        let patterns = { patterns: [], insights: [] };
        if (moodHistory.length >= 7) {
            patterns = moodPredictor.analyzeMoodPatterns(moodHistory);
        }

        // Calculate statistics
        const moodValues = moodHistory.map(m => m.value);
        const averageMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
        const moodVariability = Math.sqrt(
            moodValues.reduce((sum, mood) => sum + Math.pow(mood - averageMood, 2), 0) / moodValues.length
        );

        // Analyze journal sentiment trends
        const journalSentiments = journalEntries
            .filter(entry => entry.content && entry.content.trim().length > 0)
            .map(entry => ({
                date: entry.created_at,
                sentiment: sentimentAnalyzer.analyzeSentiment(entry.content)
            }));

        res.json({
            success: true,
            insights: {
                totalEntries: moodHistory.length,
                averageMood: Math.round(averageMood * 10) / 10,
                currentStreak: currentStreak,
                longestStreak: longestStreak,
                trend: moodHistory.length >= 2 ? 
                    (moodHistory[0].value > moodHistory[moodHistory.length - 1].value ? 'improving' : 
                     moodHistory[0].value < moodHistory[moodHistory.length - 1].value ? 'declining' : 'stable') : 'stable',
                weeklyData: moodHistory.slice(0, 30).reverse().map(entry => ({
                    date: entry.date,
                    mood: entry.value,
                    label: moodEntries.find(m => m.mood_value === entry.value)?.mood_label || 'Unknown',
                    notes: moodEntries.find(m => m.mood_value === entry.value)?.notes || null
                })),
                recommendations: [
                    averageMood < 3 ? 'Consider talking to a mental health professional' : 'Keep up the great work!',
                    'Try incorporating more physical activity into your routine',
                    'Practice mindfulness or meditation daily'
                ],
                journalEntries: journalEntries.length,
                patterns: {
                    mostCommonMood: moodEntries.reduce((a, b) => 
                        moodEntries.filter(v => v.mood_value === a.mood_value).length >= 
                        moodEntries.filter(v => v.mood_value === b.mood_value).length ? a : b
                    ).mood_label,
                    moodRange: {
                        highest: Math.max(...moodEntries.map(e => e.mood_value)),
                        lowest: Math.min(...moodEntries.map(e => e.mood_value))
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error generating mood insights:', err);
        res.status(500).json({ 
            error: 'Failed to generate mood insights',
            details: err.message
        });
    }
});

// GET /api/coping-strategies - Get coping strategies for specific concerns
app.get('/api/coping-strategies', (req, res) => {
    const { concern } = req.query;

    if (!concern) {
        return res.status(400).json({ error: 'Concern type is required' });
    }

    try {
        const strategies = recommendationEngine.getCopingStrategies(concern);
        
        if (strategies.length === 0) {
            return res.json({
                success: true,
                strategies: [],
                message: `No specific strategies found for "${concern}". Try general wellness activities.`
            });
        }

        res.json({
            success: true,
            concern,
            strategies
        });
    } catch (err) {
        console.error('Error getting coping strategies:', err);
        res.status(500).json({ 
            error: 'Failed to get coping strategies' 
        });
    }
});

// GET /api/activities-by-time - Get activity suggestions based on available time
app.get('/api/activities-by-time', (req, res) => {
    const { timeAvailable, moodLevel } = req.query;

    if (!timeAvailable) {
        return res.status(400).json({ error: 'Time available is required' });
    }

    try {
        const activities = recommendationEngine.getActivitiesByTime(
            parseInt(timeAvailable),
            parseInt(moodLevel) || 3
        );

        res.json({
            success: true,
            timeAvailable: parseInt(timeAvailable),
            moodLevel: parseInt(moodLevel) || 3,
            activities
        });
    } catch (err) {
        console.error('Error getting activities by time:', err);
        res.status(500).json({ 
            error: 'Failed to get activity suggestions' 
        });
    }
});

// GET /api/dashboard-data - Get real-time dashboard data
app.get('/api/dashboard-data', authenticateUser, (req, res) => {
    try {
        const userId = req.user.id;
        console.log('📊 Dashboard data request for user ID:', userId);
        
        // Update user stats first to ensure fresh data
        dbHelpers.updateUserStats(userId);
        
        // Get user stats
        const stats = dbHelpers.getUserStats(userId);
        console.log('📊 User stats:', stats);
        
        // Get recent mood entries
        const recentMoods = dbHelpers.getUserMoodEntries(userId, 7);
        console.log('📊 Recent moods count:', recentMoods.length);
        
        // Get all mood entries for streak calculation
        const allMoodEntries = dbHelpers.getUserMoodEntries(userId, 365); // Get up to 1 year of data
        console.log('📊 All mood entries count:', allMoodEntries.length);
        
        // Calculate streaks
        const currentStreak = calculateMoodStreak(allMoodEntries);
        const longestStreak = calculateLongestStreak(allMoodEntries);
        console.log('📊 Streaks - Current:', currentStreak, 'Longest:', longestStreak);
        
        // Get recent journal entries
        const recentJournals = dbHelpers.getUserJournalEntries(userId, 5);
        console.log('📊 Recent journals count:', recentJournals.length);
        
        // Get wellness score from user profile
        const user = dbHelpers.getUserById(userId);
        const wellnessScore = user?.wellness_score || 50;
        
        // Calculate resources count (static for now, can be made dynamic)
        const resourcesCount = 2;
        
        const responseData = {
            success: true,
            data: {
                daysActive: stats?.days_active || 0,
                moodEntries: stats?.total_mood_entries || 0,
                journalEntries: stats?.total_journal_entries || 0,
                resources: resourcesCount,
                wellnessScore: wellnessScore,
                currentStreak: currentStreak,
                longestStreak: longestStreak,
                recentMoods: recentMoods.map(mood => ({
                    value: mood.mood_value,
                    label: mood.mood_label,
                    date: mood.created_at,
                    notes: mood.notes
                })),
                recentJournals: recentJournals.map(journal => ({
                    id: journal.id,
                    title: journal.title,
                    content: journal.content.substring(0, 100) + '...',
                    mood: journal.mood_rating,
                    date: journal.created_at
                }))
            }
        };
        
        console.log('📊 Sending dashboard data:', responseData.data);
        res.json(responseData);
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// POST /api/mood-entry - Save mood entry with incremental wellness score
app.post('/api/mood-entry', authenticateUser, (req, res) => {
    try {
        const { moodValue, moodLabel, notes } = req.body;
        const userId = req.user.id;
        
        console.log(`🎭 Mood entry for user ${userId}: ${moodLabel} (${moodValue})`);
        
        if (!moodValue || !moodLabel) {
            return res.status(400).json({ error: 'Mood value and label are required' });
        }
        
        // Validate mood value
        if (moodValue < 1 || moodValue > 5) {
            return res.status(400).json({ error: 'Mood value must be between 1 and 5' });
        }
        
        // Save mood entry
        const result = dbHelpers.createMoodEntry(userId, moodValue, moodLabel, notes || null);
        
        // Calculate wellness score change based on mood
        let wellnessChange = 0;
        switch (parseInt(moodValue)) {
            case 1: // Awful
                wellnessChange = -2;
                break;
            case 2: // Down
                wellnessChange = -1;
                break;
            case 3: // Neutral
                wellnessChange = 0;
                break;
            case 4: // Good
                wellnessChange = +1;
                break;
            case 5: // Great
                wellnessChange = +2;
                break;
        }
        
        // Update the user's wellness score incrementally
        const newWellnessScore = dbHelpers.updateWellnessScore(userId, wellnessChange);
        
        // Update user stats
        dbHelpers.updateUserStats(userId);
        
        console.log(`🎭 Mood: ${moodLabel} (${moodValue}) | Wellness Change: ${wellnessChange > 0 ? '+' : ''}${wellnessChange} | New Score: ${newWellnessScore}`);
        
        res.json({ 
            success: true, 
            message: 'Mood entry saved successfully',
            entryId: result.lastInsertRowid,
            wellnessChange: wellnessChange,
            newWellnessScore: newWellnessScore
        });
    } catch (error) {
        console.error('Mood entry error:', error);
        res.status(500).json({ error: 'Failed to save mood entry' });
    }
});

// GET /api/profile - Get user profile
app.get('/api/profile', authenticateUser, (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                bio: user.bio,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                location: user.location,
                profilePicture: user.profile_picture,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /api/profile - Update user profile
app.put('/api/profile', authenticateUser, (req, res) => {
    try {
        const { name, bio, phone, firstName, lastName, dateOfBirth, gender, location } = req.body;
        const userId = req.user.id;
        
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (phone !== undefined) updates.phone = phone;
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
        if (gender !== undefined) updates.gender = gender;
        if (location !== undefined) updates.location = location;
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        const result = dbHelpers.updateUserProfile(userId, updates);
        
        if (result.success) {
            res.json({ success: true, message: 'Profile updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST /api/logout - Logout user
app.post('/api/logout', authenticateUser, (req, res) => {
    try {
        dbHelpers.deleteSession(req.sessionToken);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// POST /api/predict-mood - Predict mood based on input
app.post('/api/predict-mood', (req, res) => {
    try {
        const { journalEntry, recentMoods, sleepHours, stressLevel, currentConditions } = req.body;
        
        // Enhanced prediction with more context
        const predictionInput = {
            journalEntry: journalEntry || '',
            recentMoods: recentMoods || [],
            sleepHours: sleepHours || 7,
            stressLevel: stressLevel || 3,
            ...currentConditions
        };

        // Get basic prediction
        const prediction = moodPredictor.predictMood(predictionInput, recentMoods?.[0] || 3);
        
        // Add sentiment analysis of journal entry if provided
        let sentimentInfluence = null;
        if (journalEntry && journalEntry.trim().length > 0) {
            const sentiment = sentimentAnalyzer.analyzeSentiment(journalEntry);
            sentimentInfluence = sentiment;
            
            // Adjust prediction based on sentiment
            if (sentiment.classification === 'positive' && sentiment.confidence > 0.6) {
                prediction.predictedMood = Math.min(5, prediction.predictedMood + 1);
                prediction.reasoning.push('Positive sentiment in journal entry');
            } else if (sentiment.classification === 'negative' && sentiment.confidence > 0.6) {
                prediction.predictedMood = Math.max(1, prediction.predictedMood - 1);
                prediction.reasoning.push('Negative sentiment detected in writing');
            }
        }

        // Generate comprehensive recommendations
        const recommendations = moodPredictor.getMoodRecommendations(
            prediction.predictedMood, 
            predictionInput, 
            prediction.reasoning
        );

        // Add contextual insights
        const insights = [];
        
        if (sleepHours < 6) {
            insights.push({
                type: 'warning',
                message: 'Low sleep hours detected. This significantly impacts mood and cognitive function.',
                suggestion: 'Prioritize getting 7-9 hours of sleep tonight.'
            });
        }
        
        if (stressLevel > 7) {
            insights.push({
                type: 'concern',
                message: 'High stress levels can negatively impact your mood and wellbeing.',
                suggestion: 'Consider stress-reduction techniques like deep breathing or meditation.'
            });
        }

        const currentHour = new Date().getHours();
        if (currentHour < 10) {
            insights.push({
                type: 'tip',
                message: 'Morning is a great time to set positive intentions for the day.',
                suggestion: 'Try starting with gratitude or light exercise to boost your mood.'
            });
        }

        res.json({
            success: true,
            prediction: {
                ...prediction,
                sentimentInfluence,
                recommendations,
                insights,
                analysisTimestamp: new Date().toISOString(),
                factors: {
                    sleepHours,
                    stressLevel,
                    timeOfDay: currentHour,
                    hasJournalEntry: !!(journalEntry && journalEntry.trim().length > 0)
                }
            }
        });
    } catch (error) {
        console.error('Mood prediction error:', error);
        res.status(500).json({ error: 'Failed to predict mood' });
    }
});

// Helper function to calculate current mood streak
function calculateMoodStreak(moodEntries) {
    if (moodEntries.length === 0) return 0;
    
    // Sort entries by date (newest first)
    const sortedEntries = moodEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Get unique dates (one entry per day)
    const uniqueDates = [];
    const seenDates = new Set();
    
    for (const entry of sortedEntries) {
        const dateStr = new Date(entry.created_at).toDateString();
        if (!seenDates.has(dateStr)) {
            seenDates.add(dateStr);
            uniqueDates.push(new Date(entry.created_at));
        }
    }
    
    if (uniqueDates.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if the most recent entry is from today or yesterday
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    const daysSinceLastEntry = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));
    
    // If last entry is more than 1 day ago, streak is broken
    if (daysSinceLastEntry > 1) {
        return 0;
    }
    
    // Count consecutive days
    for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i-1]);
        const prevDate = new Date(uniqueDates[i]);
        currentDate.setHours(0, 0, 0, 0);
        prevDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Helper function to calculate longest streak
function calculateLongestStreak(moodEntries) {
    if (moodEntries.length === 0) return 0;
    
    // Sort entries by date (oldest first)
    const sortedEntries = moodEntries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Get unique dates (one entry per day)
    const uniqueDates = [];
    const seenDates = new Set();
    
    for (const entry of sortedEntries) {
        const dateStr = new Date(entry.created_at).toDateString();
        if (!seenDates.has(dateStr)) {
            seenDates.add(dateStr);
            uniqueDates.push(new Date(entry.created_at));
        }
    }
    
    if (uniqueDates.length === 0) return 0;
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i-1]);
        currentDate.setHours(0, 0, 0, 0);
        prevDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    return longestStreak;
}

// POST /api/chat - Real-time AI chat with Gemini
app.post('/api/chat', async (req, res) => {
    const { message, userEmail } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // First, analyze sentiment of the user's message
        const sentimentAnalysis = sentimentAnalyzer.analyzeSentiment(message);
        
        // Create context-aware prompt for mental health support
        const systemPrompt = `You are a supportive mental health chatbot. Respond with exactly 2-3 helpful sentences (about 50-100 words).

User: "${message}"

Helpful response (2-3 sentences only):`;

        // Call Gemini API
        const geminiResponse = await callGeminiAPI(systemPrompt);
        
        // Log the interaction for analytics
        console.log(`AI Chat - User: ${userEmail || 'anonymous'}, Sentiment: ${sentimentAnalysis.classification}, Response length: ${geminiResponse.length}`);

        res.json({
            success: true,
            response: geminiResponse,
            sentiment: {
                classification: sentimentAnalysis.classification,
                confidence: sentimentAnalysis.confidence,
                score: sentimentAnalysis.score
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in AI chat:', error);
        
        // Fallback to local responses if Gemini fails
        const fallbackResponse = getFallbackResponse(message);
        
        res.json({
            success: true,
            response: fallbackResponse,
            sentiment: {
                classification: 'neutral',
                confidence: 0.5,
                score: 0
            },
            fallback: true,
            timestamp: new Date().toISOString()
        });
    }
});

// Function to call Gemini API
async function callGeminiAPI(prompt) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('🔧 Gemini API Debug:');
        console.log('API Key exists:', !!apiKey);
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
        
        if (!apiKey) {
            reject(new Error('Gemini API key not configured'));
            return;
        }

        const data = JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    
                    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                        const aiResponse = response.candidates[0].content.parts[0].text;
                        resolve(aiResponse);
                    } else if (response.error) {
                        reject(new Error(`Gemini API error: ${response.error.message}`));
                    } else {
                        reject(new Error('Unexpected response format from Gemini API'));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse Gemini response: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.write(data);
        req.end();
    });
}

// Fallback responses when Gemini API is unavailable
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    const fallbackResponses = {
        anxiety: [
            "I understand you're feeling anxious. Try taking slow, deep breaths - in for 4 counts, hold for 4, out for 6. You're safe right now. 💙",
            "Anxiety can feel overwhelming, but remember it's temporary. Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. 🌸"
        ],
        sad: [
            "I'm sorry you're feeling this way. Your feelings are valid, and it's okay to not be okay sometimes. Would it help to talk about what's bothering you? 🫂",
            "Sadness is a natural part of being human. Be gentle with yourself today. Sometimes we need to sit with difficult feelings before they pass. 💛"
        ],
        happy: [
            "I'm so glad to hear you're feeling good! What's bringing you joy today? It's wonderful to celebrate these positive moments. ✨",
            "Your happiness is contagious! It's beautiful when we can appreciate the good things in life. What's been the highlight of your day? 🌟"
        ],
        stress: [
            "Stress can feel heavy, but you're stronger than you know. Try breaking down what's overwhelming you into smaller, manageable pieces. What's one small thing you can tackle right now? 🌿",
            "When everything feels urgent, take a step back. Breathe deeply and ask yourself: what truly needs my attention right now? You've got this. 💪"
        ],
        default: [
            "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling about everything right now? 💙",
            "I appreciate you opening up. Sometimes it helps just to have someone hear what we're going through. What would be most helpful for you today? 🌟",
            "That sounds important to you. I'm here to support you through whatever you're experiencing. What's on your mind? 💭"
        ]
    };

    // Determine response category
    let category = 'default';
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
        category = 'anxiety';
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
        category = 'sad';
    } else if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('good')) {
        category = 'happy';
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('pressure')) {
        category = 'stress';
    }

    const responses = fallbackResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
}

// 404 handler for undefined routes
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    
    // If it's an API request, return JSON
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API endpoint not found',
            path: req.originalUrl,
            method: req.method
        });
    }
    
    // For HTML requests, redirect to login
    res.redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // If it's an API request, return JSON error
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(500).json({ 
            error: 'Internal server error',
            message: err.message
        });
    }
    
    // For HTML requests, show error page
    res.status(500).send(`
        <html>
            <head><title>Server Error</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>🚨 Server Error</h1>
                <p>Something went wrong. Please try again later.</p>
                <a href="/" style="color: #76c7c0; text-decoration: none;">← Back to Login</a>
            </body>
        </html>
    `);
});

// Initialize and start server
if (initializeDatabase()) {
    app.listen(PORT, () => {
        console.log(`🚀 Mind Ease server is running on http://localhost:${PORT}`);
        console.log(`Available endpoints:`);
        console.log(`- GET  /                 - Login page`);
        console.log(`- GET  /signup           - Signup page`);
        console.log(`- GET  /dashboard        - Dashboard page`);
        console.log(`- POST /api/signup       - User registration`);
        console.log(`- POST /api/login        - User login`);
        console.log(`- GET  /api/verify-email - Email verification`);
        console.log(`- GET  /api/dashboard-data - Real-time dashboard data`);
        console.log(`- POST /api/mood-entry   - Save mood entry`);
        console.log(`- GET  /api/profile      - Get user profile`);
        console.log(`- PUT  /api/profile      - Update user profile`);
        console.log(`- POST /api/logout       - Logout user`);
        console.log(`- POST /api/chat         - AI chat`);
    });
} else {
    console.error('Failed to start server due to database initialization error');
    process.exit(1);
}

