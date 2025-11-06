/**
 * Community Page
 * Social features: leaderboards, following, activity feed
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialService } from '../services/social.service';
import type { LeaderboardEntry, ActivityFeedItem, UserProfile, SharedBet } from '../services/social.service';
import { authService } from '../services/auth.service';

export function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'shared' | 'following'>('leaderboard');
  const [leaderboardType, setLeaderboardType] = useState<'profit' | 'roi' | 'winRate' | 'streak'>('profit');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [sharedBets, setSharedBets] = useState<SharedBet[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setLeaderboard(socialService.getLeaderboard(leaderboardType));
  }, [leaderboardType]);

  const loadData = () => {
    setLeaderboard(socialService.getLeaderboard('profit'));
    setActivityFeed(socialService.getActivityFeed());
    setSharedBets(socialService.getSharedBets());
    setCurrentUserProfile(socialService.getCurrentUserProfile());

    const user = authService.getCurrentUser();
    if (user) {
      setFollowing(socialService.getFollowing(user.id));
    }
  };

  const handleFollow = (userId: string) => {
    const result = socialService.followUser(userId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error);
    }
  };

  const handleUnfollow = (userId: string) => {
    const result = socialService.unfollowUser(userId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error);
    }
  };

  const isFollowingUser = (userId: string) => {
    return following.includes(userId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTierBadge = (tier: 'free' | 'pro' | 'elite') => {
    const badges = {
      free: 'bg-gray-600 text-white',
      pro: 'bg-blue-600 text-white',
      elite: 'bg-purple-600 text-white'
    };
    return badges[tier];
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🌟 Community</h1>
            <p className="text-gray-300">Connect with top bettors, share picks, and compete on leaderboards</p>
          </div>
          {currentUserProfile && (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400 text-sm">Your Rank</p>
              <p className="text-3xl font-bold text-white">#12</p>
              <p className="text-green-500 text-sm">${currentUserProfile.stats.netProfit.toFixed(0)} profit</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'feed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          📰 Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'shared'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          💡 Shared Picks
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'following'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          👥 Following ({following.length})
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          {/* Leaderboard Type Toggle */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setLeaderboardType('profit')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                leaderboardType === 'profit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              💰 Top Profit
            </button>
            <button
              onClick={() => setLeaderboardType('roi')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                leaderboardType === 'roi'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              📈 Top ROI
            </button>
            <button
              onClick={() => setLeaderboardType('winRate')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                leaderboardType === 'winRate'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              ⭐ Top Win Rate
            </button>
            <button
              onClick={() => setLeaderboardType('streak')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                leaderboardType === 'streak'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              🔥 Longest Streak
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">User</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                    {leaderboardType === 'profit' && 'Profit'}
                    {leaderboardType === 'roi' && 'ROI'}
                    {leaderboardType === 'winRate' && 'Win Rate'}
                    {leaderboardType === 'streak' && 'Streak'}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <span className="text-2xl">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="text-white font-bold text-lg">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {entry.displayName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{entry.displayName}</span>
                            {entry.verified && <span className="text-blue-500">✓</span>}
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTierBadge(entry.tier)}`}>
                              {entry.tier.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm">@{entry.username}</div>
                          {entry.badges.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {entry.badges.map(badge => (
                                <span key={badge.id} title={badge.description}>
                                  {badge.icon}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-white font-bold text-lg">
                        {leaderboardType === 'profit' && `$${entry.value.toFixed(0)}`}
                        {leaderboardType === 'roi' && `${entry.value.toFixed(1)}%`}
                        {leaderboardType === 'winRate' && `${entry.value.toFixed(1)}%`}
                        {leaderboardType === 'streak' && `${entry.value} wins`}
                      </div>
                      {entry.streak && entry.streak > 0 && (
                        <div className="text-yellow-500 text-sm">
                          🔥 {entry.streak} streak
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {entry.userId !== currentUserProfile?.id && (
                        <button
                          onClick={() => isFollowingUser(entry.userId) ? handleUnfollow(entry.userId) : handleFollow(entry.userId)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            isFollowingUser(entry.userId)
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isFollowingUser(entry.userId) ? 'Following' : '+ Follow'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {activityFeed.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
              <p className="text-gray-400">No activity yet. Follow users to see their activity!</p>
            </div>
          ) : (
            activityFeed.map((activity) => (
              <div key={activity.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {activity.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">{activity.displayName}</span>
                      <span className="text-gray-400 text-sm">@{activity.username}</span>
                      <span className="text-gray-600 text-sm">•</span>
                      <span className="text-gray-400 text-sm">{formatDate(activity.timestamp)}</span>
                    </div>
                    <p className="text-gray-300 mb-3">{activity.content}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                        ❤️ {activity.likes}
                      </button>
                      <button className="text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                        💬 {activity.comments}
                      </button>
                      <button className="text-gray-400 hover:text-green-500 transition-colors">
                        🔄 Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shared Picks Tab */}
      {activeTab === 'shared' && (
        <div className="space-y-4">
          {sharedBets.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
              <p className="text-gray-400">No shared picks yet. Be the first to share your analysis!</p>
            </div>
          ) : (
            sharedBets.map((bet) => (
              <div key={bet.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {bet.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{bet.displayName}</span>
                        <span className="text-gray-400 text-sm">@{bet.username}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          bet.confidence === 'high' ? 'bg-green-600 text-white' :
                          bet.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {bet.confidence.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">{formatDate(bet.sharedAt)}</span>
                    </div>

                    {/* Bet Details */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-gray-400 text-sm">{bet.betDetails.sport} • {bet.betDetails.betType}</p>
                          <p className="text-white font-semibold">{bet.betDetails.gameDetails}</p>
                        </div>
                        {bet.betDetails.result && (
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            bet.betDetails.result === 'won' ? 'bg-green-600 text-white' :
                            bet.betDetails.result === 'lost' ? 'bg-red-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {bet.betDetails.result.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Pick: </span>
                          <span className="text-white font-semibold">{bet.betDetails.selection}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Odds: </span>
                          <span className="text-white font-semibold">
                            {bet.betDetails.odds > 0 ? '+' : ''}{bet.betDetails.odds}
                          </span>
                        </div>
                        {bet.betDetails.profit !== undefined && (
                          <div>
                            <span className="text-gray-400">Profit: </span>
                            <span className={`font-semibold ${
                              bet.betDetails.profit > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              ${bet.betDetails.profit > 0 ? '+' : ''}{bet.betDetails.profit.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {bet.analysis && (
                      <p className="text-gray-300 mb-3 italic">{bet.analysis}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm">
                      <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                        ❤️ {bet.likes}
                      </button>
                      <button className="text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                        💬 {bet.comments}
                      </button>
                      <button className="text-gray-400 hover:text-green-500 transition-colors flex items-center gap-1">
                        🎯 {bet.tails} tailed
                      </button>
                      <button className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold">
                        Tail This Pick
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
              <p className="text-gray-400 mb-4">You're not following anyone yet</p>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Browse Leaderboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {following.map(userId => {
                const profile = socialService.getUserProfile(userId);
                if (!profile) return null;

                return (
                  <div key={userId} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {profile.displayName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{profile.displayName}</span>
                          {profile.verified && <span className="text-blue-500">✓</span>}
                        </div>
                        <p className="text-gray-400 text-sm">@{profile.username}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div className="bg-gray-800 rounded p-2 text-center">
                        <p className="text-gray-400 text-xs">Profit</p>
                        <p className="text-green-500 font-semibold">${profile.stats.netProfit.toFixed(0)}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2 text-center">
                        <p className="text-gray-400 text-xs">Win Rate</p>
                        <p className="text-white font-semibold">{profile.stats.winRate.toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2 text-center">
                        <p className="text-gray-400 text-xs">ROI</p>
                        <p className="text-white font-semibold">{profile.stats.roi.toFixed(1)}%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnfollow(userId)}
                      className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Unfollow
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
