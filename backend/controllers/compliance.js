const complianceService = require('../Services/compliance');

const uploadAd = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      target_region,
      language,
      landing_url,
      target_audience,
      target_age_group
    } = req.body;

    const userId = req.user.id;
    const files = req.files;

    if (!title || !description || type === undefined || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, type, and at least one media file are required'
      });
    }

    if (![0, 1, 2].includes(parseInt(type))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be 0 (image), 1 (video), or 2 (text)'
      });
    }

    const adData = {
      title,
      description,
      user_id: userId,
      type: parseInt(type),
      target_region,
      language,
      landing_url,
      target_audience,
      target_age_group: target_age_group ? JSON.parse(target_age_group) : null
    };

    const result = await complianceService.uploadAdvertisement(adData, files);

    res.status(201).json({
      success: true,
      status: "processing",
      message: "Ad upload initiated. Compliance checks will begin shortly.",
      advertisement_id: result.advertisement_id,
      progress_tracking_url: `/ads/adv-${result.advertisement_id}/status`
    });

  } catch (error) {
    console.error('Error in uploadAd controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAdStatus = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const advertisementId = adId.replace('adv-', '');

    if (!advertisementId || isNaN(advertisementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid advertisement ID'
      });
    }

    const status = await complianceService.getAdvertisementStatus(advertisementId, userId);
    res.status(200).json(status);

  } catch (error) {
    console.error('Error in getAdStatus controller:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadAd,
  getAdStatus
};