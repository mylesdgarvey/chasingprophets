import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUnreadNotificationsForUser, markNotificationChecked, Notification } from '../../services/notifications';
import './NotificationPopup.css';

interface Props {
  onClose?: () => void;
  onChange?: () => void;
}

export default function NotificationPopup({ onClose, onChange }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // adjust horizontal offset so the popup doesn't overflow the viewport
  function adjustPopupPosition() {
    const el = popupRef.current;
    if (!el) return;
    const margin = 12; // px from viewport edges
    const popupRect = el.getBoundingClientRect();
    // default anchor is right:0 (popup's right edge aligns to bell wrapper's right edge)
    el.style.right = '0px';
    el.style.left = '';
    // if popup still overflows left edge of viewport, nudge it right
    const overflowLeft = margin - popupRect.left; // positive when left is too small
    if (overflowLeft > 0) {
      // move popup right by overflowLeft + buffer
      el.style.right = `-${overflowLeft + 8}px`;
    }
  }

  useEffect(() => {
    // prefer Cognito username; if it's not present, fall back to email, then to 'admin'
    if (!user) return;
    console.debug('NotificationPopup: current user', user);
    fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    const id = user.username || user.email || 'admin';
    if (id === 'admin') {
      console.warn('Falling back to "admin" for notifications lookup; ensure this matches your Cognito username');
    }
    setLoading(true);
    try {
      // Query both username and email keys (some notifications may be keyed by either)
      const idsToQuery = Array.from(new Set([user.username, user.email].filter(Boolean)));
      let allItems: Notification[] = [];
      for (const qid of idsToQuery) {
        const items = await getUnreadNotificationsForUser(qid as string);
        console.debug(`NotificationPopup: fetched ${items.length} items for id=${qid}`, items);
        allItems = allItems.concat(items as Notification[]);
      }

      // dedupe by notificationId
      const map: Record<string, Notification> = {};
      for (const it of allItems) {
        map[it.notificationId] = it;
      }
      const deduped = Object.values(map).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNotifications(deduped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(n: Notification) {
    if (!n || !n.userId) return;
    try {
      await markNotificationChecked(n.userId, n.notificationId);
      setNotifications(prev => prev.filter(x => x.notificationId !== n.notificationId));
  if (typeof onChange === 'function') onChange();
      // also call onClose? No — keep popup open and let parent decide
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  }

  async function handleMarkAllRead() {
    if (!notifications.length) return;
    setMarkingAll(true);
    try {
      // mark each notification using its stored userId so we update the correct partition
      await Promise.all(notifications.map(n => markNotificationChecked(n.userId, n.notificationId)));
      setNotifications([]);
  if (typeof onChange === 'function') onChange();
    } catch (err) {
      console.error('Failed to mark all read', err);
    } finally {
      setMarkingAll(false);
    }
  }

  if (!user) return null;

  useEffect(() => {
    // adjust on mount and on resize
    adjustPopupPosition();
    window.addEventListener('resize', adjustPopupPosition);
    return () => window.removeEventListener('resize', adjustPopupPosition);
  }, [notifications.length]);

  return (
    <div ref={popupRef} className="notification-popup" role="dialog" aria-label="Notifications">
      <div className="popup-header">
        <strong>Notifications</strong>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="popup-body">
        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="mark-all-read" onClick={handleMarkAllRead} disabled={markingAll || loading || notifications.length===0}>
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        </div>
        {loading && <div className="notice">Loading...</div>}
        {!loading && notifications.length === 0 && <div className="notice">No new notifications</div>}
        <ul className="notif-list">
          {notifications.map(n => (
            <li key={n.notificationId} className="notif-item">
              <div className="notif-message">{n.message}</div>
              <div className="notif-actions">
                <button className="mark-read" onClick={() => handleMarkAsRead(n)}>Mark read</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
