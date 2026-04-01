import { describe, expect, it } from 'vitest';
import { fmtTime } from './app';

describe('fmtTime', () => {
    it('formats invalid values as 0:00', () => {
        expect(fmtTime(Number.NaN)).toBe('0:00');
        expect(fmtTime(-1)).toBe('0:00');
    });

    it('formats values under one hour as m:ss', () => {
        expect(fmtTime(0)).toBe('0:00');
        expect(fmtTime(65)).toBe('1:05');
        expect(fmtTime(3599)).toBe('59:59');
    });

    it('formats values over one hour as h:mm:ss', () => {
        expect(fmtTime(3600)).toBe('1:00:00');
        expect(fmtTime(3665)).toBe('1:01:05');
        expect(fmtTime(7322)).toBe('2:02:02');
    });
});
