const autoBind = require('auto-bind');
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsSongsService {
    constructor(songsService) {
        this._pool = new Pool();
        this._songsService = songsService;

        autoBind(this);
    }

    async addSongToPlaylistById(playlistId, songId) {
        try {
            const song = await this._songsService.getSongById(songId); 

            const id = nanoid(16);

            const query = {
                text: 'INSERT INTO playlists_songs VALUES ($1, $2, $3) RETURNING id',
                values: [id, playlistId, songId]
            };

            const result = await this._pool.query(query);

            if (result.rows.length === 0) {
                throw new InvariantError('Gagal menambahkan lagu ke playlist');
            }
        } catch (error) {
            throw error;
        }
    }

    async getSongsByPlaylistId(playlistId) {
        const query = {
            text: `SELECT songs.id, songs.title, songs.performer
            FROM songs
            RIGHT JOIN playlists_songs
            ON playlists_songs.song_id = songs.id
            WHERE playlists_songs.playlist_id = $1
            GROUP BY songs.id`,
            values: [playlistId]
        };

        const result = await this._pool.query(query);

        return result.rows;
    }

    async deleteSongFromPlaylistById(playlistId, songId) {
        const query = {
            text: 'DELETE FROM playlists_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
            values: [playlistId, songId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Gagal menghapus lagu pada playlist. Id tidak ditemukan');
        }
    }
}

module.exports = PlaylistsSongsService;