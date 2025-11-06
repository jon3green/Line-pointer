/**
 * Social Sentiment Analysis Service
 * Analyzes Twitter/Reddit sentiment around games and teams
 */

export type SentimentData = {
  gameId: string;
  overall: {
    score: number; // -100 to +100 (-100 very negative, +100 very positive)
    sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    volume: number; // Number of mentions
    trending: boolean;
  };
  homeBias: {
    score: number; // Percentage favoring home team (0-100)
    volume: number;
  };
  awayBias: {
    score: number; // Percentage favoring away team (0-100)
    volume: number;
  };
  topics: TrendingTopic[];
  recentPosts: SocialPost[];
  updatedAt: string;
};

export type TrendingTopic = {
  keyword: string;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
};

export type SocialPost = {
  id: string;
  source: 'twitter' | 'reddit';
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  timestamp: string;
  url?: string;
};

export type TeamSentiment = {
  teamName: string;
  sport: string;
  overall: {
    score: number;
    sentiment: string;
    volume: number;
  };
  trending: {
    topics: string[];
    momentum: 'rising' | 'falling' | 'stable';
  };
  publicOpinion: {
    positive: number; // Percentage
    neutral: number;
    negative: number;
  };
};

class SentimentService {
  private readonly SENTIMENT_CACHE_KEY = 'sentiment_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get sentiment analysis for a game
   */
  getGameSentiment(gameId: string): SentimentData | null {
    try {
      const cached = this.getCachedSentiment(gameId);
      if (cached) return cached;

      // Generate mock sentiment data
      return this.generateMockSentiment(gameId);
    } catch {
      return null;
    }
  }

  /**
   * Get team sentiment
   */
  getTeamSentiment(teamName: string, sport: string): TeamSentiment {
    // Generate mock team sentiment
    const score = Math.random() * 200 - 100; // -100 to +100

    return {
      teamName,
      sport,
      overall: {
        score,
        sentiment: this.getSentimentLabel(score),
        volume: Math.floor(Math.random() * 10000) + 1000
      },
      trending: {
        topics: this.generateTrendingTopics(teamName),
        momentum: Math.random() > 0.6 ? 'rising' : Math.random() > 0.3 ? 'stable' : 'falling'
      },
      publicOpinion: {
        positive: Math.floor(Math.random() * 40) + 30,
        neutral: Math.floor(Math.random() * 30) + 20,
        negative: Math.floor(Math.random() * 30) + 10
      }
    };
  }

  /**
   * Search social media mentions
   */
  searchMentions(query: string, limit: number = 20): SocialPost[] {
    return this.generateMockPosts(query, limit);
  }

  /**
   * Get trending topics across all games
   */
  getTrendingTopics(limit: number = 10): TrendingTopic[] {
    const topics = [
      'Injury Report',
      'Weather Impact',
      'Coaching Decision',
      'Star Player',
      'Playoff Implications',
      'Home Field Advantage',
      'Rivalry Game',
      'Upset Alert',
      'Line Movement',
      'Sharp Money'
    ];

    return topics.slice(0, limit).map(keyword => ({
      keyword,
      mentions: Math.floor(Math.random() * 5000) + 500,
      sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.25 ? 'neutral' : 'negative',
      impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
    }));
  }

