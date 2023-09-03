const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const autoBind = require('auto-bind');

const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
    constructor(usersService) {
        this._pool = new Pool();
        this._usersService = usersService;

        autoBind(this);
    }

    async addCollaboration({ playlistId, userId }) {
        try {
            const user = await this._usersService.getUserById(userId);
            
            const collaborationId = `collab-${nanoid(16)}`;

            const query = {
                text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
                values: [collaborationId, playlistId, userId]
            };

            const result = await this._pool.query(query);

            if (result.rows.length === 0) {
                throw new InvariantError('Gagal menambahkan kolaborasi');
            }

            return result.rows[0].id;
        } catch (error) {
            throw error;
        }
    }

    async deleteCollaborationById({ playlistId, userId }) {
        const query = {
            text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
            values: [playlistId, userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Gagal menghapus kolaborasi');
        }
    }

    async verifyCollaborator({ playlistId, userId }) {
        const query = {
            text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
            values: [playlistId, userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('Kolaborasi gagal diverifkasi');
        }
    }
}

module.exports = CollaborationsService;