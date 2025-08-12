import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture original res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Don't log health check requests to reduce noise
    if (req.path !== '/api/health') {
      const logData = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length') || 0
      };

      // Add user info if authenticated
      if (req.user) {
        logData.user = {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        };
      }

      // Log based on status code
      if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};