  /**
   * Analyze sentiment from text
   */
  analyzeSentiment(text: string): { score: number; sentiment: string } {
    // Simple keyword-based sentiment analysis (in production, use ML model)
    const positiveWords = ['win', 'great', 'love', 'best', 'excellent', 'amazing', 'dominant', 'strong'];
    const negativeWords = ['loss', 'bad', 'hate', 'worst', 'terrible', 'awful', 'weak', 'injured'];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 10;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 10;
    });

    return {
      score,
      sentiment: this.getSentimentLabel(score)
    };
  }

  // Helper methods

  private getCachedSentiment(gameId: string): SentimentData | null {
    try {
      const cache = localStorage.getItem(`${this.SENTIMENT_CACHE_KEY}_${gameId}`);
      if (!cache) return null;

      const data: SentimentData = JSON.parse(cache);
      const age = Date.now() - new Date(data.updatedAt).getTime();

      if (age > this.CACHE_DURATION) {
        localStorage.removeItem(`${this.SENTIMENT_CACHE_KEY}_${gameId}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private cacheSentiment(data: SentimentData): void {
    try {
      localStorage.setItem(
        `${this.SENTIMENT_CACHE_KEY}_${data.gameId}`,
        JSON.stringify(data)
      );
    } catch {
      // Ignore cache errors
    }
  }

  private generateMockSentiment(gameId: string): SentimentData {
    const overallScore = Math.random() * 200 - 100; // -100 to +100
    const homeScore = Math.random() * 100;
    const awayScore = 100 - homeScore;
    const volume = Math.floor(Math.random() * 50000) + 5000;

    const data: SentimentData = {
      gameId,
      overall: {
        score: overallScore,
        sentiment: this.getSentimentLabel(overallScore),
        volume,
        trending: Math.random() > 0.7
      },
      homeBias: {
        score: homeScore,
        volume: Math.floor(volume * (homeScore / 100))
      },
      awayBias: {
        score: awayScore,
        volume: Math.floor(volume * (awayScore / 100))
      },
      topics: this.generateTopics(),
      recentPosts: this.generateMockPosts(gameId, 5),
      updatedAt: new Date().toISOString()
    };

    this.cacheSentiment(data);
    return data;
  }

  private getSentimentLabel(score: number): 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive' {
    if (score >= 50) return 'very_positive';
    if (score >= 20) return 'positive';
    if (score >= -20) return 'neutral';
    if (score >= -50) return 'negative';
    return 'very_negative';
  }

  private generateTopics(): TrendingTopic[] {
    const topics = [
      { keyword: 'Injury Update', sentiment: 'negative' as const, impact: 'high' as const },
      { keyword: 'Weather Concerns', sentiment: 'neutral' as const, impact: 'medium' as const },
      { keyword: 'Momentum Shift', sentiment: 'positive' as const, impact: 'high' as const },
      { keyword: 'Coach Comments', sentiment: 'neutral' as const, impact: 'low' as const },
      { keyword: 'Star Player', sentiment: 'positive' as const, impact: 'high' as const }
    ];

    return topics.map(topic => ({
      ...topic,
      mentions: Math.floor(Math.random() * 3000) + 200
    }));
  }

  private generateMockPosts(context: string, count: number): SocialPost[] {
    const templates = [
      { content: 'This team is looking dominant today! #NFL', sentiment: 'positive' as const },
      { content: 'Not sure about this matchup, feels like a trap game', sentiment: 'neutral' as const },
      { content: 'Injury news is really concerning for this game', sentiment: 'negative' as const },
      { content: 'Love the value on this line, smashing it!', sentiment: 'positive' as const },
      { content: 'Public is all over one side, fade opportunity?', sentiment: 'neutral' as const },
      { content: 'This coaching decision is questionable at best', sentiment: 'negative' as const },
      { content: 'Best matchup of the week, can\'t wait!', sentiment: 'positive' as const },
      { content: 'Weather could be a major factor here', sentiment: 'neutral' as const },
      { content: 'Defense has been terrible lately, avoiding this one', sentiment: 'negative' as const },
      { content: 'Sharp money coming in heavy on the underdog', sentiment: 'positive' as const }
    ];

    return Array.from({ length: count }, (_, i) => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      return {
        id: `post_${Date.now()}_${i}`,
        source: Math.random() > 0.5 ? 'twitter' as const : 'reddit' as const,
        author: `user${Math.floor(Math.random() * 1000)}`,
        content: template.content,
        sentiment: template.sentiment,
        engagement: {
          likes: Math.floor(Math.random() * 500) + 10,
          comments: Math.floor(Math.random() * 50) + 1,
          shares: Math.floor(Math.random() * 100) + 1
        },
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        url: `https://example.com/post/${i}`
      };
    });
  }

  private generateTrendingTopics(teamName: string): string[] {
    const topics = [
      `${teamName} offense`,
      `${teamName} defense`,
      `${teamName} injury report`,
      `${teamName} vs opponent`,
      `${teamName} coach`
    ];

    return topics.slice(0, 3);
  }

  /**
   * Clear all cached sentiment data
   */
  clearCache(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.SENTIMENT_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }
};

export const sentimentService = new SentimentService();
