const fs = require('fs');
const path = require('path');

// Simple JSON-based database
const dbPath = path.join(__dirname, 'data');
const usersFile = path.join(dbPath, 'users.json');
const journalFile = path.join(dbPath, 'journal.json');
const moodFile = path.join(dbPath, 'moods.json');
const sessionsFile = path.join(dbPath, 'sessions.json');
const statsFile = path.join(dbPath, 'stats.json');
const profilesFile = path.join(dbPath, 'profiles.json');
const achievementsFile = path.join(dbPath, 'achievements.json');

// Ensure data directory exists
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
}

// Initialize database files
function initializeDatabase() {
    try {
        // Initialize users file
        if (!fs.existsSync(usersFile)) {
            fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
        }

        // Initialize journal file
        if (!fs.existsSync(journalFile)) {
            fs.writeFileSync(journalFile, JSON.stringify([], null, 2));
        }

        // Initialize mood file
        if (!fs.existsSync(moodFile)) {
            fs.writeFileSync(moodFile, JSON.stringify([], null, 2));
        }

        // Initialize sessions file
        if (!fs.existsSync(sessionsFile)) {
            fs.writeFileSync(sessionsFile, JSON.stringify([], null, 2));
        }

        // Initialize stats file
        if (!fs.existsSync(statsFile)) {
            fs.writeFileSync(statsFile, JSON.stringify([], null, 2));
        }

        // Initialize profiles file
        if (!fs.existsSync(profilesFile)) {
            fs.writeFileSync(profilesFile, JSON.stringify([], null, 2));
        }

        // Initialize achievements file
        if (!fs.existsSync(achievementsFile)) {
            fs.writeFileSync(achievementsFile, JSON.stringify([], null, 2));
        }

        console.log('✅ JSON Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

// Helper functions to read/write JSON files
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Database helper functions
const dbHelpers = {
    // User operations
    createUser: (email, password, name = null) => {
        const users = readJsonFile(usersFile);
        const newUser = {
            id: Date.now(),
            email,
            password,
            name,
            created_at: new Date().toISOString(),
            last_login: null,
            is_verified: true,
            profile_picture: null,
            bio: null,
            phone: null,
            firstName: null,
            lastName: null,
            dateOfBirth: null,
            gender: null,
            location: null,
            wellness_score: 50 // Start with neutral wellness score
        };
        users.push(newUser);
        writeJsonFile(usersFile, users);
        return { lastInsertRowid: newUser.id };
    },

    getUserByEmail: (email) => {
        const users = readJsonFile(usersFile);
        return users.find(user => user.email === email);
    },

    getUserById: (id) => {
        const users = readJsonFile(usersFile);
        return users.find(user => user.id === parseInt(id));
    },

    updateUserProfile: (userId, updates) => {
        const users = readJsonFile(usersFile);
        const userIndex = users.findIndex(user => user.id === parseInt(userId));
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            writeJsonFile(usersFile, users);
            return { changes: 1 };
        }
        return { changes: 0 };
    },

    // Wellness score operations
    updateWellnessScore: (userId, change) => {
        const users = readJsonFile(usersFile);
        const userIndex = users.findIndex(user => user.id === parseInt(userId));
        if (userIndex !== -1) {
            // Initialize wellness_score if it doesn't exist
            if (users[userIndex].wellness_score === undefined) {
                users[userIndex].wellness_score = 50;
            }
            
            // Apply the change
            users[userIndex].wellness_score += change;
            
            // Keep score within 0-100 range
            users[userIndex].wellness_score = Math.max(0, Math.min(100, users[userIndex].wellness_score));
            
            writeJsonFile(usersFile, users);
            return users[userIndex].wellness_score;
        }
        return null;
    },

    getWellnessScore: (userId) => {
        const users = readJsonFile(usersFile);
        const user = users.find(user => user.id === parseInt(userId));
        if (user) {
            // Initialize wellness_score if it doesn't exist
            if (user.wellness_score === undefined) {
                return 50; // Default score
            }
            return user.wellness_score;
        }
        return 50; // Default score
    },

    // Badge and Achievement operations
    getUserBadges: (userId) => {
        const stats = readJsonFile(statsFile);
        const userStats = stats.find(stat => stat.user_id === parseInt(userId));
        return userStats ? (userStats.badges || []) : [];
    },

    awardBadge: (userId, badgeId) => {
        const stats = readJsonFile(statsFile);
        let userStatsIndex = stats.findIndex(stat => stat.user_id === parseInt(userId));
        
        if (userStatsIndex === -1) {
            // Create new stats entry
            stats.push({
                id: Date.now(),
                user_id: parseInt(userId),
                badges: [badgeId],
                targets: [],
                achievements_unlocked: 1,
                last_updated: new Date().toISOString()
            });
        } else {
            // Update existing stats
            if (!stats[userStatsIndex].badges) {
                stats[userStatsIndex].badges = [];
            }
            
            if (!stats[userStatsIndex].badges.includes(badgeId)) {
                stats[userStatsIndex].badges.push(badgeId);
                stats[userStatsIndex].achievements_unlocked = (stats[userStatsIndex].achievements_unlocked || 0) + 1;
                stats[userStatsIndex].last_updated = new Date().toISOString();
            }
        }
        
        writeJsonFile(statsFile, stats);
        return { success: true };
    },

    getUserTargets: (userId) => {
        const stats = readJsonFile(statsFile);
        const userStats = stats.find(stat => stat.user_id === parseInt(userId));
        return userStats ? (userStats.targets || []) : [];
    },

    updateUserTarget: (userId, targetId, progress) => {
        const stats = readJsonFile(statsFile);
        let userStatsIndex = stats.findIndex(stat => stat.user_id === parseInt(userId));
        
        if (userStatsIndex === -1) {
            // Create new stats entry
            stats.push({
                id: Date.now(),
                user_id: parseInt(userId),
                badges: [],
                targets: [{ id: targetId, progress: progress, updated_at: new Date().toISOString() }],
                last_updated: new Date().toISOString()
            });
        } else {
            // Update existing stats
            if (!stats[userStatsIndex].targets) {
                stats[userStatsIndex].targets = [];
            }
            
            const targetIndex = stats[userStatsIndex].targets.findIndex(t => t.id === targetId);
            if (targetIndex !== -1) {
                stats[userStatsIndex].targets[targetIndex].progress = progress;
                stats[userStatsIndex].targets[targetIndex].updated_at = new Date().toISOString();
            } else {
                stats[userStatsIndex].targets.push({
                    id: targetId,
                    progress: progress,
                    updated_at: new Date().toISOString()
                });
            }
            
            stats[userStatsIndex].last_updated = new Date().toISOString();
        }
        
        writeJsonFile(statsFile, stats);
        return { success: true };
    },

    // Enhanced user profile operations
    getUserProfile: (userId) => {
        const users = readJsonFile(usersFile);
        const user = users.find(user => user.id === parseInt(userId));
        if (user) {
            // Calculate additional profile data
            const moodEntries = dbHelpers.getUserMoodEntries(userId, 1000);
            const journalEntries = dbHelpers.getUserJournalEntries(userId, 1000);
            const badges = dbHelpers.getUserBadges(userId);
            
            // Calculate level based on activity
            const totalEntries = moodEntries.length + journalEntries.length;
            const level = Math.floor(totalEntries / 10) + 1;
            
            // Calculate days active
            const allDates = [
                ...moodEntries.map(m => m.created_at.split('T')[0]),
                ...journalEntries.map(j => j.created_at.split('T')[0])
            ];
            const uniqueDates = [...new Set(allDates)];
            const daysActive = uniqueDates.length;
            
            return {
                ...user,
                level: level,
                daysActive: daysActive,
                totalEntries: totalEntries,
                badges: badges,
                joinedDaysAgo: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
            };
        }
        return null;
    },

    // User achievements system
    getUserAchievements: (userId) => {
        const achievements = readJsonFile(achievementsFile);
        return achievements.filter(achievement => achievement.user_id === parseInt(userId));
    },

    addUserAchievement: (userId, achievementId, achievementData) => {
        const achievements = readJsonFile(achievementsFile);
        
        // Check if achievement already exists
        const existingAchievement = achievements.find(
            a => a.user_id === parseInt(userId) && a.achievement_id === achievementId
        );
        
        if (!existingAchievement) {
            const newAchievement = {
                id: Date.now(),
                user_id: parseInt(userId),
                achievement_id: achievementId,
                title: achievementData.title,
                description: achievementData.description,
                earned_at: new Date().toISOString(),
                ...achievementData
            };
            
            achievements.push(newAchievement);
            writeJsonFile(achievementsFile, achievements);
            return { success: true, achievement: newAchievement };
        }
        
        return { success: false, message: 'Achievement already earned' };
    },

    // Enhanced profile management
    updateUserProfile: (userId, profileData) => {
        const users = readJsonFile(usersFile);
        const userIndex = users.findIndex(user => user.id === parseInt(userId));
        
        if (userIndex !== -1) {
            // Update user data
            users[userIndex] = { 
                ...users[userIndex], 
                ...profileData,
                updated_at: new Date().toISOString()
            };
            
            writeJsonFile(usersFile, users);
            
            // Also update or create profile entry
            const profiles = readJsonFile(profilesFile);
            let profileIndex = profiles.findIndex(profile => profile.user_id === parseInt(userId));
            
            if (profileIndex === -1) {
                // Create new profile
                profiles.push({
                    id: Date.now(),
                    user_id: parseInt(userId),
                    ...profileData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            } else {
                // Update existing profile
                profiles[profileIndex] = {
                    ...profiles[profileIndex],
                    ...profileData,
                    updated_at: new Date().toISOString()
                };
            }
            
            writeJsonFile(profilesFile, profiles);
            return { success: true };
        }
        
        return { success: false, message: 'User not found' };
    },

    // Get detailed profile with all data
    getDetailedProfile: (userId) => {
        const user = dbHelpers.getUserProfile(userId);
        if (!user) return null;
        
        const achievements = dbHelpers.getUserAchievements(userId);
        const moodEntries = dbHelpers.getUserMoodEntries(userId, 1000);
        const journalEntries = dbHelpers.getUserJournalEntries(userId, 1000);
        
        // Calculate additional stats
        const positiveMoods = moodEntries.filter(entry => entry.mood_value >= 4).length;
        const averageMood = moodEntries.length > 0 
            ? moodEntries.reduce((sum, entry) => sum + entry.mood_value, 0) / moodEntries.length 
            : 0;
        
        return {
            ...user,
            achievements: achievements,
            stats: {
                totalMoodEntries: moodEntries.length,
                totalJournalEntries: journalEntries.length,
                positiveMoods: positiveMoods,
                averageMood: Math.round(averageMood * 10) / 10,
                wellnessScore: user.wellness_score || 50
            }
        };
    },

    // Journal operations
    createJournalEntry: (userId, title, content, moodRating, tags = null) => {
        const journals = readJsonFile(journalFile);
        const newEntry = {
            id: Date.now(),
            user_id: parseInt(userId),
            title,
            content,
            mood_rating: moodRating,
            tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        journals.push(newEntry);
        writeJsonFile(journalFile, journals);
        return { lastInsertRowid: newEntry.id };
    },

    getUserJournalEntries: (userId, limit = 10) => {
        const journals = readJsonFile(journalFile);
        return journals
            .filter(entry => entry.user_id === parseInt(userId))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    },

    // Mood operations
    createMoodEntry: (userId, moodValue, moodLabel, notes = null) => {
        const moods = readJsonFile(moodFile);
        const newMood = {
            id: Date.now(),
            user_id: parseInt(userId),
            mood_value: moodValue,
            mood_label: moodLabel,
            notes,
            created_at: new Date().toISOString()
        };
        moods.push(newMood);
        writeJsonFile(moodFile, moods);
        return { lastInsertRowid: newMood.id };
    },

    getUserMoodEntries: (userId, limit = 30) => {
        const moods = readJsonFile(moodFile);
        return moods
            .filter(mood => mood.user_id === parseInt(userId))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    },

    // Statistics operations
    getUserStats: (userId) => {
        const stats = readJsonFile(statsFile);
        return stats.find(stat => stat.user_id === parseInt(userId));
    },

    updateUserStats: (userId) => {
        const journals = readJsonFile(journalFile);
        const moods = readJsonFile(moodFile);
        const stats = readJsonFile(statsFile);

        const userJournals = journals.filter(j => j.user_id === parseInt(userId));
        const userMoods = moods.filter(m => m.user_id === parseInt(userId));

        // Calculate days active
        const allDates = [
            ...userJournals.map(j => j.created_at.split('T')[0]),
            ...userMoods.map(m => m.created_at.split('T')[0])
        ];
        const uniqueDates = [...new Set(allDates)];
        const daysActive = uniqueDates.length;

        // Calculate wellness score
        let wellnessScore = 0;
        if (userMoods.length > 0) {
            const recentMoods = userMoods.slice(0, 10);
            const avgMood = recentMoods.reduce((sum, mood) => sum + mood.mood_value, 0) / recentMoods.length;
            wellnessScore = Math.round((avgMood / 5) * 100);
        }

        const userStats = {
            id: Date.now(),
            user_id: parseInt(userId),
            days_active: daysActive,
            total_mood_entries: userMoods.length,
            total_journal_entries: userJournals.length,
            wellness_score: wellnessScore,
            last_updated: new Date().toISOString()
        };

        // Update or insert stats
        const existingIndex = stats.findIndex(s => s.user_id === parseInt(userId));
        if (existingIndex !== -1) {
            stats[existingIndex] = userStats;
        } else {
            stats.push(userStats);
        }

        writeJsonFile(statsFile, stats);
        return { changes: 1 };
    },

    // Session operations
    createSession: (userId, sessionToken, expiresAt) => {
        const sessions = readJsonFile(sessionsFile);
        const newSession = {
            id: Date.now(),
            user_id: parseInt(userId),
            session_token: sessionToken,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        };
        sessions.push(newSession);
        writeJsonFile(sessionsFile, sessions);
        return { lastInsertRowid: newSession.id };
    },

    getSessionByToken: (sessionToken) => {
        const sessions = readJsonFile(sessionsFile);
        const session = sessions.find(s => s.session_token === sessionToken);
        if (session && new Date(session.expires_at) > new Date()) {
            return session;
        }
        return null;
    },

    deleteSession: (sessionToken) => {
        const sessions = readJsonFile(sessionsFile);
        const filteredSessions = sessions.filter(s => s.session_token !== sessionToken);
        writeJsonFile(sessionsFile, filteredSessions);
        return { changes: sessions.length - filteredSessions.length };
    }
};

module.exports = {
    initializeDatabase,
    dbHelpers
};