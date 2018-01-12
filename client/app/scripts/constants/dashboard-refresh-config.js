export const TIME_BOUNDARY_OPTIONS = [
  { display: 'Last 15 minutes', value: { number: 15, time_unit: 'minute' } },
  { display: 'Last 30 minutes', value: { number: 30, time_unit: 'minute' } },
  { display: 'Last 1 hour', value: { number: 1, time_unit: 'hour' } },
  { display: 'Last 4 hours', value: { number: 4, time_unit: 'hour'} },
  { display: 'Last 12 hours', value: { number: 12, time_unit: 'hour' } },
  { display: 'Last 24 hours', value: { number: 24, time_unit: 'hour' } },
  { display: 'Last 7 days', value: { number: 7, time_unit: 'day' } },
  { display: 'Last 30 days', value: { number: 30, time_unit: 'day' } },
  { display: 'Last 60 days', value: { number: 60, time_unit: 'day' } },
  { display: 'Last 90 days', value: { number: 90, time_unit: 'day' } },
  { display: 'Last 6 months', value: { number: 6, time_unit: 'month' } },
  { display: 'Show all', value: { number: 0, time_unit: 'all' } }
];

export const REFRESH_INTERVALS_OPTIONS = [
  { display: '5 seconds', value: 5},
  { display: '10 seconds', value: 10},
  { display: '30 seconds', value: 30},
  { display: '45 seconds', value: 45},
  { display: '1 minute', value: 60},
  { display: '5 minutes', value: 5 * 60},
  { display: '15 minutes', value: 15 * 60},
  { display: '30 minutes', value: 30 * 60},
  { display: '1 hour', value: 1 * 60 * 60},
  { display: '2 hour', value: 2 * 60 * 60},
  { display: '12 hour', value: 12 * 60 * 60},
  { display: '1 day', value: 24 * 60 * 60}
];
