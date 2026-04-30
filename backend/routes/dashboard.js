const express = require('express');
const router = express.Router();
const Calendar = require('../models/Calendar');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get all data for the dashboard (user, calendars, upcoming events)
router.get('/', auth, async (req, res) => {
  try {
    // 1. Get user info (already attached by auth middleware, but we can refine what we send)
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    };

    // 2. Get all calendars for the user
    const calendars = await Calendar.find({ owner: req.userId }).sort({ title: 1 });

    // 3. Get upcoming events (from now onwards)
    const now = new Date();
    const upcomingEvents = await Event.find({ 
      owner: req.userId,
      start: { $gte: now }
    })
    .sort({ start: 1 })
    .limit(10); // Limit to top 10 upcoming events for the dashboard summary

    res.json({
      user,
      calendars,
      upcomingEvents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
