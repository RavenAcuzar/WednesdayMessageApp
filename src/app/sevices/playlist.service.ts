import { Injectable } from "@angular/core";
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import { openSqliteDb } from "../app.utils";
import { PlaylistEntry } from "../models/playlist.models";

@Injectable()
export class PlaylistService {

    constructor(
        private sqlite: SQLite
    ) { }

    getPlaylistOf(userId: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql(`SELECT * FROM playlist WHERE memid = ?`, [userId])
        }).then(a => {
            return new Promise<PlaylistEntry[]>((resolve, reject) => {
                try {
                    let playlistEntries: PlaylistEntry[] = []
                    for (let i = 0; i < a.rows.length; i++) {
                        let playlistEntry = <PlaylistEntry>(a.rows.item(i));
                        playlistEntries.push(playlistEntry);
                    }
                    resolve(playlistEntries)
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    isVideoAddedToPlaylist(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql(`SELECT * FROM playlist WHERE memid = ? and bcid = ?`, [userId, bcid]);
        }).then(a => {
            return a.rows.length > 0;
        });
    }

    addVideoFor(userId: string, bcid: string) {
        return this.checkIfVideoIsInPlaylistOf(userId, bcid).then(isInPlaylist => {
            if (!isInPlaylist)
                return this.preparePlaylistTable()
            else
                throw new Error('already_in_playlist');
        }).then(db => {
            return db.executeSql(`INSERT INTO playlist(bcid, memid) VALUES(?, ?)`, [bcid, userId])
        }).then(a => {
            return new Promise<boolean>((resolve, reject) => {
                if (a.rowsAffected === 1){
                    resolve(true);
                }
                else if (a.rowsAffected === 0)
                    resolve(false)
                else
                    reject({ error: 'Multiple values were added!' })
            })
        })
    }

    removeVideoFromPlaylist(bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql(`DELETE FROM playlist WHERE bcid = ?`, [bcid])
        }).then(a => {
            return new Promise<boolean>((resolve, reject) => {
                if (a.rowsAffected === 1)
                    resolve(true)
                else if (a.rowsAffected === 0)
                    resolve(false)
                else
                    reject({ error: 'Multiple values were deleted!' })
            })
        })
    }

    checkIfVideoIsInPlaylistOf(userId: string, bcid: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql(`SELECT * FROM playlist WHERE memid = ? and bcid = ?`, [userId, bcid])
        }).then(a => {
            return new Promise<boolean>((resolve, reject) => {
                resolve(a.rows.length === 1)
            })
        })
    }

    private preparePlaylistTable() {
        return openSqliteDb(this.sqlite).then(db => {
            return this.createPlaylistTable(db);
        })
    }

    private createPlaylistTable(db: SQLiteObject) {
        return new Promise<SQLiteObject>((resolve, reject) => {
            try {
                db.executeSql(`CREATE TABLE IF NOT EXISTS playlist(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bcid CHAR(13) NOT NULL,
                    memid CHAR(36) NOT NULL)`, [])
                    .then(() => { resolve(db); })
                    .catch(e => { reject(e); })
            } catch (e) {
                reject(e);
            }
        });
    }
}