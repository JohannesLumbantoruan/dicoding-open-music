const PlaylistsHandler = require("./handler");
const routes = require('./routes');

module.exports = {
    name: 'playlists',
    version: '1.0.0',
    register: async (server, { playlistsService, playlistsSongsService, playlistsActivitiesService, validator }) => {
        const playlistsHandler = new PlaylistsHandler(playlistsService, playlistsSongsService, playlistsActivitiesService, validator);

        server.route(routes(playlistsHandler));
    }
}