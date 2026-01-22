import { getVNTime, formatDateTime } from './format-datetime';

describe('FormatDateTime Helper', () => {
  it('should format a specific date correctly in VN timezone', () => {
    // Giả sử input là giờ UTC
    const inputDate = '2023-12-25T03:00:00.000Z'; // 10:00 AM VN
    const result = formatDateTime(inputDate);
    expect(result).toBe('2023-12-25 10:00:00');
  });

  it('should return a string for current time', () => {
    const result = getVNTime();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should handle date object input', () => {
    const dateObj = new Date('2024-01-01T00:00:00.000Z'); // 7:00 AM VN
    const result = getVNTime(dateObj);
    expect(result).toBe('2024-01-01 07:00:00');
  });
});
