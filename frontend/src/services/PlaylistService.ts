import { S3Object } from "./MediaService";

export interface Playlist {
    readonly items: PlaylistItem[]
    findItem(path: string): PlaylistItem | undefined;
}

interface MutablePlaylistItem {
    track: S3Object;
    prev?: PlaylistItem;
    next?: PlaylistItem;
    equals(other: PlaylistItem | undefined): boolean;
}
export type PlaylistItem = Readonly<MutablePlaylistItem>;

function createItem(track: S3Object | undefined): PlaylistItem {
    if (!track) {
        throw Error("Track is not defined");
    }
    return {
        track,
        equals: (other: PlaylistItem) => other && track.bucket === other.track.bucket && track.key === other.track.key,
    };
}

export class PlaylistService {
    createPlaylist(objects: S3Object[]): Playlist {
        const items: PlaylistItem[] = [];
        let prev: MutablePlaylistItem | undefined = undefined;
        let next: MutablePlaylistItem | undefined = undefined;
        let current: MutablePlaylistItem | undefined = undefined;
        for (let i = 0; i < objects.length; i++) {
            next = i + 1 < objects.length ? createItem(objects[i + 1]) : undefined;
            current = createItem(objects[i]);
            current.next = next;
            current.prev = prev;
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
            items,
            findItem: (path) => items.find(item => item.track.key === path),
        };
    }
}

