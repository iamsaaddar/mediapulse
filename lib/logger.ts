export const logger = {
	info(message: string, context?: unknown) {
		console.info(message, context ?? "");
	},

	warn(message: string, context?: unknown) {
		console.warn(message, context ?? "");
	},

	error(message: string, context?: unknown) {
		console.error(message, context ?? "");
	},
};
