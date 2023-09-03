/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('playlists_songs', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true
        },
        playlist_id: {
            type: 'VARCHAR(50)',
            references: 'playlists',
            onDelete: 'cascade',
            notNull: true
        },
        song_id: {
            type: 'VARCHAR(50)',
            references: 'songs',
            onDelete: 'cascade',
            notNull: true
        }
    });
};

exports.down = pgm => {
    pgm.dropTable('playlists_songs');
};
