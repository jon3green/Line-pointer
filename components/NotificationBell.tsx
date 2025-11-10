'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, Check, Flame, TrendingUp, Target, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchAlerts();
      // Poll for new alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
        setUnreadCount(data.alerts.filter((a: Alert) => !a.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/alerts/mark-all-read', { method: 'POST' });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleAlertClick = (alert: Alert) => {
    markAsRead(alert.id);
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
      setIsOpen(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'value_bet':
        return <Target className="w-5 h-5 text-green-400" />;
      case 'line_movement':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'arbitrage':
        return <DollarSign className="w-5 h-5 text-yellow-400" />;
      case 'game_start':
        return <Flame className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/50 bg-red-500/10';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'normal':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  if (!session) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-white/10 smooth-transition"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 glass-premium rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-green-400 hover:text-green-300 h-auto p-0 bg-transparent hover:bg-transparent"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Alerts List */}
            <div className="max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAlertClick(alert)}
                      className={`p-3 rounded-xl border ${getPriorityColor(alert.priority)} ${
                        !alert.read ? 'bg-white/5' : 'bg-transparent'
                      } ${alert.actionUrl ? 'cursor-pointer hover:bg-white/10' : ''} smooth-transition relative group`}
                    >
                      {/* Unread indicator */}
                      {!alert.read && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {alert.title}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(alert.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAlert(alert.id);
                              }}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 smooth-transition hover:bg-red-500/20 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <Button
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-white w-full"
                  onClick={() => {
                    router.push('/alerts');
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

