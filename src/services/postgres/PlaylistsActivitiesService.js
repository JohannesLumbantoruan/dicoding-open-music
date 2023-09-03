const { Pool } = require('pg');
const autoBind = require('auto-bind');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistsActivitiesService {
    constructor() {
        this._pool = new Pool();

        autoBind(this);
    }

    async addPlaylistActivity(activity) {
        const { playlistId, songId, userId, action, time } = activity;
        
        const id = nanoid(16);

        const query = {
            text: 'INSERT INTO playlists_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            values: [id, playlistId, songId, userId, action, time]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Gagal menambahkan aktivitas playlist');
        }
    }

    async getPlaylistActivities(playlistId) {
        const query = {
            text: `SELECT users.username, songs.title, playlists_activities.action, playlists_activities.time
            FROM playlists_activities
            LEFT JOIN users ON users.id = playlists_activities.user_id
            LEFT JOIN songs ON songs.id = playlists_activities.song_id
            WHERE playlists_activities.playlist_id = $1
            GROUP BY users.username, songs.title, playlists_activities.action, playlists_activities.time
            ORDER BY playlists_activities.time`,
            values: [playlistId]
        };

        const result = await this._pool.query(query);

        return result.rows;
    }
}

module.exports = PlaylistsActivitiesService;