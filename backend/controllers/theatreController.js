const Theatre = require('../models/Theatre');
const Show = require('../models/Show');

// @desc    Get all theatres
// @route   GET /api/theatres
// @access  Public
exports.getAllTheatres = async (req, res, next) => {
  try {
    const { city } = req.query;
    let filter = { isActive: true };
    if (city && city !== 'All') {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    const theatres = await Theatre.find(filter).sort({ name: 1 });
    const cities = await Theatre.distinct('city');

    res.json({
      success: true,
      count: theatres.length,
      cities,
      theatres
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single theatre by ID
// @route   GET /api/theatres/:id
// @access  Public
exports.getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.'
      });
    }

    res.json({
      success: true,
      theatre
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a theatre
// @route   POST /api/theatres
// @access  Private/Admin
exports.createTheatre = async (req, res, next) => {
  try {
    const {
      name,
      location,
      city,
      address,
      screenName,
      seatConfiguration,
      facilities
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Theatre name and location are required.'
      });
    }

    // Default configuration if not supplied
    const config = {
      balcony: {
        rows: Number(seatConfiguration?.balcony?.rows || 2),
        seatsPerRow: Number(seatConfiguration?.balcony?.seatsPerRow || 10),
        price: Number(seatConfiguration?.balcony?.price || 350),
        label: seatConfiguration?.balcony?.label || 'Balcony (Premium Recliner)'
      },
      middle: {
        rows: Number(seatConfiguration?.middle?.rows || 4),
        seatsPerRow: Number(seatConfiguration?.middle?.seatsPerRow || 10),
        price: Number(seatConfiguration?.middle?.price || 250),
        label: seatConfiguration?.middle?.label || 'Executive (Middle Class)'
      },
      lower: {
        rows: Number(seatConfiguration?.lower?.rows || 2),
        seatsPerRow: Number(seatConfiguration?.lower?.seatsPerRow || 10),
        price: Number(seatConfiguration?.lower?.price || 180),
        label: seatConfiguration?.lower?.label || 'Classic (Lower Tier)'
      }
    };

    const seatingCapacity =
      config.balcony.rows * config.balcony.seatsPerRow +
      config.middle.rows * config.middle.seatsPerRow +
      config.lower.rows * config.lower.seatsPerRow;

    const theatre = await Theatre.create({
      name: name.trim(),
      location: location.trim(),
      city: city ? city.trim() : 'Mumbai',
      address: address ? address.trim() : '',
      screenName: screenName ? screenName.trim() : 'Audi 1',
      seatingCapacity,
      seatConfiguration: config,
      facilities: Array.isArray(facilities)
        ? facilities
        : typeof facilities === 'string'
        ? facilities.split(',').map((f) => f.trim())
        : ['Dolby Atmos 7.1', '4K Projection', 'Food & Beverages', 'Wheelchair Accessible', 'Parking']
    });

    res.status(201).json({
      success: true,
      message: 'Theatre created successfully.',
      theatre
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a theatre
// @route   PUT /api/theatres/:id
// @access  Private/Admin
exports.updateTheatre = async (req, res, next) => {
  try {
    let theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.'
      });
    }

    const { name, location, city, address, screenName, seatConfiguration, facilities, isActive } = req.body;

    if (name) theatre.name = name.trim();
    if (location) theatre.location = location.trim();
    if (city) theatre.city = city.trim();
    if (address !== undefined) theatre.address = address.trim();
    if (screenName) theatre.screenName = screenName.trim();
    if (isActive !== undefined) theatre.isActive = isActive;
    if (facilities) {
      theatre.facilities = Array.isArray(facilities)
        ? facilities
        : facilities.split(',').map((f) => f.trim());
    }

    if (seatConfiguration) {
      theatre.seatConfiguration = {
        balcony: {
          rows: Number(seatConfiguration.balcony?.rows || theatre.seatConfiguration.balcony.rows),
          seatsPerRow: Number(seatConfiguration.balcony?.seatsPerRow || theatre.seatConfiguration.balcony.seatsPerRow),
          price: Number(seatConfiguration.balcony?.price || theatre.seatConfiguration.balcony.price),
          label: seatConfiguration.balcony?.label || theatre.seatConfiguration.balcony.label
        },
        middle: {
          rows: Number(seatConfiguration.middle?.rows || theatre.seatConfiguration.middle.rows),
          seatsPerRow: Number(seatConfiguration.middle?.seatsPerRow || theatre.seatConfiguration.middle.seatsPerRow),
          price: Number(seatConfiguration.middle?.price || theatre.seatConfiguration.middle.price),
          label: seatConfiguration.middle?.label || theatre.seatConfiguration.middle.label
        },
        lower: {
          rows: Number(seatConfiguration.lower?.rows || theatre.seatConfiguration.lower.rows),
          seatsPerRow: Number(seatConfiguration.lower?.seatsPerRow || theatre.seatConfiguration.lower.seatsPerRow),
          price: Number(seatConfiguration.lower?.price || theatre.seatConfiguration.lower.price),
          label: seatConfiguration.lower?.label || theatre.seatConfiguration.lower.label
        }
      };

      theatre.seatingCapacity =
        theatre.seatConfiguration.balcony.rows * theatre.seatConfiguration.balcony.seatsPerRow +
        theatre.seatConfiguration.middle.rows * theatre.seatConfiguration.middle.seatsPerRow +
        theatre.seatConfiguration.lower.rows * theatre.seatConfiguration.lower.seatsPerRow;
    }

    await theatre.save();

    res.json({
      success: true,
      message: 'Theatre updated successfully.',
      theatre
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a theatre
// @route   DELETE /api/theatres/:id
// @access  Private/Admin
exports.deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.'
      });
    }

    // Check if there are active shows scheduled at this theatre
    const activeShowsCount = await Show.countDocuments({ theatre: req.params.id });
    if (activeShowsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete theatre because ${activeShowsCount} shows are scheduled in this theatre. Please remove those shows first.`
      });
    }

    await Theatre.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Theatre deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
