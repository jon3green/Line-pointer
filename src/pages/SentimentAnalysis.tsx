/**
 * Sentiment Analysis Page
 * Social media sentiment tracking for games and teams
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sentimentService } from '../services/sentiment.service';
import type { SentimentData, TrendingTopic, SocialPost } from '../services/sentiment.service';

export function SentimentAnalysis() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [gameSentiment, setGameSentiment] = useState<SentimentData | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'trending' | 'feed'>('overview');

  useEffect(() => {
    loadData();
  }, [gameId]);

  const loadData = () => {
    if (gameId) {
      const sentiment = sentimentService.getGameSentiment(gameId);
      setGameSentiment(sentiment);
      if (sentiment) {
        setSocialFeed(sentiment.recentPosts);
      }
    }

    setTrendingTopics(sentimentService.getTrendingTopics());
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = sentimentService.searchMentions(searchQuery);
      setSocialFeed(results);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_positive': return 'text-green-500';
      case 'positive': return 'text-green-400';
      case 'neutral': return 'text-text-secondary';
      case 'negative': return 'text-red-400';
      case 'very_negative': return 'text-red-500';
      default: return 'text-text-secondary';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-text-secondary hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📊 Social Sentiment</h1>
            <p className="text-text-primary">Real-time social media analysis from Twitter and Reddit</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search mentions (e.g., 'Chiefs', 'injury news', 'weather')"
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-text-secondary hover:text-white'
          }`}
        >
          📈 Overview
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'trending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-text-secondary hover:text-white'
          }`}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'feed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-text-secondary hover:text-white'
          }`}
        >
          💬 Social Feed
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && gameSentiment && (
        <div className="space-y-6">
          {/* Overall Sentiment Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Overall Sentiment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-6xl font-bold mb-2">
                  <span className={getSentimentColor(gameSentiment.overall.sentiment)}>
                    {gameSentiment.overall.score.toFixed(0)}
                  </span>
                </div>
                <div className="text-text-secondary text-sm mb-1">Sentiment Score</div>
                <div className={`text-sm font-semibold ${getSentimentColor(gameSentiment.overall.sentiment)}`}>
                  {gameSentiment.overall.sentiment.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatNumber(gameSentiment.overall.volume)}
                </div>
                <div className="text-text-secondary text-sm">Total Mentions</div>
                {gameSentiment.overall.trending && (
                  <div className="mt-2 inline-block px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                    🔥 TRENDING
                  </div>
                )}
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-text-secondary text-sm mb-3">Public Bias</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">Home Team</span>
                      <span className="text-blue-500 font-semibold">{gameSentiment.homeBias.score.toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{ width: `${gameSentiment.homeBias.score}%` }}
                      />
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{formatNumber(gameSentiment.homeBias.volume)} mentions</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">Away Team</span>
                      <span className="text-purple-500 font-semibold">{gameSentiment.awayBias.score.toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all"
                        style={{ width: `${gameSentiment.awayBias.score}%` }}
                      />
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{formatNumber(gameSentiment.awayBias.volume)} mentions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Trending Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameSentiment.topics.map((topic, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      topic.sentiment === 'positive' ? 'bg-green-500' :
                      topic.sentiment === 'negative' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    <div>
                      <div className="text-white font-semibold">{topic.keyword}</div>
                      <div className="text-text-secondary text-sm">{formatNumber(topic.mentions)} mentions</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    topic.impact === 'high' ? 'bg-red-600 text-white' :
                    topic.impact === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {topic.impact.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">🔥 What's Trending</h2>
          <div className="space-y-3">
            {trendingTopics.map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-500">#{idx + 1}</div>
                  <div>
                    <div className="text-white font-semibold">{topic.keyword}</div>
                    <div className="text-text-secondary text-sm">{formatNumber(topic.mentions)} mentions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    topic.sentiment === 'positive' ? 'bg-green-600 text-white' :
                    topic.sentiment === 'negative' ? 'bg-red-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {topic.sentiment.toUpperCase()}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    topic.impact === 'high' ? 'bg-orange-600 text-white' :
                    topic.impact === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {topic.impact.toUpperCase()} IMPACT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {socialFeed.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
              <p className="text-text-secondary mb-4">No posts found. Try searching for a team or topic!</p>
            </div>
          ) : (
            socialFeed.map((post) => (
              <div key={post.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.source === 'twitter' ? '𝕏' : 'R'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">@{post.author}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-text-secondary text-sm">{formatTime(post.timestamp)}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
                        post.sentiment === 'positive' ? 'bg-green-600 text-white' :
                        post.sentiment === 'negative' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {post.sentiment.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-text-primary mb-3">{post.content}</p>
                    <div className="flex items-center gap-6 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>{formatNumber(post.engagement.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{formatNumber(post.engagement.comments)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🔄</span>
                        <span>{formatNumber(post.engagement.shares)}</span>
                      </div>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          View Original →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-8 bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-xl">ℹ️</span>
          <div>
            <p className="text-blue-300 text-sm">
              <strong>Demo Mode:</strong> This sentiment data is simulated for demonstration purposes.
              In production, this would integrate with Twitter API v2 and Reddit API to provide real-time sentiment analysis.
            </p>
            <p className="text-blue-400 text-xs mt-2">
              Pro users get access to real-time sentiment tracking with hourly updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
