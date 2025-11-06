/**
 * Notification Service
 * Handles in-app notifications, email alerts, and push notifications
 */

export type Notification = {
  id: string;
  type: 'arbitrage' | 'line_movement' | 'bet_result' | 'system' | 'promotion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  read: boolean;
  timestamp: string;
  expiresAt?: string;
  metadata?: any;
};

export type NotificationSettings = {
  enabled: boolean;
  arbitrageAlerts: boolean;
  lineMovementAlerts: boolean;
  betResultAlerts: boolean;
  promotionAlerts: boolean;
  minArbitrageROI: number;
  minLineMovement: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
};

class NotificationService {
  private readonly STORAGE_KEY = 'notifications';
  private readonly SETTINGS_KEY = 'notification_settings';
  private readonly MAX_NOTIFICATIONS = 100;

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      const notifications: Notification[] = JSON.parse(stored);

      // Filter out expired notifications
      const now = new Date().getTime();
      return notifications.filter(n => {
        if (!n.expiresAt) return true;
        return new Date(n.expiresAt).getTime() > now;
      });
    } catch {
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.getAll().filter(n => !n.read);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Create new notification
   */
  create(
    type: Notification['type'],
    priority: Notification['priority'],
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      actionText?: string;
      expiresInHours?: number;
      metadata?: any;
    }
  ): Notification {
    const notifications = this.getAll();

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      title,
      message,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
      read: false,
      timestamp: new Date().toISOString(),
      expiresAt: options?.expiresInHours
        ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()
        : undefined,
      metadata: options?.metadata
    };

    notifications.unshift(notification);

    // Keep only latest MAX_NOTIFICATIONS
    if (notifications.length > this.MAX_NOTIFICATIONS) {
      notifications.splice(this.MAX_NOTIFICATIONS);
    }

    this.save(notifications);

    // Send push notification if enabled
    this.sendPushNotification(notification);

    return notification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notifications = this.getAll();
    const notification = notifications.find(n => n.id === id);

    if (notification) {
      notification.read = true;
      this.save(notifications);
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    const notifications = this.getAll();
    notifications.forEach(n => (n.read = true));
    this.save(notifications);
  }

  /**
   * Delete notification
   */
  delete(id: string): void {
    const notifications = this.getAll();
    const filtered = notifications.filter(n => n.id !== id);
    this.save(filtered);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (!stored) {
        return this.getDefaultSettings();
      }
      return JSON.parse(stored);
    } catch {
      return this.getDefaultSettings();
    }
  }

  /**
   * Update notification settings
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  /**
   * Send arbitrage alert
   */
  sendArbitrageAlert(
    gameDetails: string,
    roi: number,
    profit: number,
    bookmakers: string[]
  ): void {
    const settings = this.getSettings();

    if (!settings.enabled || !settings.arbitrageAlerts) return;
    if (roi < settings.minArbitrageROI) return;

    this.create(
      'arbitrage',
      roi >= 2 ? 'high' : 'medium',
      '💰 Arbitrage Opportunity Found!',
      `${gameDetails}: ${roi.toFixed(2)}% ROI, $${profit.toFixed(2)} profit guaranteed. ${bookmakers.join(' vs ')}`,
      {
        actionUrl: '/arbitrage-finder',
        actionText: 'View Details',
        expiresInHours: 2,
        metadata: { roi, profit, gameDetails }
      }
    );
  }

  /**
   * Send line movement alert
   */
  sendLineMovementAlert(
    gameDetails: string,
    movement: number,
    marketType: string,
    alertType: 'steam' | 'rlm' | 'sharp'
  ): void {
    const settings = this.getSettings();

    if (!settings.enabled || !settings.lineMovementAlerts) return;
    if (Math.abs(movement) < settings.minLineMovement) return;

    const icons = {
      steam: '⚡',
      rlm: '🔄',
      sharp: '📈'
    };

    const titles = {
      steam: 'Steam Move Detected!',
      rlm: 'Reverse Line Movement!',
      sharp: 'Sharp Move Detected!'
    };

    this.create(
      'line_movement',
      alertType === 'steam' ? 'high' : 'medium',
      `${icons[alertType]} ${titles[alertType]}`,
      `${gameDetails}: ${marketType} moved ${movement > 0 ? '+' : ''}${movement.toFixed(1)} points`,
      {
        actionUrl: '/line-movement',
        actionText: 'View Movement',
        expiresInHours: 4,
        metadata: { movement, marketType, alertType }
      }
    );
  }

  /**
   * Send bet result notification
   */
  sendBetResultNotification(
    gameDetails: string,
    result: 'won' | 'lost' | 'push',
    profit: number
  ): void {
    const settings = this.getSettings();

    if (!settings.enabled || !settings.betResultAlerts) return;

    const icons = {
      won: '🎉',
      lost: '😔',
      push: '↩️'
    };

    const titles = {
      won: 'Bet Won!',
      lost: 'Bet Lost',
      push: 'Bet Pushed'
    };

    this.create(
      'bet_result',
      result === 'won' ? 'medium' : 'low',
      `${icons[result]} ${titles[result]}`,
      `${gameDetails}: ${
        result === 'won' ? `+$${profit.toFixed(2)}` :
        result === 'lost' ? `-$${Math.abs(profit).toFixed(2)}` :
        'Stake returned'
      }`,
      {
        actionUrl: '/bet-tracker',
        actionText: 'View Bets',
        metadata: { result, profit }
      }
    );
  }

  /**
   * Send promotion notification
   */
  sendPromotion(title: string, message: string, actionUrl?: string): void {
    const settings = this.getSettings();

    if (!settings.enabled || !settings.promotionAlerts) return;

    this.create('promotion', 'low', title, message, {
      actionUrl,
      actionText: 'Learn More',
      expiresInHours: 48
    });
  }

  /**
   * Send system notification
   */
  sendSystemNotification(title: string, message: string): void {
    this.create('system', 'medium', title, message);
  }

  /**
   * Send push notification (if supported)
   */
  private sendPushNotification(notification: Notification): void {
    const settings = this.getSettings();

    if (!settings.pushEnabled) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon.png',
            badge: '/badge.png'
          });
        }
      });
    }
  }

  /**
   * Request push notification permission
   */
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      arbitrageAlerts: true,
      lineMovementAlerts: true,
      betResultAlerts: true,
      promotionAlerts: true,
      minArbitrageROI: 0.5,
      minLineMovement: 1,
      emailEnabled: false,
      pushEnabled: true,
      smsEnabled: false
    };
  }

  /**
   * Save notifications
   */
  private save(notifications: Notification[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
  }
};

export const notificationService = new NotificationService();
