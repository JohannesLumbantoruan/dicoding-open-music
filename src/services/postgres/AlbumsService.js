const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const autoBind = require('auto-bind');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const ClientError = require('../../exceptions/ClientError');
const { mapToModel, mapAlbum } = require('../../utils');

class AlbumsService {
    constructor(cacheService) {
        this._pool = new Pool();
        this._cacheService = cacheService;

        autoBind(this);
    }

    async addAlbum({ name, year }) {
        const id = `album-${nanoid(16)}`;

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

        return mapAlbum(result.rows[0]);
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

    async editAlbumColumn(id, column, value) {
        const query = {
            text: `UPDATE albums SET ${column} = $1 WHERE id = $2 RETURNING id`,
            values: [value, id]
        };

        await this._pool.query(query);
    }

    async addLikeAlbum(albumId, userId) {
        const id = nanoid(16);

        const checkingQuery = {
            text: 'SELECT * FROM albums_users WHERE album_id = $1 AND user_id = $2',
            values: [albumId, userId]
        };

        const checkingQueryResult = await this._pool.query(checkingQuery);

        if (checkingQueryResult.rows.length !== 0) {
            throw new ClientError('Hanya boleh memberikan suka sekali pada satu album!');
        }

        const query = {
            text: 'INSERT INTO albums_users VALUES ($1, $2, $3) RETURNING id',
            values: [id, albumId, userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Gagal menyukai album');
        }

        this._cacheService.delete(`albumLike:${albumId}`)
    }

    async deleteLikeAlbum(albumId, userId) {
        const query = {
            text: 'DELETE FROM albums_users WHERE album_id = $1 AND user_id = $2 RETURNING id',
            values: [albumId, userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Gagal menghapus suka album. Id album atau user tidak ditemukan');
        }

        await this._cacheService.delete(`albumLike:${albumId}`)
    }

    async getLikeAlbum(albumId) {
        try {
            const likes = await this._cacheService.get(`albumLike:${albumId}`);

            return {
                likes,
                cache: true
            };
        } catch (error) {
            const query = {
                text: `SELECT COUNT(id) AS total
                FROM albums_users
                WHERE album_id = $1`,
                values: [albumId]
            };
    
            const result = await this._pool.query(query);
            const likes = result.rows[0].total;
    
            await this._cacheService.set(`albumLike:${albumId}`, likes);
    
            return {
                likes,
                cache: false
            };
        }
    }
}

module.exports = AlbumsService;