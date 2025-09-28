// backend/controllers/admin.js
const { supabase } = require('../config/config');

const getAdminDashboard = async (req, res) => {
  try {
    // Get system overview stats
    const { data: totalAds } = await supabase
      .from('advertisement')
      .select('advertisement_id', { count: 'exact' });

    const { data: totalUsers } = await supabase
      .from('users')
      .select('u_id', { count: 'exact' });

    const { data: pendingAds } = await supabase
      .from('analysis_results')
      .select('analysis_results_id', { count: 'exact' })
      .lt('status', 6);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_ads: totalAds?.length || 0,
          total_users: totalUsers?.length || 0,
          pending_ads: pendingAds?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getAdminDashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load admin dashboard' });
  }
};

const getAllAds = async (req, res) => {
  try {
    const { data: ads, error } = await supabase
      .from('advertisement')
      .select(`
        advertisement_id,
        title,
        description,
        type,
        created_at,
        users(name, email),
        analysis_results(verdict, status, reason)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: ads || []
    });
  } catch (error) {
    console.error('Error in getAllAds:', error);
    res.status(500).json({ success: false, message: 'Failed to load ads' });
  }
};

const getAdminAdDetails = async (req, res) => {
  try {
    const { adId } = req.params;

    const { data: ad, error } = await supabase
      .from('advertisement')
      .select(`
        *,
        users(name, email),
        analysis_results(*),
        media(public_url),
        call_logs(*)
      `)
      .eq('advertisement_id', adId)
      .single();

    if (error || !ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    res.status(200).json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Error in getAdminAdDetails:', error);
    res.status(500).json({ success: false, message: 'Failed to load advertisement details' });
  }
};

const updateAdStatus = async (req, res) => {
  try {
    const { adId } = req.params;
    const { status, verdict, reason } = req.body;
    const adminId = req.user.id;

    // Update analysis results
    const { error: updateError } = await supabase
      .from('analysis_results')
      .update({
        admin_verdict: verdict,
        admin_reason: reason,
        approved_by: adminId,
        status: status || 6, // Set to completed status
        updated_at: new Date().toISOString()
      })
      .eq('advertisement_id', adId);

    if (updateError) throw updateError;

    // Create notification for user
    const { data: ad } = await supabase
      .from('advertisement')
      .select('user_id, title')
      .eq('advertisement_id', adId)
      .single();

    if (ad) {
      await supabase
        .from('notification')
        .insert({
          user_id: ad.user_id,
          title: `Advertisement ${verdict}`,
          message: `Your advertisement "${ad.title}" has been ${verdict}. ${reason ? `Reason: ${reason}` : ''}`,
          type: verdict === 'approved' ? 'success' : 'warning',
          is_read: false
        });
    }

    res.status(200).json({
      success: true,
      message: `Advertisement ${verdict} successfully`
    });
  } catch (error) {
    console.error('Error in updateAdStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to update advertisement status' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        u_id,
        name,
        email,
        sector,
        role,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user statistics
    const userStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: adCount } = await supabase
          .from('advertisement')
          .select('advertisement_id', { count: 'exact' })
          .eq('user_id', user.u_id);

        return {
          ...user,
          total_ads: adCount?.length || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
};

const getSystemStats = async (req, res) => {
  try {
    // Get comprehensive system statistics
    const [
      { data: totalAds, count: adsCount },
      { data: totalUsers, count: usersCount },
      { data: pendingAds, count: pendingCount },
      { data: approvedAds, count: approvedCount },
      { data: rejectedAds, count: rejectedCount }
    ] = await Promise.all([
      supabase.from('advertisement').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('analysis_results').select('*', { count: 'exact', head: true }).is('admin_verdict', null),
      supabase.from('analysis_results').select('*', { count: 'exact', head: true }).eq('admin_verdict', 'approved'),
      supabase.from('analysis_results').select('*', { count: 'exact', head: true }).eq('admin_verdict', 'rejected')
    ]);

    // Get recent activity
    const { data: recentAds } = await supabase
      .from('advertisement')
      .select(`
        advertisement_id,
        title,
        created_at,
        users(name, email),
        analysis_results(verdict, admin_verdict)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get monthly stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyStats } = await supabase
      .from('advertisement')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    // Process monthly data
    const monthlyData = {};
    (monthlyStats || []).forEach(ad => {
      const month = new Date(ad.created_at).toISOString().substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total_ads: adsCount || 0,
          total_users: usersCount || 0,
          pending_ads: pendingCount || 0,
          approved_ads: approvedCount || 0,
          rejected_ads: rejectedCount || 0
        },
        recent_activity: recentAds || [],
        monthly_stats: monthlyData
      }
    });
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    res.status(500).json({ success: false, message: 'Failed to load system statistics' });
  }
};

module.exports = {
  getAdminDashboard,
  getAllAds,
  getAdminAdDetails,
  updateAdStatus,
  getAllUsers,
  getSystemStats
};