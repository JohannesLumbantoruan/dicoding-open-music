/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('albums_users', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true
        },
        album_id: {
            type: 'VARCHAR(50)',
            references: 'albums',
            onDelete: 'cascade',
            notNull: true
        },
        user_id: {
            type: 'VARCHAR(50)',
            references: 'users',
            onDelete: 'cascade',
            notNull: true
        }
    });

    pgm.addConstraint('albums_users', 'unique_album_id_and_user_id', 'UNIQUE(album_id, user_id)');
};

exports.down = pgm => {
    pgm.dropTable('albums_users');
};
