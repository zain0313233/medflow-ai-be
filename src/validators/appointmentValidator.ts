import { Request, Response, NextFunction } from 'express';

export const validateAppointment = (req: Request, res: Response, next: NextFunction) => {
  const { doctorId, appointmentDate, appointmentTime, consultationType } = req.body;
  const errors: string[] = [];

  // Validate doctorId
  if (!doctorId || typeof doctorId !== 'string') {
    errors.push('Doctor ID is required and must be a string');
  }

  // Validate appointmentDate
  if (!appointmentDate) {
    errors.push('Appointment date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      errors.push('Appointment date must be in YYYY-MM-DD format');
    } else {
      const date = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        errors.push('Appointment date cannot be in the past');
      }
    }
  }

  // Validate appointmentTime
  if (!appointmentTime) {
    errors.push('Appointment time is required');
  } else {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(appointmentTime)) {
      errors.push('Appointment time must be in HH:MM format');
    }
  }

  // Validate consultationType
  if (!consultationType) {
    errors.push('Consultation type is required');
  } else if (!['online', 'in-person'].includes(consultationType)) {
    errors.push('Consultation type must be either "online" or "in-person"');
  }

  // Validate optional fields
  if (req.body.reasonForVisit && req.body.reasonForVisit.length > 500) {
    errors.push('Reason for visit cannot exceed 500 characters');
  }

  if (req.body.symptoms && req.body.symptoms.length > 1000) {
    errors.push('Symptoms cannot exceed 1000 characters');
  }

  if (req.body.patientPhone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(req.body.patientPhone)) {
      errors.push('Please provide a valid phone number');
    }
  }

  if (req.body.patientEmail) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(req.body.patientEmail)) {
      errors.push('Please provide a valid email address');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export const validateVoiceAppointment = (req: Request, res: Response, next: NextFunction) => {
  const { doctorId, appointmentDate, appointmentTime, consultationType, patientName, patientPhone } = req.body;
  const errors: string[] = [];

  // All regular appointment validations
  validateAppointment(req, res, (err) => {
    if (err) return;

    // Additional validations for voice appointments
    if (!patientName || typeof patientName !== 'string' || patientName.trim().length === 0) {
      errors.push('Patient name is required for voice appointments');
    } else if (patientName.length > 100) {
      errors.push('Patient name cannot exceed 100 characters');
    }

    if (!patientPhone || typeof patientPhone !== 'string') {
      errors.push('Patient phone is required for voice appointments');
    } else {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(patientPhone)) {
        errors.push('Please provide a valid phone number');
      }
    }

    // Validate voice agent data if provided
    if (req.body.voiceAgentData) {
      const { confidence } = req.body.voiceAgentData;
      if (confidence !== undefined && (typeof confidence !== 'number' || confidence < 0 || confidence > 1)) {
        errors.push('Voice agent confidence must be a number between 0 and 1');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Voice appointment validation failed',
        errors
      });
    }

    next();
  });
};

export const validateAppointmentStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  const errors: string[] = [];

  if (!status) {
    errors.push('Status is required');
  } else if (!['pending', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(status)) {
    errors.push('Status must be one of: pending, confirmed, completed, cancelled, no-show');
  }

  if (req.body.notes && req.body.notes.length > 1000) {
    errors.push('Notes cannot exceed 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Status validation failed',
      errors
    });
  }

  next();
};

export const validateDateParam = (req: Request, res: Response, next: NextFunction) => {
  const { date } = req.params;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date parameter is required'
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Date must be in YYYY-MM-DD format'
    });
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date provided'
    });
  }

  next();
};

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`
      });
    }

    // Basic MongoDB ObjectId validation (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};