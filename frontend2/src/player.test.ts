import { describe, expect, it } from 'vitest';
import { clampVolume } from './player';

describe('clampVolume', () => {
    it('clamps values below range to 0', () => {
        expect(clampVolume(-0.5)).toBe(0);
    });

    it('returns values within range unchanged', () => {
        expect(clampVolume(0)).toBe(0);
        expect(clampVolume(0.25)).toBe(0.25);
        expect(clampVolume(1)).toBe(1);
    });

    it('clamps values above range to 1', () => {
        expect(clampVolume(1.5)).toBe(1);
    });
});
