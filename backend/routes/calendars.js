const express = require('express');
const router = express.Router();
const Calendar = require('../models/Calendar');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// @route   POST /api/calendars
// @desc    Create a calendar
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const newCalendar = new Calendar({
      title,
      description,
      color,
      owner: req.userId
    });

    const calendar = await newCalendar.save();
    req.io.to(req.userId).emit('calendar_created', calendar);
    res.status(201).json(calendar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calendars
// @desc    Get all calendars for the logged in user
router.get('/', auth, async (req, res) => {
  try {
    const calendars = await Calendar.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json(calendars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calendars/:id
// @desc    Get a specific calendar by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    
    res.json(calendar);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calendars/:id
// @desc    Update a calendar
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    
    let calendar = await Calendar.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    calendar = await Calendar.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, color } },
      { new: true }
    );

    req.io.to(req.userId).emit('calendar_updated', calendar);
    res.json(calendar);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/calendars/:id
// @desc    Delete a calendar
router.delete('/:id', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    // Cascading delete: Remove all events linked to this calendar
    await Event.deleteMany({ calendarId: req.params.id, owner: req.userId });

    await Calendar.findByIdAndDelete(req.params.id);

    req.io.to(req.userId).emit('calendar_deleted', req.params.id);
    req.io.to(req.userId).emit('events_cleared', { calendarId: req.params.id });
    res.json({ message: 'Calendar and associated events removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Calendar not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
