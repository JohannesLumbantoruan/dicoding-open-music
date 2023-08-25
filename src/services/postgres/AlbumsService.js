const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const autoBind = require('auto-bind');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapToModel } = require('../../utils');

class AlbumsService {
    constructor() {
        this._pool = new Pool();

        autoBind(this);
    }

    async addAlbum({ name, year }) {
        const id = 'album-' + nanoid(16);

        const query = {
            text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING id',
            values: [id, name, year]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Album gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getAlbums() {
        const result = await this._pool.query('SELECT * FROM albums');

        return result.rows;
    }

    async getAlbumById(id) {
        const query = {
            text: 'SELECT * FROM albums WHERE id = $1',
            values: [id]
        };

        const songQuery = {
            text: 'SELECT * FROM songs WHERE "albumId" = $1',
            values: [id]
        };

        const result = await this._pool.query(query);
        const songResult = await this._pool.query(songQuery);

        if (result.rows.length === 0) {
            throw new NotFoundError('Album tidak ditemukan.')
        }

        result.rows[0].songs = songResult.rows.map(mapToModel);

        return result.rows[0];
    }

    async editAlbumById(id, { name, year }) {
        const query = {
            text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
            values: [name, year, id]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
        }
    }

    async deleteAlbumById(id) {
        const query = {
            text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
            values: [id]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
        }
    }
}

module.exports = AlbumsService;