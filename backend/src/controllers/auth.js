const User = require('../models/User');
const { generateToken } = require('../utils/auth');

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      phone,
      password,
      referralCode: `FF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
};
