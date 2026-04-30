const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const auth = require('../middleware/auth');

// @route   POST /api/events
// @desc    Create an event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, start, end, location, calendarId } = req.body;

    // Verify calendar belongs to user
    const calendar = await Calendar.findOne({ _id: calendarId, owner: req.userId });
    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found or unauthorized' });
    }

    const newEvent = new Event({
      title,
      description,
      start,
      end,
      location,
      calendarId,
      owner: req.userId
    });

    const event = await newEvent.save();
    req.io.to(req.userId).emit('event:created', event);
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events
// @desc    Get all events for the logged in user with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { calendarId, start, end } = req.query;
    let query = { owner: req.userId };

    if (calendarId) {
      query.calendarId = calendarId;
    }

    if (start || end) {
      query.start = {};
      if (start) query.start.$gte = new Date(start);
      if (end) query.start.$lte = new Date(end);
    }

    const events = await Event.find(query).sort({ start: 1 });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get a specific event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, start, end, location, calendarId } = req.body;
    
    let event = await Event.findOne({ _id: req.params.id, owner: req.userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // If changing calendar, verify ownership of new calendar
    if (calendarId && calendarId !== event.calendarId.toString()) {
      const calendar = await Calendar.findOne({ _id: calendarId, owner: req.userId });
      if (!calendar) {
        return res.status(404).json({ message: 'New calendar not found or unauthorized' });
      }
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, start, end, location, calendarId } },
      { new: true }
    );

    req.io.to(req.userId).emit('event:updated', event);
    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);

    req.io.to(req.userId).emit('event:deleted', req.params.id);
    res.json({ message: 'Event removed' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
