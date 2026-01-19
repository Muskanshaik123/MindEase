// Simplified Sentiment Analyzer without external dependencies
class SentimentAnalyzer {
    constructor() {
        // Mental health keywords with weights
        this.mentalHealthKeywords = {
            positive: {
                'happy': 2, 'joy': 2, 'excited': 2, 'grateful': 2, 'peaceful': 2,
                'confident': 2, 'hopeful': 2, 'motivated': 2, 'accomplished': 2,
                'loved': 2, 'supported': 2, 'calm': 1.5, 'relaxed': 1.5, 'content': 1.5,
                'optimistic': 2, 'energetic': 1.5, 'fulfilled': 2, 'blessed': 2, 'good': 1,
                'great': 2, 'amazing': 2, 'wonderful': 2, 'fantastic': 2, 'excellent': 2
            },
            negative: {
                'sad': -2, 'depressed': -3, 'anxious': -2, 'worried': -2, 'stressed': -2,
                'overwhelmed': -2, 'lonely': -2, 'hopeless': -3, 'worthless': -3,
                'angry': -2, 'frustrated': -2, 'tired': -1, 'exhausted': -2,
                'scared': -2, 'panic': -3, 'suicidal': -5, 'hurt': -2, 'broken': -2,
                'awful': -3, 'terrible': -3, 'horrible': -3, 'bad': -1, 'upset': -2
            },
            neutral: {
                'okay': 0, 'fine': 0, 'normal': 0, 'usual': 0, 'same': 0, 'alright': 0
            }
        };
    }

    // Simple tokenizer
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    // Analyze sentiment of text with mental health context
    analyzeSentiment(text) {
        if (!text || text.trim().length === 0) {
            return {
                score: 0,
                comparative: 0,
                classification: 'neutral',
                confidence: 0,
                mentalHealthScore: 0,
                keywords: [],
                insights: []
            };
        }

        const words = this.tokenize(text);
        let score = 0;
        const foundKeywords = [];

        // Analyze each word
        words.forEach(word => {
            if (this.mentalHealthKeywords.positive[word]) {
                const weight = this.mentalHealthKeywords.positive[word];
                score += weight;
                foundKeywords.push({ word, type: 'positive', weight });
            } else if (this.mentalHealthKeywords.negative[word]) {
                const weight = this.mentalHealthKeywords.negative[word];
                score += weight;
                foundKeywords.push({ word, type: 'negative', weight });
            } else if (this.mentalHealthKeywords.neutral[word]) {
                foundKeywords.push({ word, type: 'neutral', weight: 0 });
            }
        });

        // Calculate comparative score
        const comparative = words.length > 0 ? score / words.length : 0;
        
        // Classification
        let classification = 'neutral';
        let confidence = 0;
        
        if (comparative > 0.1) {
            classification = 'positive';
            confidence = Math.min(comparative * 5, 1);
        } else if (comparative < -0.1) {
            classification = 'negative';
            confidence = Math.min(Math.abs(comparative) * 5, 1);
        } else {
            confidence = 1 - Math.abs(comparative) * 2;
        }

        // Generate insights
        const insights = this.generateInsights(text, classification, foundKeywords);

        return {
            score,
            comparative,
            classification,
            confidence: Math.max(0, Math.min(1, confidence)),
            mentalHealthScore: score,
            keywords: foundKeywords,
            insights
        };
    }

    // Generate insights based on analysis
    generateInsights(text, classification, keywords) {
        const insights = [];

        // Check for emotional patterns
        if (keywords.some(k => k.type === 'negative' && k.weight <= -2)) {
            insights.push({
                type: 'concern',
                message: 'Your entry contains words that suggest you might be experiencing some difficult emotions. Consider reaching out to someone you trust.',
                severity: 'medium'
            });
        }

        // Check for positive patterns
        if (keywords.some(k => k.type === 'positive' && k.weight >= 2)) {
            insights.push({
                type: 'positive',
                message: 'Great to see positive emotions in your writing! This suggests good mental wellness.',
                severity: 'low'
            });
        }

        // Check for stress indicators
        const stressWords = ['stress', 'overwhelmed', 'pressure', 'deadline', 'busy'];
        if (stressWords.some(word => text.toLowerCase().includes(word))) {
            insights.push({
                type: 'suggestion',
                message: 'You mentioned feeling stressed. Try some deep breathing exercises or take a short break.',
                severity: 'medium'
            });
        }

        // Check for social connections
        const socialWords = ['friend', 'family', 'talk', 'support', 'help'];
        if (socialWords.some(word => text.toLowerCase().includes(word))) {
            insights.push({
                type: 'positive',
                message: 'Mentioning social connections is great for mental health. Keep nurturing these relationships.',
                severity: 'low'
            });
        }

        return insights;
    }

    // Analyze mood trend over time
    analyzeMoodTrend(journalEntries) {
        if (!journalEntries || journalEntries.length < 2) {
            return {
                trend: 'insufficient_data',
                direction: 'stable',
                confidence: 0,
                recommendation: 'Keep journaling to track your mood patterns over time.'
            };
        }

        const sentiments = journalEntries.map(entry => ({
            date: new Date(entry.date),
            sentiment: this.analyzeSentiment(entry.entry || ''),
            mood: entry.mood
        }));

        // Sort by date
        sentiments.sort((a, b) => a.date - b.date);

        // Calculate trend
        const recentEntries = sentiments.slice(-7); // Last 7 entries
        const scores = recentEntries.map(s => s.sentiment.comparative);
        
        let trend = 'stable';
        let direction = 'stable';
        
        if (scores.length >= 3) {
            const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
            const secondHalf = scores.slice(Math.floor(scores.length / 2));
            
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            const difference = secondAvg - firstAvg;
            
            if (difference > 0.1) {
                trend = 'improving';
                direction = 'up';
            } else if (difference < -0.1) {
                trend = 'declining';
                direction = 'down';
            }
        }

        // Generate recommendation
        let recommendation = '';
        switch (trend) {
            case 'improving':
                recommendation = 'Your mood seems to be improving! Keep up the positive habits that are working for you.';
                break;
            case 'declining':
                recommendation = 'Your mood appears to be declining. Consider talking to someone or trying stress-reduction techniques.';
                break;
            default:
                recommendation = 'Your mood appears stable. Continue monitoring and practicing self-care.';
        }

        return {
            trend,
            direction,
            confidence: Math.min(scores.length / 7, 1),
            recommendation,
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            entryCount: sentiments.length
        };
    }
}

module.exports = SentimentAnalyzer;