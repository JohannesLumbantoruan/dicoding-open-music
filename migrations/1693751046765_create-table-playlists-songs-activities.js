/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('playlists_activities', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true
        },
        playlist_id: {
            type: 'VARCHAR(50)',
            references: 'playlists',
            notNull: true,
            onDelete: 'cascade'
        },
        song_id: {
            type: 'VARCHAR(50)',
            notNull: true
        },
        user_id: {
            type: 'VARCHAR(50)',
            notNull: true
        },
        action: {
            type: 'TEXT',
            notNull: true
        },
        time: {
            type: 'TEXT',
            notNull: true
        }
    });
};

exports.down = pgm => {
    pgm.dropTable('playlists_activities');
};