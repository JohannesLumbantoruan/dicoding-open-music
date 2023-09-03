const autoBind = require('auto-bind');
const { errorResponse } = require('../../utils');

class PlaylistsHandler {
    constructor(playlistsService, playlistsSongsService, playlistsActivitiesService, validator) {
        this._playlistsService = playlistsService;
        this._playlistsSongsService = playlistsSongsService;
        this._playlistsActivitiesService = playlistsActivitiesService;
        this._validator = validator;

        autoBind(this);
    }

    async postPlaylistHandler(request, h) {
        try {
            this._validator.validatePostPlaylistPayload(request.payload);

            const { name } = request.payload;
            const { id } = request.auth.credentials;

            const playlistId = await this._playlistsService.addPlaylist(name, id);

            const response = h.response({
                status: 'success',
                message: 'Playlist berhasil ditambahkan',
                data: {
                    playlistId
                }
            });

            response.code(201);

            return response;
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async getPlaylistsHandler(request, h) {
        try {
            const { id } = request.auth.credentials;

            const playlists = await this._playlistsService.getPlaylists(id);

            return {
                status: 'success',
                data: {
                    playlists
                }
            };
        } catch (error) {
            console.log(error);
            return errorResponse(error, h);
        }
    }

    async deletePlaylistByIdHandler(request, h) {
        try {            
            const { id } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistOwner(id, userId);

            await this._playlistsService.deletePlaylistById(id);

            return {
                status: 'success',
                message: 'Playlist berhasil dihapus'
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async postSongToPlaylistByIdHandler(request, h) {
        try {
            this._validator.validatePostPlaylistSongPayload(request.payload);

            const { id } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistAccess(id, userId);

            const { songId } = request.payload;

            await this._playlistsSongsService.addSongToPlaylistById(id, songId);

            const activity = {
                playlistId: id,
                songId,
                userId,
                action: 'add',
                time: new Date().toISOString()
            };

            await this._playlistsActivitiesService.addPlaylistActivity(activity);

            const response = h.response({
                status: 'success',
                message: 'Lagu berhasil ditambahkan ke playlist'
            });

            response.code(201);

            return response;
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async getSongsByPlaylistIdHandler(request, h) {
        try {
            const { id } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistAccess(id, userId);

            const playlist = await this._playlistsService.getPlaylistById(id);
            const songs = await this._playlistsSongsService.getSongsByPlaylistId(id);

            playlist.songs = songs;

            return {
                status: 'success',
                data: {
                    playlist
                }
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async deleteSongFromPlaylistByIdHandler(request, h) {
        try {
            const { id } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistAccess(id, userId);

            this._validator.validateDeletePlaylistSongPayload(request.payload);

            const { songId } = request.payload;

            await this._playlistsSongsService.deleteSongFromPlaylistById(id, songId);

            const activity = {
                playlistId: id,
                songId,
                userId,
                action: 'delete',
                time: new Date().toISOString()
            };

            await this._playlistsActivitiesService.addPlaylistActivity(activity);

            return {
                status: 'success',
                message: 'Lagu berhasil dihapus dari playlist'
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async getPlaylistActivitiesHandler(request, h) {
        try {
            const { id: playlistId } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistAccess(playlistId, userId);

            const activities = await this._playlistsActivitiesService.getPlaylistActivities(playlistId);

            return {
                status: 'success',
                data: {
                    playlistId,
                    activities
                }
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }
}

module.exports = PlaylistsHandler;