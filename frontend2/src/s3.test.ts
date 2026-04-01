import { describe, expect, it } from 'vitest';
import { basename } from './s3';

describe('basename', () => {
    it('returns last segment for files', () => {
        expect(basename('music/album/track.mp3')).toBe('track.mp3');
    });

    it('returns folder name for folder prefixes', () => {
        expect(basename('music/album/')).toBe('album');
    });

    it('returns input for single segment paths', () => {
        expect(basename('track.mp3')).toBe('track.mp3');
        expect(basename('folder/')).toBe('folder');
    });
});
