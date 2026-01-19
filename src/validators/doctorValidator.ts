import { Request, Response, NextFunction } from 'express';

const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validateDoctorProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      specialization,
      licenseNumber,
      licenseAuthority,
      licenseExpiry,
      experienceYears,
      designation,
      workingHours,
      consultationType,
      appointmentDuration,
      languages
    } = req.body;

    // Required fields
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Specialization is required'
      });
    }

    if (!licenseNumber || !licenseNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'License number is required'
      });
    }

    if (!licenseAuthority || !licenseAuthority.trim()) {
      return res.status(400).json({
        success: false,
        message: 'License authority is required'
      });
    }

    if (!licenseExpiry) {
      return res.status(400).json({
        success: false,
        message: 'License expiry date is required'
      });
    }

    const expiryDate = new Date(licenseExpiry);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid license expiry date format'
      });
    }

    if (typeof experienceYears !== 'number' || experienceYears < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experience years must be a non-negative number'
      });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Designation is required'
      });
    }

    if (!workingHours || !workingHours.start || !workingHours.end) {
      return res.status(400).json({
        success: false,
        message: 'Working hours with start and end time are required'
      });
    }

    if (!validateTimeFormat(workingHours.start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid working hours start time format (use HH:MM)'
      });
    }

    if (!validateTimeFormat(workingHours.end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid working hours end time format (use HH:MM)'
      });
    }

    if (!consultationType || !['online', 'in-person', 'both'].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: 'Consultation type must be online, in-person, or both'
      });
    }

    if (typeof appointmentDuration !== 'number' || appointmentDuration < 15) {
      return res.status(400).json({
        success: false,
        message: 'Appointment duration must be at least 15 minutes'
      });
    }

    if (req.body.workingDays) {
      if (!Array.isArray(req.body.workingDays)) {
        return res.status(400).json({
          success: false,
          message: 'Working days must be an array'
        });
      }
    }

    if (req.body.breakTimes && Array.isArray(req.body.breakTimes)) {
      for (const breakTime of req.body.breakTimes) {
        if (!validateTimeFormat(breakTime.start) || !validateTimeFormat(breakTime.end)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid break time format (use HH:MM)'
          });
        }
      }
    }

    if (req.body.languages && !Array.isArray(req.body.languages)) {
      return res.status(400).json({
        success: false,
        message: 'Languages must be an array'
      });
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export { validateDoctorProfile, validateTimeFormat };
