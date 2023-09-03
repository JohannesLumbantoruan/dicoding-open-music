const { Pool } = require('pg');
const autoBind = require('auto-bind');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

const { mapToModel } = require('../../utils');

class SongsService {
    constructor() {
        this._pool = new Pool();

        autoBind(this);
    }

    async addSong(payload) {
        const {
            title,
            year,
            genre,
            performer,
            duration = null,
            albumId = null
        } = payload;

        const songId = `song-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO songs VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            values: [songId, title, year, genre, performer, duration, albumId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Lagu gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getSongs(title, performer) {
        if (title && performer) {
            const query = {
                text: 'SELECT * FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
                values: [`%${title}%`, `%${performer}%`]
            };

            const result = await this._pool.query(query);

            return result.rows.map(mapToModel);
        }

        if (title && !performer) {
            const query = {
                text: 'SELECT * FROM songs WHERE title ILIKE $1',
                values: [`%${title}%`]
            };

            const result = await this._pool.query(query);

            return result.rows.map(mapToModel);
        }

        if (!title && performer) {
            const query = {
                text: 'SELECT * FROM songs WHERE performer ILIKE $1',
                values: [`%${performer}%`]
            };

            const result = await this._pool.query(query);

            return result.rows.map(mapToModel);
        }

        const result = await this._pool.query('SELECT * FROM songs');

        return result.rows.map(mapToModel);
    }

    async getSongById(id) {
        const query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [id]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Lagu tidak ditemukan');
        }

        return result.rows[0];
    }

    async editSongById(id, payload) {
        const {
            title,
            year,
            genre,
            performer,
            duration = null,
            albumId = null
        } = payload;

        const query = {
            text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, "albumId" = $6 WHERE id = $7 RETURNING id',
            values: [title, year, genre, performer, duration, albumId, id]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Lagu gagal diperbarui. Id tidak ditemukan');
        }
    }

    async deleteSongById(id) {
        const query = {
            text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
            values: [id]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
        }
    }
}

module.exports = SongsService;