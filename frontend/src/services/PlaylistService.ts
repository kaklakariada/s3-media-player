import { S3Object } from "./S3Service";



export interface Playlist {
    findItem(path: string): PlaylistItem | undefined;
    items: PlaylistItem[]
}

export interface PlaylistItem {
    track: S3Object;
    prev?: PlaylistItem;
    next?: PlaylistItem;
}

export class PlaylistService {
    createPlaylist(objects: S3Object[]): Playlist {
        const items: PlaylistItem[] = [];
        let prev: PlaylistItem | undefined = undefined;
        let next: PlaylistItem | undefined = undefined;
        let current: PlaylistItem | undefined = undefined;
        for (let i = 0; i < objects.length; i++) {
            next = i < objects.length ? { track: objects[i + 1] } : undefined;
            current = { track: objects[i], prev, next };
            if (prev) {
                prev.next = current;
            }
            if (next) {
                next.prev = current;
            }
            items.push(current);
            prev = current;
        }
        return {
            items, findItem: (path) => items.find(item => item.track.key === path)
        };
    }
}

