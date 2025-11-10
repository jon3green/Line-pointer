/**
 * Authentication Service
 * Simple localStorage-based authentication (upgrade to JWT/OAuth later)
 */

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  tier: 'free' | 'pro' | 'elite';
  joinedAt: string;
  lastLogin: string;
  settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    autoSync: boolean;
  };
  stats: {
    betsTracked: number;
    totalProfit: number;
    winRate: number;
  };
};

class AuthService {
  private readonly STORAGE_KEY = 'current_user';
  private readonly USERS_KEY = 'all_users';

  /**
   * Register new user
   */
  register(email: string, password: string, name: string): { success: boolean; user?: User; error?: string } {
    // Check if email already exists
    const users = this.getAllUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Create new user
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      username: email.split('@')[0],
      tier: 'free',
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        autoSync: true
      },
      stats: {
        betsTracked: 0,
        totalProfit: 0,
        winRate: 0
      }
    };

    // Save user
    users.push(user);
    this.saveAllUsers(users);

    // Save password (in production, use proper hashing!)
    this.savePassword(user.id, password);

    // Set as current user
    this.setCurrentUser(user);

    return { success: true, user };
  }

  /**
   * Login user
   */
  login(email: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check password (in production, use proper verification!)
    const savedPassword = this.getPassword(user.id);
    if (savedPassword !== password) {
      return { success: false, error: 'Invalid password' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.updateUser(user);

    // Set as current user
    this.setCurrentUser(user);

    return { success: true, user };
  }

  /**
   * Logout current user
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Update user profile
   */
  updateUser(user: User): void {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);

    if (index !== -1) {
      users[index] = user;
      this.saveAllUsers(users);

      // Update current user if it's the same
      const current = this.getCurrentUser();
      if (current && current.id === user.id) {
        this.setCurrentUser(user);
      }
    }
  }

  /**
   * Upgrade user tier
   */
  upgradeTier(tier: 'pro' | 'elite'): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    user.tier = tier;
    this.updateUser(user);

    return true;
  }

  /**
   * Update user settings
   */
  updateSettings(settings: Partial<User['settings']>): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    user.settings = { ...user.settings, ...settings };
    this.updateUser(user);

    return true;
  }

  /**
   * Update user stats
   */
  updateStats(stats: Partial<User['stats']>): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    user.stats = { ...user.stats, ...stats };
    this.updateUser(user);

    return true;
  }

  /**
   * Delete account
   */
  deleteAccount(password: string): { success: boolean; error?: string } {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // Verify password
    const savedPassword = this.getPassword(user.id);
    if (savedPassword !== password) {
      return { success: false, error: 'Invalid password' };
    }

    // Remove from users list
    const users = this.getAllUsers();
    const filtered = users.filter(u => u.id !== user.id);
    this.saveAllUsers(filtered);

    // Remove password
    localStorage.removeItem(`pwd_${user.id}`);

    // Logout
    this.logout();

    return { success: true };
  }

  /**
   * Reset password
   */
  resetPassword(email: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // In production, send email with reset link
    // For now, just generate a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 10);
    this.savePassword(user.id, tempPassword);

    console.log(`Temporary password for ${email}: ${tempPassword}`);

    return { success: true };
  }

  /**
   * Change password
   */
  changePassword(oldPassword: string, newPassword: string): { success: boolean; error?: string } {
    const user = this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    // Verify old password
    const savedPassword = this.getPassword(user.id);
    if (savedPassword !== oldPassword) {
      return { success: false, error: 'Invalid current password' };
    }

    // Save new password
    this.savePassword(user.id, newPassword);

    return { success: true };
  }

  // Private helper methods
  private getAllUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.USERS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveAllUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private savePassword(userId: string, password: string): void {
    // In production, hash this properly with bcrypt!
    localStorage.setItem(`pwd_${userId}`, password);
  }

  private getPassword(userId: string): string | null {
    return localStorage.getItem(`pwd_${userId}`);
  }
};

export const authService = new AuthService();
