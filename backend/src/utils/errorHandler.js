export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    console.error('--- GLOBAL ERROR HANDLER ---');
    console.error(err);
    console.error('--------------------------');
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message || 'Something went very wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
