import { createLogger, format, transports, config } from 'winston';

// Extract winston members to be used below
const { combine, timestamp, printf, colorize } = format;
const { levels } = config.npm;

// Custom format copied from winston examples
const customFormat = printf(({ level, message, timestamp, label }) => {
	const labelPart = label ? ` [${label}]` : '';
	return `${timestamp}${labelPart} ${level}: ${message}`;
});

// Filter for levels between 'info' and 'error' (exclusive of error)
const infoRangeFilter = format((transform) => {
	const priority = levels[transform.level];
	const { info, error } = levels;

	// In Winston npm levels: error=0, warn=1, info=2
	// We want levels strictly more severe than 'info' but less severe than 'error'
	return priority <= info && priority > error ? transform : false;
});

// Filter for 'error' and more severe levels
const errorRangeFilter = format((transform) => {
	const priority = levels[transform.level];
	const { error } = levels;

	return priority <= error ? transform : false;
});

// Filter for debug and other lower priority levels
const debugRangeFilter = format((transform) => {
	const priority = levels[transform.level];
	const { info } = levels;

	return priority > info ? transform : false;
});

// Instantiate Winston logger with custom configuration
const logger = createLogger({
	format: combine(timestamp(), customFormat),
	transports: [
		new transports.File({
			filename: 'logs/info.log',
			level: 'info',
			format: combine(infoRangeFilter(), timestamp(), customFormat)
		}),
		new transports.File({
			filename: 'logs/error.log',
			level: 'error',
			format: combine(errorRangeFilter(), timestamp(), customFormat)
		}),
		new transports.File({
			filename: 'logs/debug.log',
			level: 'debug',
			format: combine(debugRangeFilter(), timestamp(), customFormat)
		})
	]
});

// *Additional* console logging for development mode
if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new transports.Console({
			format: combine(colorize(), timestamp(), customFormat)
		})
	);
}

export default logger;
