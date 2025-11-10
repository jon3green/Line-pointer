/**
 * Social Service
 * Handles leaderboards, following, activity feed, and user profiles
 */

import { authService } from './auth.service';
import { betTrackerService } from './betTracker.service';

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  tier: 'free' | 'pro' | 'elite';
  verified: boolean;
  joinedAt: string;
  stats: {
    totalBets: number;
    netProfit: number;
    roi: number;
    winRate: number;
    currentStreak: number;
    longestWinStreak: number;
    followers: number;
    following: number;
  };
  badges: UserBadge[];
};

export type UserBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  tier: 'free' | 'pro' | 'elite';
  verified: boolean;
  value: number; // profit, ROI, or win rate
  streak?: number;
  badges: UserBadge[];
};

export type ActivityFeedItem = {
  id: string;
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'milestone' | 'badge_earned' | 'follow';
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  content: string;
  metadata?: any;
  timestamp: string;
  likes: number;
  comments: number;
};

export type SharedBet = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  betDetails: {
    sport: string;
    gameDetails: string;
    betType: string;
    selection: string;
    odds: number;
    stake: number;
    result?: 'won' | 'lost' | 'pending';
    profit?: number;
  };
  analysis?: string;
  confidence: 'high' | 'medium' | 'low';
  sharedAt: string;
  likes: number;
  tails: number; // Users who tailed this bet
  comments: number;
};

