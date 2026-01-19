class RecommendationEngine {
    constructor() {
        this.activities = {
            mood_boost: [
                { name: 'Listen to upbeat music', duration: 10, category: 'entertainment', moodImpact: 1.5 },
                { name: 'Take a nature walk', duration: 20, category: 'exercise', moodImpact: 2.0 },
                { name: 'Call a friend', duration: 15, category: 'social', moodImpact: 1.8 },
                { name: 'Practice gratitude journaling', duration: 10, category: 'mindfulness', moodImpact: 1.6 },
                { name: 'Watch funny videos', duration: 15, category: 'entertainment', moodImpact: 1.4 },
                { name: 'Do light stretching', duration: 10, category: 'exercise', moodImpact: 1.3 },
                { name: 'Organize your space', duration: 20, category: 'productivity', moodImpact: 1.2 }
            ],
            stress_relief: [
                { name: 'Deep breathing exercises', duration: 5, category: 'mindfulness', moodImpact: 1.8 },
                { name: 'Progressive muscle relaxation', duration: 15, category: 'mindfulness', moodImpact: 2.0 },
                { name: 'Take a warm bath', duration: 30, category: 'self_care', moodImpact: 1.7 },
                { name: 'Meditation session', duration: 10, category: 'mindfulness', moodImpact: 2.2 },
                { name: 'Gentle yoga', duration: 20, category: 'exercise', moodImpact: 1.9 },
                { name: 'Listen to calming music', duration: 15, category: 'entertainment', moodImpact: 1.5 },
                { name: 'Write in journal', duration: 15, category: 'reflection', moodImpact: 1.6 }
            ],
            energy_boost: [
                { name: 'High-intensity workout', duration: 30, category: 'exercise', moodImpact: 2.5 },
                { name: 'Cold shower', duration: 5, category: 'self_care', moodImpact: 1.8 },
                { name: 'Dance to favorite songs', duration: 15, category: 'entertainment', moodImpact: 2.0 },
                { name: 'Power nap', duration: 20, category: 'rest', moodImpact: 1.5 },
                { name: 'Drink green tea', duration: 5, category: 'nutrition', moodImpact: 1.2 },
                { name: 'Step outside for fresh air', duration: 10, category: 'nature', moodImpact: 1.4 },
                { name: 'Do jumping jacks', duration: 5, category: 'exercise', moodImpact: 1.6 }
            ],
            social_connection: [
                { name: 'Video call with family', duration: 30, category: 'social', moodImpact: 2.2 },
                { name: 'Send a thoughtful message', duration: 5, category: 'social', moodImpact: 1.5 },
                { name: 'Join a community group', duration: 60, category: 'social', moodImpact: 2.0 },
                { name: 'Volunteer for a cause', duration: 120, category: 'social', moodImpact: 2.5 },
                { name: 'Plan a social activity', duration: 15, category: 'social', moodImpact: 1.3 },
                { name: 'Share something positive online', duration: 5, category: 'social', moodImpact: 1.2 },
                { name: 'Compliment someone', duration: 2, category: 'social', moodImpact: 1.4 }
            ],
            creativity: [
                { name: 'Draw or sketch', duration: 30, category: 'creative', moodImpact: 1.8 },
                { name: 'Write creatively', duration: 25, category: 'creative', moodImpact: 1.7 },
                { name: 'Learn a new skill online', duration: 45, category: 'learning', moodImpact: 1.6 },
                { name: 'Cook a new recipe', duration: 60, category: 'creative', moodImpact: 1.9 },
                { name: 'Take artistic photos', duration: 20, category: 'creative', moodImpact: 1.5 },
                { name: 'Play a musical instrument', duration: 30, category: 'creative', moodImpact: 2.0 },
                { name: 'Craft or DIY project', duration: 45, category: 'creative', moodImpact: 1.8 }
            ]
        };

        this.coping_strategies = {
            anxiety: [
                { strategy: '5-4-3-2-1 Grounding Technique', description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste' },
                { strategy: 'Box Breathing', description: 'Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat.' },
                { strategy: 'Progressive Muscle Relaxation', description: 'Tense and release each muscle group from toes to head' },
                { strategy: 'Mindful Observation', description: 'Focus intently on one object for 2-3 minutes' }
            ],
            depression: [
                { strategy: 'Behavioral Activation', description: 'Schedule one small, enjoyable activity each day' },
                { strategy: 'Gratitude Practice', description: 'Write down 3 specific things you\'re grateful for daily' },
                { strategy: 'Social Connection', description: 'Reach out to one person each day, even briefly' },
                { strategy: 'Sunlight Exposure', description: 'Spend 10-15 minutes in natural sunlight daily' }
            ],
            stress: [
                { strategy: 'Time Blocking', description: 'Break tasks into smaller, manageable time blocks' },
                { strategy: 'Priority Matrix', description: 'Categorize tasks by urgency and importance' },
                { strategy: 'Stress Inoculation', description: 'Practice handling small stressors to build resilience' },
                { strategy: 'Boundary Setting', description: 'Learn to say no to non-essential commitments' }
            ]
        };
    }

    // Generate personalized recommendations based on user data
    generateRecommendations(userProfile) {
        const recommendations = {
            immediate: [],
            daily: [],
            weekly: [],
            insights: []
        };

        const { currentMood, moodHistory, journalEntries, preferences, timeAvailable } = userProfile;

        // Immediate recommendations based on current mood
        if (currentMood <= 2) {
            recommendations.immediate = this.getMoodBoostRecommendations(timeAvailable);
            recommendations.insights.push('Your mood seems low today. These activities can help provide an immediate boost.');
        } else if (currentMood >= 4) {
            recommendations.immediate = this.getMaintenanceRecommendations(timeAvailable);
            recommendations.insights.push('You\'re feeling good! These activities can help maintain your positive mood.');
        } else {
            recommendations.immediate = this.getBalancedRecommendations(timeAvailable);
            recommendations.insights.push('You\'re in a neutral space. These activities can help enhance your wellbeing.');
        }

        // Daily recommendations based on patterns
        const patterns = this.analyzeBehaviorPatterns(moodHistory, journalEntries);
        recommendations.daily = this.getDailyRecommendations(patterns, preferences);

        // Weekly recommendations for long-term wellness
        recommendations.weekly = this.getWeeklyRecommendations(patterns, preferences);

        // Add personalized insights
        recommendations.insights.push(...this.generatePersonalizedInsights(patterns, moodHistory));

        return recommendations;
    }

    // Get mood boost recommendations for low mood
    getMoodBoostRecommendations(timeAvailable = 30) {
        const suitable = this.activities.mood_boost.filter(activity => 
            activity.duration <= timeAvailable
        );
        
        return this.selectTopRecommendations(suitable, 3);
    }

    // Get maintenance recommendations for good mood
    getMaintenanceRecommendations(timeAvailable = 30) {
        const energyBoost = this.activities.energy_boost.filter(activity => 
            activity.duration <= timeAvailable
        );
        const creative = this.activities.creativity.filter(activity => 
            activity.duration <= timeAvailable
        );
        
        return this.selectTopRecommendations([...energyBoost, ...creative], 3);
    }

    // Get balanced recommendations for neutral mood
    getBalancedRecommendations(timeAvailable = 30) {
        const allActivities = [
            ...this.activities.mood_boost,
            ...this.activities.stress_relief,
            ...this.activities.social_connection
        ].filter(activity => activity.duration <= timeAvailable);
        
        return this.selectTopRecommendations(allActivities, 3);
    }

    // Select top recommendations based on mood impact and variety
    selectTopRecommendations(activities, count) {
        // Sort by mood impact and select diverse categories
        const sorted = activities.sort((a, b) => b.moodImpact - a.moodImpact);
        const selected = [];
        const usedCategories = new Set();

        for (const activity of sorted) {
            if (selected.length >= count) break;
            
            // Prefer variety in categories
            if (!usedCategories.has(activity.category) || selected.length < count) {
                selected.push(activity);
                usedCategories.add(activity.category);
            }
        }

        return selected;
    }

    // Analyze behavior patterns from historical data
    analyzeBehaviorPatterns(moodHistory, journalEntries) {
        const patterns = {
            moodTrends: this.analyzeMoodTrends(moodHistory),
            journalThemes: this.analyzeJournalThemes(journalEntries),
            timePatterns: this.analyzeTimePatterns(moodHistory),
            stressIndicators: this.analyzeStressIndicators(journalEntries)
        };

        return patterns;
    }

    // Analyze mood trends over time
    analyzeMoodTrends(moodHistory) {
        if (moodHistory.length < 7) return { trend: 'insufficient_data' };

        const recent = moodHistory.slice(-7);
        const older = moodHistory.slice(-14, -7);

        if (older.length === 0) return { trend: 'insufficient_data' };

        const recentAvg = recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, entry) => sum + entry.value, 0) / older.length;

        const difference = recentAvg - olderAvg;

        if (difference > 0.3) return { trend: 'improving', strength: difference };
        if (difference < -0.3) return { trend: 'declining', strength: Math.abs(difference) };
        return { trend: 'stable', strength: 0 };
    }

    // Analyze common themes in journal entries
    analyzeJournalThemes(journalEntries) {
        if (!journalEntries || journalEntries.length === 0) return {};

        const themes = {
            stress: 0,
            social: 0,
            work: 0,
            health: 0,
            relationships: 0,
            achievement: 0
        };

        const keywords = {
            stress: ['stress', 'overwhelmed', 'pressure', 'anxious', 'worried', 'deadline'],
            social: ['friends', 'family', 'social', 'party', 'gathering', 'lonely', 'isolated'],
            work: ['work', 'job', 'career', 'boss', 'colleague', 'project', 'meeting'],
            health: ['exercise', 'workout', 'tired', 'sick', 'healthy', 'energy'],
            relationships: ['relationship', 'partner', 'love', 'dating', 'marriage', 'conflict'],
            achievement: ['accomplished', 'proud', 'success', 'goal', 'achievement', 'progress']
        };

        journalEntries.forEach(entry => {
            // Handle both 'content' and 'entry' field names for compatibility
            const content = (entry.content || entry.entry || '').toLowerCase();
            
            Object.keys(keywords).forEach(theme => {
                const count = keywords[theme].reduce((sum, keyword) => {
                    return sum + (content.split(keyword).length - 1);
                }, 0);
                themes[theme] += count;
            });
        });

        // Normalize by number of entries
        Object.keys(themes).forEach(theme => {
            themes[theme] = themes[theme] / journalEntries.length;
        });

        return themes;
    }

    // Analyze time-based patterns
    analyzeTimePatterns(moodHistory) {
        const dayOfWeekMoods = {};
        const hourlyMoods = {};

        moodHistory.forEach(entry => {
            const date = new Date(entry.date);
            const dayOfWeek = date.getDay();
            const hour = date.getHours();

            if (!dayOfWeekMoods[dayOfWeek]) dayOfWeekMoods[dayOfWeek] = [];
            if (!hourlyMoods[hour]) hourlyMoods[hour] = [];

            dayOfWeekMoods[dayOfWeek].push(entry.value);
            hourlyMoods[hour].push(entry.value);
        });

        // Find best and worst times
        const dayAverages = {};
        const hourAverages = {};

        Object.keys(dayOfWeekMoods).forEach(day => {
            dayAverages[day] = dayOfWeekMoods[day].reduce((a, b) => a + b, 0) / dayOfWeekMoods[day].length;
        });

        Object.keys(hourlyMoods).forEach(hour => {
            hourAverages[hour] = hourlyMoods[hour].reduce((a, b) => a + b, 0) / hourlyMoods[hour].length;
        });

        return { dayAverages, hourAverages };
    }

    // Analyze stress indicators in journal entries
    analyzeStressIndicators(journalEntries) {
        if (!journalEntries || journalEntries.length === 0) return { level: 'unknown' };

        const stressKeywords = ['stress', 'overwhelmed', 'pressure', 'anxious', 'deadline', 'busy', 'exhausted'];
        let stressCount = 0;
        let totalEntries = journalEntries.length;

        journalEntries.forEach(entry => {
            // Handle both 'content' and 'entry' field names for compatibility
            const content = (entry.content || entry.entry || '').toLowerCase();
            const hasStress = stressKeywords.some(keyword => content.includes(keyword));
            if (hasStress) stressCount++;
        });

        const stressRatio = stressCount / totalEntries;

        if (stressRatio > 0.6) return { level: 'high', ratio: stressRatio };
        if (stressRatio > 0.3) return { level: 'moderate', ratio: stressRatio };
        return { level: 'low', ratio: stressRatio };
    }

    // Get daily recommendations based on patterns
    getDailyRecommendations(patterns, preferences = {}) {
        const recommendations = [];

        // Based on stress levels
        if (patterns.stressIndicators.level === 'high') {
            recommendations.push({
                type: 'stress_management',
                title: 'Daily Stress Relief',
                activities: this.activities.stress_relief.slice(0, 2),
                reason: 'Your journal entries suggest high stress levels'
            });
        }

        // Based on social patterns
        if (patterns.journalThemes.social < 0.1) {
            recommendations.push({
                type: 'social_connection',
                title: 'Social Wellness',
                activities: this.activities.social_connection.slice(0, 2),
                reason: 'Consider adding more social connections to your routine'
            });
        }

        // Based on mood trends
        if (patterns.moodTrends.trend === 'declining') {
            recommendations.push({
                type: 'mood_support',
                title: 'Mood Enhancement',
                activities: this.activities.mood_boost.slice(0, 2),
                reason: 'Your mood has been declining recently'
            });
        }

        return recommendations;
    }

    // Get weekly recommendations for long-term wellness
    getWeeklyRecommendations(patterns, preferences = {}) {
        const recommendations = [];

        // Weekly exercise goal
        recommendations.push({
            type: 'exercise',
            title: 'Weekly Movement Goal',
            goal: 'Aim for 150 minutes of moderate exercise this week',
            activities: [
                { name: '30-minute walks', frequency: '5 times this week' },
                { name: 'Yoga or stretching', frequency: '3 times this week' },
                { name: 'Strength training', frequency: '2 times this week' }
            ]
        });

        // Weekly mindfulness goal
        recommendations.push({
            type: 'mindfulness',
            title: 'Mindfulness Practice',
            goal: 'Practice mindfulness for 70 minutes this week',
            activities: [
                { name: 'Daily meditation', frequency: '10 minutes daily' },
                { name: 'Gratitude journaling', frequency: '3 times this week' },
                { name: 'Mindful eating', frequency: '1 meal daily' }
            ]
        });

        // Weekly social goal
        recommendations.push({
            type: 'social',
            title: 'Social Connection',
            goal: 'Nurture relationships and build connections',
            activities: [
                { name: 'Quality time with loved ones', frequency: '2-3 times this week' },
                { name: 'Reach out to old friends', frequency: '1 time this week' },
                { name: 'Join a community activity', frequency: '1 time this week' }
            ]
        });

        return recommendations;
    }

    // Generate personalized insights
    generatePersonalizedInsights(patterns, moodHistory) {
        const insights = [];

        // Mood trend insights
        if (patterns.moodTrends.trend === 'improving') {
            insights.push('Great news! Your mood has been improving over the past week. Keep up the positive habits!');
        } else if (patterns.moodTrends.trend === 'declining') {
            insights.push('Your mood has been declining recently. Consider implementing some stress-relief strategies.');
        }

        // Time pattern insights
        if (patterns.timePatterns.dayAverages && Object.keys(patterns.timePatterns.dayAverages).length > 0) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const bestDay = Object.keys(patterns.timePatterns.dayAverages).reduce((a, b) => 
                patterns.timePatterns.dayAverages[a] > patterns.timePatterns.dayAverages[b] ? a : b
            );
            const worstDay = Object.keys(patterns.timePatterns.dayAverages).reduce((a, b) => 
                patterns.timePatterns.dayAverages[a] < patterns.timePatterns.dayAverages[b] ? a : b
            );

            if (bestDay !== worstDay) {
                insights.push(`Your mood tends to be highest on ${dayNames[bestDay]}s. Consider what makes that day special and try to incorporate those elements into other days.`);
            }
        }

        // Stress insights
        if (patterns.stressIndicators.level === 'high') {
            insights.push('Your journal entries indicate high stress levels. Consider prioritizing stress-management techniques.');
        }

        // Journal theme insights
        if (patterns.journalThemes.achievement > 0.2) {
            insights.push('You frequently write about achievements and progress. This positive focus is great for mental health!');
        }

        return insights;
    }

    // Get coping strategies for specific mental health concerns
    getCopingStrategies(concern) {
        return this.coping_strategies[concern] || [];
    }

    // Get activity suggestions based on available time
    getActivitiesByTime(timeAvailable, moodLevel = 3) {
        let activityPool = [];

        if (moodLevel <= 2) {
            activityPool = [...this.activities.mood_boost, ...this.activities.stress_relief];
        } else if (moodLevel >= 4) {
            activityPool = [...this.activities.energy_boost, ...this.activities.creativity];
        } else {
            activityPool = Object.values(this.activities).flat();
        }

        return activityPool
            .filter(activity => activity.duration <= timeAvailable)
            .sort((a, b) => b.moodImpact - a.moodImpact)
            .slice(0, 5);
    }
}

module.exports = RecommendationEngine;