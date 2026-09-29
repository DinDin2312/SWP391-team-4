import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete ALL notifications? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete('http://localhost:8080/api/v1/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications([]);
        window.dispatchEvent(new Event('notificationUpdated'));
      } catch (err) {
        console.error("Failed to delete all notifications", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <div className="text-on-surface-variant flex items-center gap-2 font-semibold">
          <span className="material-symbols-outlined animate-spin">sync</span>
          Loading Notifications...
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg border-b border-surface-container mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl lg:text-4xl text-on-surface tracking-tight font-extrabold flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-sm font-bold shadow-sm">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Stay updated on your schedule, payments, and system alerts.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap mt-4 lg:mt-0">
          {notifications.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error-container text-on-error-container text-sm font-bold transition-all shadow-sm active:scale-95 hover:brightness-95"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span>Clear All</span>
            </button>
          )}

          {notifications.length > 0 && unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-500">done_all</span>
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 max-w-4xl">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-xl border border-surface-container text-center">
            <span className="material-symbols-outlined text-6xl text-surface-container-high mb-4">notifications_off</span>
            <h3 className="text-xl font-bold text-on-surface">No notifications yet</h3>
            <p className="text-sm text-on-surface-variant mt-2">When you get updates, they'll show up here.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isUnread = !notification.read;
            const iconMap = {
              'SYSTEM': 'settings',
              'BOOKING': 'event',
              'PAYMENT': 'credit_card',
              'PROMOTION': 'campaign'
            };
            const icon = iconMap[notification.type] || 'notifications';

            return (
              <div 
                key={notification.id} 
                className={`relative flex gap-4 p-5 rounded-xl transition-all duration-200 border ${
                  isUnread 
                    ? 'bg-surface-container-low border-primary/20 shadow-md' 
                    : 'bg-surface-container-lowest border-surface-container opacity-70'
                }`}
              >
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isUnread ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse border-2 border-surface-container-low"></div>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-base pr-4 ${isUnread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-md hover:bg-error-container/20"
                        title="Delete notification"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 leading-relaxed ${isUnread ? 'text-on-surface-variant' : 'text-on-surface-variant/80'}`}>
                    {notification.message}
                  </p>
                  
                  {isUnread && (
                    <div className="mt-3 flex items-center">
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