class SocialService {
  private readonly PROFILES_KEY = 'user_profiles';
  private readonly FOLLOWING_KEY = 'user_following';
  private readonly FOLLOWERS_KEY = 'user_followers';
  private readonly ACTIVITY_FEED_KEY = 'activity_feed';
  private readonly SHARED_BETS_KEY = 'shared_bets';

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | null {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === userId) || null;
  }

  /**
   * Get current user's profile
   */
  getCurrentUserProfile(): UserProfile | null {
    const user = authService.getCurrentUser();
    if (!user) return null;

    let profile = this.getUserProfile(user.id);
    if (!profile) {
      // Create profile if doesn't exist
      profile = this.createProfile(user.id, user.username, user.name);
    }

    // Update stats from bet tracker
    const bets = betTrackerService.getAllBets();
    const stats = betTrackerService.calculateStats(bets);

    profile.stats.totalBets = bets.length;
    profile.stats.netProfit = stats.netProfit;
    profile.stats.roi = stats.roi;
    profile.stats.winRate = stats.winRate;
    profile.stats.currentStreak = stats.currentStreak.count;
    profile.stats.longestWinStreak = stats.longestWinStreak;

    this.updateProfile(profile);
    return profile;
  }

  /**
   * Create user profile
   */
  private createProfile(userId: string, username: string, displayName: string): UserProfile {
    const profile: UserProfile = {
      id: userId,
      username,
      displayName,
      tier: 'free',
      verified: false,
      joinedAt: new Date().toISOString(),
      stats: {
        totalBets: 0,
        netProfit: 0,
        roi: 0,
        winRate: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        followers: 0,
        following: 0
      },
      badges: []
    };

    const profiles = this.getAllProfiles();
    profiles.push(profile);
    this.saveProfiles(profiles);

    return profile;
  }

  /**
   * Update user profile
   */
  updateProfile(profile: UserProfile): void {
    const profiles = this.getAllProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);

    if (index !== -1) {
      profiles[index] = profile;
      this.saveProfiles(profiles);
    }
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(
    type: 'profit' | 'roi' | 'winRate' | 'streak',
    limit: number = 50
  ): LeaderboardEntry[] {
    const profiles = this.getAllProfiles();

    // Sort by type
    const sorted = profiles.sort((a, b) => {
      if (type === 'profit') return b.stats.netProfit - a.stats.netProfit;
      if (type === 'roi') return b.stats.roi - a.stats.roi;
      if (type === 'winRate') return b.stats.winRate - a.stats.winRate;
      if (type === 'streak') return b.stats.longestWinStreak - a.stats.longestWinStreak;
      return 0;
    });

    // Convert to leaderboard entries
    return sorted.slice(0, limit).map((profile, index) => ({
      rank: index + 1,
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar,
      tier: profile.tier,
      verified: profile.verified,
      value: type === 'profit' ? profile.stats.netProfit :
             type === 'roi' ? profile.stats.roi :
             type === 'winRate' ? profile.stats.winRate :
             profile.stats.longestWinStreak,
      streak: profile.stats.currentStreak,
      badges: profile.badges
    }));
  }

  /**
   * Follow user
   */
  followUser(targetUserId: string): { success: boolean; error?: string } {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    if (currentUser.id === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    const following = this.getFollowing(currentUser.id);
    if (following.includes(targetUserId)) {
      return { success: false, error: 'Already following' };
    }

    // Add to following
    following.push(targetUserId);
    localStorage.setItem(`${this.FOLLOWING_KEY}_${currentUser.id}`, JSON.stringify(following));

    // Add to target's followers
    const followers = this.getFollowers(targetUserId);
    followers.push(currentUser.id);
    localStorage.setItem(`${this.FOLLOWERS_KEY}_${targetUserId}`, JSON.stringify(followers));

    // Update stats
    const currentProfile = this.getCurrentUserProfile();
    const targetProfile = this.getUserProfile(targetUserId);

    if (currentProfile) {
      currentProfile.stats.following = following.length;
      this.updateProfile(currentProfile);
    }

    if (targetProfile) {
      targetProfile.stats.followers = followers.length;
      this.updateProfile(targetProfile);
    }

    // Add to activity feed
    this.addActivity({
      type: 'follow',
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.name,
      content: `${currentUser.name} followed ${targetProfile?.displayName || 'a user'}`,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0
    });

    return { success: true };
  }

  /**
   * Unfollow user
   */
  unfollowUser(targetUserId: string): { success: boolean; error?: string } {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    const following = this.getFollowing(currentUser.id);
    const filtered = following.filter(id => id !== targetUserId);

    if (filtered.length === following.length) {
      return { success: false, error: 'Not following this user' };
    }

    localStorage.setItem(`${this.FOLLOWING_KEY}_${currentUser.id}`, JSON.stringify(filtered));

    // Remove from target's followers
    const followers = this.getFollowers(targetUserId);
    const filteredFollowers = followers.filter(id => id !== currentUser.id);
    localStorage.setItem(`${this.FOLLOWERS_KEY}_${targetUserId}`, JSON.stringify(filteredFollowers));

    // Update stats
    const currentProfile = this.getCurrentUserProfile();
    const targetProfile = this.getUserProfile(targetUserId);

    if (currentProfile) {
      currentProfile.stats.following = filtered.length;
      this.updateProfile(currentProfile);
    }

    if (targetProfile) {
      targetProfile.stats.followers = filteredFollowers.length;
      this.updateProfile(targetProfile);
    }

    return { success: true };
  }

  /**
   * Get users I'm following
   */
  getFollowing(userId: string): string[] {
    try {
      const stored = localStorage.getItem(`${this.FOLLOWING_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get my followers
   */
  getFollowers(userId: string): string[] {
    try {
      const stored = localStorage.getItem(`${this.FOLLOWERS_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if following user
   */
  isFollowing(targetUserId: string): boolean {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;

    const following = this.getFollowing(currentUser.id);
    return following.includes(targetUserId);
  }

  /**
   * Get activity feed
   */
  getActivityFeed(limit: number = 50): ActivityFeedItem[] {
    try {
      const stored = localStorage.getItem(this.ACTIVITY_FEED_KEY);
      if (!stored) return this.generateMockActivityFeed();

      const feed: ActivityFeedItem[] = JSON.parse(stored);
      return feed.slice(0, limit);
    } catch {
      return this.generateMockActivityFeed();
    }
  }

  /**
   * Add activity to feed
   */
  private addActivity(activity: Omit<ActivityFeedItem, 'id'>): void {
    const feed = this.getActivityFeed();

    const newActivity: ActivityFeedItem = {
      id: `activity_${Date.now()}`,
      ...activity
    };

    feed.unshift(newActivity);

    // Keep only last 500 items
    if (feed.length > 500) {
      feed.splice(500);
    }

    localStorage.setItem(this.ACTIVITY_FEED_KEY, JSON.stringify(feed));
  }

  /**
   * Share bet
   */
  shareBet(
    betId: string,
    analysis?: string,
    confidence: 'high' | 'medium' | 'low' = 'medium'
  ): { success: boolean; sharedBet?: SharedBet; error?: string } {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    const bets = betTrackerService.getAllBets();
    const bet = bets.find((b: any) => b.id === betId);

    if (!bet) {
      return { success: false, error: 'Bet not found' };
    }

    const sharedBet: SharedBet = {
      id: `shared_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.name,
      betDetails: {
        sport: bet.sport,
        gameDetails: `${bet.gameDetails.awayTeam} @ ${bet.gameDetails.homeTeam}`,
        betType: bet.betType,
        selection: bet.selection,
        odds: bet.odds,
        stake: bet.stake,
        result: bet.result === 'pending' ? undefined : bet.result === 'won' ? 'won' : 'lost',
        profit: bet.actualReturn ? bet.actualReturn - bet.stake : undefined
      },
      analysis,
      confidence,
      sharedAt: new Date().toISOString(),
      likes: 0,
      tails: 0,
      comments: 0
    };

    // Save to shared bets
    const sharedBets = this.getSharedBets();
    sharedBets.unshift(sharedBet);

    if (sharedBets.length > 500) {
      sharedBets.splice(500);
    }

    localStorage.setItem(this.SHARED_BETS_KEY, JSON.stringify(sharedBets));

    // Add to activity feed
    this.addActivity({
      type: 'bet_placed',
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.name,
      content: `${currentUser.name} shared a ${confidence} confidence bet: ${bet.selection}`,
      metadata: { sharedBetId: sharedBet.id },
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0
    });

    return { success: true, sharedBet };
  }

  /**
   * Get shared bets
   */
  getSharedBets(limit: number = 50): SharedBet[] {
    try {
      const stored = localStorage.getItem(this.SHARED_BETS_KEY);
      if (!stored) return [];

      const bets: SharedBet[] = JSON.parse(stored);
      return bets.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Award badge to user
   */
  awardBadge(userId: string, badge: Omit<UserBadge, 'earnedAt'>): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    // Check if already has badge
    if (profile.badges.find(b => b.id === badge.id)) return;

    const newBadge: UserBadge = {
      ...badge,
      earnedAt: new Date().toISOString()
    };

    profile.badges.push(newBadge);
    this.updateProfile(profile);

    // Add to activity feed
    this.addActivity({
      type: 'badge_earned',
      userId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      content: `${profile.displayName} earned the ${badge.name} badge!`,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0
    });
  }

  /**
   * Check and award milestones
   */
  checkMilestones(userId: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    // First Win
    if (profile.stats.totalBets >= 1 && !profile.badges.find(b => b.id === 'first_win')) {
      this.awardBadge(userId, {
        id: 'first_win',
        name: 'First Blood',
        icon: '🎯',
        description: 'Won your first bet'
      });
    }

    // 10 Win Streak
    if (profile.stats.longestWinStreak >= 10 && !profile.badges.find(b => b.id === 'streak_10')) {
      this.awardBadge(userId, {
        id: 'streak_10',
        name: 'Hot Streak',
        icon: '🔥',
        description: 'Won 10 bets in a row'
      });
    }

    // Profitable
    if (profile.stats.netProfit >= 1000 && !profile.badges.find(b => b.id === 'profit_1k')) {
      this.awardBadge(userId, {
        id: 'profit_1k',
        name: 'Money Maker',
        icon: '💰',
        description: 'Reached $1,000 in profit'
      });
    }

    // High Win Rate
    if (profile.stats.totalBets >= 50 && profile.stats.winRate >= 60 && !profile.badges.find(b => b.id === 'winrate_60')) {
      this.awardBadge(userId, {
        id: 'winrate_60',
        name: 'Consistent Winner',
        icon: '⭐',
        description: '60%+ win rate over 50 bets'
      });
    }
  }

  // Helper methods
  private getAllProfiles(): UserProfile[] {
    try {
      const stored = localStorage.getItem(this.PROFILES_KEY);
      if (!stored) return this.generateMockProfiles();
      return JSON.parse(stored);
    } catch {
      return this.generateMockProfiles();
    }
  }

  private saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
  }

  /**
   * Generate mock profiles for demo
   */
  private generateMockProfiles(): UserProfile[] {
    const profiles: UserProfile[] = [
      {
        id: 'user_demo_1',
        username: 'sharpshooter',
        displayName: 'Sharp Shooter',
        tier: 'elite',
        verified: true,
        joinedAt: '2024-01-15',
        stats: {
          totalBets: 342,
          netProfit: 12580,
          roi: 18.5,
          winRate: 64.3,
          currentStreak: 7,
          longestWinStreak: 15,
          followers: 1240,
          following: 45
        },
        badges: [
          { id: 'streak_10', name: 'Hot Streak', icon: '🔥', description: '10 win streak', earnedAt: '2024-03-20' },
          { id: 'profit_1k', name: 'Money Maker', icon: '💰', description: '$1k profit', earnedAt: '2024-02-10' }
        ]
      },
      {
        id: 'user_demo_2',
        username: 'valuehunter',
        displayName: 'Value Hunter',
        tier: 'pro',
        verified: true,
        joinedAt: '2024-02-01',
        stats: {
          totalBets: 189,
          netProfit: 8940,
          roi: 22.1,
          winRate: 58.2,
          currentStreak: 3,
          longestWinStreak: 11,
          followers: 823,
          following: 32
        },
        badges: []
      },
      {
        id: 'user_demo_3',
        username: 'linemaster',
        displayName: 'Line Master',
        tier: 'pro',
        verified: false,
        joinedAt: '2024-03-15',
        stats: {
          totalBets: 156,
          netProfit: 5420,
          roi: 15.3,
          winRate: 61.5,
          currentStreak: 5,
          longestWinStreak: 9,
          followers: 456,
          following: 67
        },
        badges: []
      }
    ];

    this.saveProfiles(profiles);
    return profiles;
  }

  /**
   * Generate mock activity feed
   */
  private generateMockActivityFeed(): ActivityFeedItem[] {
    const activities: ActivityFeedItem[] = [
      {
        id: 'act_1',
        type: 'bet_won',
        userId: 'user_demo_1',
        username: 'sharpshooter',
        displayName: 'Sharp Shooter',
        content: 'Sharp Shooter won $840 on Chiefs -2.5',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        likes: 45,
        comments: 12
      },
      {
        id: 'act_2',
        type: 'badge_earned',
        userId: 'user_demo_2',
        username: 'valuehunter',
        displayName: 'Value Hunter',
        content: 'Value Hunter earned the Money Maker badge!',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        likes: 23,
        comments: 5
      },
      {
        id: 'act_3',
        type: 'bet_placed',
        userId: 'user_demo_3',
        username: 'linemaster',
        displayName: 'Line Master',
        content: 'Line Master shared a high confidence bet: Alabama -7.5',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        likes: 67,
        comments: 18
      }
    ];

    localStorage.setItem(this.ACTIVITY_FEED_KEY, JSON.stringify(activities));
    return activities;
  }

  /**
   * Clear all social data (for testing)
   */
  clearAllData(): void {
    localStorage.removeItem(this.PROFILES_KEY);
    localStorage.removeItem(this.ACTIVITY_FEED_KEY);
    localStorage.removeItem(this.SHARED_BETS_KEY);
  }
};

export const socialService = new SocialService();
