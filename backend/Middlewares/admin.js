// backend/Middlewares/admin.js
const { supabase } = require('../config/config');

const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user has admin privileges
    const { data: user, error } = await supabase
      .from('users')
      .select('sector, email, role')
      .eq('u_id', userId)
      .single();

    if (error || !user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if user is admin (you can modify this logic)
    const isAdmin = user.role === 'admin' || user.email.includes('@adguard.ai');
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = adminMiddleware;