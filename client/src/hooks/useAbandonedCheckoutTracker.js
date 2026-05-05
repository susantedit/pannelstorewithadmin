import { useEffect, useState } from 'react';
import { showToast, Notif } from '../../utils/notify';

/**
 * Tracks when a user opens the buy modal (product purchase)
 * If they don't complete the order within 30 minutes, sends a reminder
 */
export function useAbandonedCheckoutTracker(userId) {
  const [checkoutStartTime, setCheckoutStartTime] = useState(null);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const reminderTimeoutRef = { current: null };

  const trackCheckoutStart = () => {
    const now = Date.now();
    setCheckoutStartTime(now);
    setCheckoutActive(true);

    // Set reminder for 30 minutes
    reminderTimeoutRef.current = setTimeout(() => {
      if (checkoutActive) {
        sendAbandonedCheckoutNotification();
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  const trackCheckoutComplete = async (order) => {
    setCheckoutActive(false);
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }

    // Track in backend if needed
    // await api.trackCheckoutCompleted(order);
  };

  const trackCheckoutAbandoned = () => {
    setCheckoutActive(false);
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
  };

  const sendAbandonedCheckoutNotification = () => {
    // Send browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Checkout Not Completed 😟', {
        body: 'Complete your purchase to get instant access!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'abandoned-checkout',
        requireInteraction: false
      });
    }

    // Show toast
    showToast('Don\'t forget to complete your order! 👀', 'info');

    Notif.showNotification(
      'Checkout Abandoned',
      'You started checkout but didn\'t finish. Come back to complete your order!',
      'warning',
      5000
    );
  };

  useEffect(() => {
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, []);

  return {
    trackCheckoutStart,
    trackCheckoutComplete,
    trackCheckoutAbandoned,
    isCheckoutActive: checkoutActive
  };
}

/**
 * Alternative: Simpler 30-second timeout for testing/demo
 */
export function useAbandonedCheckoutTrackerDemo(userId) {
  const [checkoutStartTime, setCheckoutStartTime] = useState(null);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const reminderTimeoutRef = { current: null };

  const trackCheckoutStart = () => {
    const now = Date.now();
    setCheckoutStartTime(now);
    setCheckoutActive(true);

    // Set reminder for 30 SECONDS (for testing)
    reminderTimeoutRef.current = setTimeout(() => {
      if (checkoutActive) {
        showToast('⏰ Checkout abandoned - still want to buy?', 'info');
      }
    }, 30 * 1000); // 30 seconds for demo
  };

  const trackCheckoutComplete = async (order) => {
    setCheckoutActive(false);
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
  };

  const trackCheckoutAbandoned = () => {
    setCheckoutActive(false);
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, []);

  return {
    trackCheckoutStart,
    trackCheckoutComplete,
    trackCheckoutAbandoned,
    isCheckoutActive: checkoutActive
  };
}
