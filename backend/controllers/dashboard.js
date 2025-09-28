// backend/controllers/dashboard.js
const { supabase } = require('../config/config');

// User Dashboard Controllers
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's ad statistics
    const { data: adStats } = await supabase
      .from('advertisement')
      .select(`
        advertisement_id,
        title,
        created_at,
        analysis_results!inner(verdict, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent notifications
    const { data: notifications } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        recent_ads: adStats || [],
        notifications: notifications || [],
        stats: {
          total_ads: adStats?.length || 0,
          pending_ads: adStats?.filter(ad => {
            const results = Array.isArray(ad.analysis_results) ? ad.analysis_results[0] : ad.analysis_results;
            return results?.status < 6;
          }).length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getUserDashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

const getUserAds = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: ads, error } = await supabase
      .from('advertisement')
      .select(`
        advertisement_id,
        title,
        description,
        type,
        created_at,
        analysis_results!inner(verdict, status, reason)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: ads || []
    });
  } catch (error) {
    console.error('Error in getUserAds:', error);
    res.status(500).json({ success: false, message: 'Failed to load ads' });
  }
};

const getAdDetails = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const { data: ad, error } = await supabase
      .from('advertisement')
      .select(`
        *,
        analysis_results(*),
        media(public_url),
        call_logs(*)
      `)
      .eq('advertisement_id', adId)
      .eq('user_id', userId)
      .single();

    if (error || !ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    res.status(200).json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Error in getAdDetails:', error);
    res.status(500).json({ success: false, message: 'Failed to load ad details' });
  }
};

// Notification controllers
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: notifications || []
    });
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('notification_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

module.exports = {
  getUserDashboard,
  getUserAds,
  getAdDetails,
  getUserNotifications,
  markNotificationRead
};