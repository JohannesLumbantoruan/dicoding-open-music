const { Pool } = require('pg');
const autoBind = require('auto-bind');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
    constructor(collaborationsService) {
        this._pool = new Pool();
        this._collaborationsService = collaborationsService;

        autoBind(this);
    }

    async addPlaylist(name, userId) {
        const playlistId = `playlist-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
            values: [playlistId, name, userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Playlist gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getPlaylists(userId) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
            LEFT JOIN users ON users.id = playlists.owner
            WHERE playlists.owner = $1 OR collaborations.user_id = $1
            GROUP BY playlists.id, users.username`,
            values: [userId]
        };

        const result = await this._pool.query(query);

        return result.rows;
    }

    async deletePlaylistById(playlistId) {
        const query = {
            text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
            values: [playlistId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
        }
    }

    async verifyPlaylistOwner(playlistId, userId) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id = $1',
            values: [playlistId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }

        const playlist = result.rows[0];

        if (playlist.owner !== userId) {
            throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
        }
    }

    async getPlaylistById(playlistId) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN users
            ON playlists.owner = users.id
            WHERE playlists.id = $1`,
            values: [playlistId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }

        return result.rows[0];
    }

    async verifyPlaylistAccess(playlistId, userId) {
        try {
            await this.verifyPlaylistOwner(playlistId, userId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }

            try {
                await this._collaborationsService.verifyCollaborator({ playlistId, userId });
            } catch {
                throw error;
            }
        }
    }
}

module.exports = PlaylistsService;