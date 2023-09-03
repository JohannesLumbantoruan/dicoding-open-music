const { Pool } = require('pg');
const autoBind = require('auto-bind');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

const InvariantError = require('../../exceptions/InvariantError');
const AuthenticationError = require('../../exceptions/AuthenticationError');
const NotFoundError = require('../../exceptions/NotFoundError');

class UsersService {
    constructor() {
        this._pool = new Pool();

        autoBind(this);
    }

    async addUser({ username, password, fullname}) {
        await this.verifyNewUsername(username);

        const userId = `user-${nanoid(16)}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = {
            text: 'INSERT INTO users VALUES ($1, $2, $3, $4) RETURNING id',
            values: [userId, username, hashedPassword, fullname]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new InvariantError('User gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async verifyNewUsername(username) {
        const query = {
            text: 'SELECT username FROM users WHERE username = $1',
            values: [username]
        };

        const result = await this._pool.query(query);

        if (result.rows.length > 0) {
            throw new InvariantError('GAgal menambahkan users. Username telah digunakan.');
        }
    }

    async verifyUserCredential(username, password) {
        const query = {
            text: 'SELECT id, password FROM users WHERE username = $1',
            values: [username]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new AuthenticationError('Kredensial yang Anda berikan salah');
        }

        const { id, password: hashedPassword } = result.rows[0];

        const match = await bcrypt.compare(password, hashedPassword);

        if (!match) {
            throw new AuthenticationError('Kredensial yang aAnda berikan salah');
        }

        return id;
    }

    async getUserById(userId) {
        const query = {
            text: 'SELECT * FROM users WHERE id = $1',
            values: [userId]
        };

        const result = await this._pool.query(query);

        if (result.rows.length === 0) {
            throw new NotFoundError('User tidak ditemukan');
        }

        return result.rows[0];
    }
}

module.exports = UsersService;