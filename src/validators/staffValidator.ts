import { Request, Response, NextFunction } from 'express';

const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

const validateStaffProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      staffRole,
      employeeId,
      department,
      experienceYears,
      shiftTiming,
      emergencyContact
    } = req.body;

    // Required fields
    if (!staffRole || !staffRole.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Staff role is required'
      });
    }

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }

    if (typeof experienceYears !== 'number' || experienceYears < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experience years must be a non-negative number'
      });
    }

    if (!shiftTiming || !shiftTiming.start || !shiftTiming.end) {
      return res.status(400).json({
        success: false,
        message: 'Shift timing with start and end time are required'
      });
    }

    if (!validateTimeFormat(shiftTiming.start)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift start time format (use HH:MM)'
      });
    }

    if (!validateTimeFormat(shiftTiming.end)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift end time format (use HH:MM)'
      });
    }

    if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone || !emergencyContact.relationship) {
      return res.status(400).json({
        success: false,
        message: 'Emergency contact with name, phone, and relationship is required'
      });
    }

    if (!validatePhoneNumber(emergencyContact.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency contact phone number'
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

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Validation error'
    });
  }
};

export { validateStaffProfile, validateTimeFormat, validatePhoneNumber };
