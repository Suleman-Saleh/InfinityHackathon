/** Dates are stored as UTC midnight; this returns YYYY-MM-DD. */
export const toDateString = (d: Date) => d.toISOString().slice(0, 10);

export const fromDateString = (s: string) => new Date(`${s}T00:00:00.000Z`);
