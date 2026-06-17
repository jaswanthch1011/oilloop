const AIService = require('../services/AIService');

exports.predictOil = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image' });
  }

  try {
    const result = await AIService.predictOil(req.file.buffer);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
