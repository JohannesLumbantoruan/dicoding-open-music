const autoBind = require('auto-bind');

const { errorResponse } = require('../../utils');

class CollaborationsHandler {
    constructor(collaborationsService, playlistsService, validator) {
        this._collaborationsService = collaborationsService;
        this._playlistsService = playlistsService;
        this._validator = validator;

        autoBind(this);
    }

    async postCollaborationHandler(request, h) {
        try {
            this._validator.validatePostCollaborationPayload(request.payload);

            const { playlistId, userId } = request.payload;
            const { id: owner } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistOwner(playlistId, owner);

            const collaborationId = await this._collaborationsService.addCollaboration({ playlistId, userId });

            const response = h.response({
                status: 'success',
                message: 'Kolaborasi berhasil ditambahkan',
                data: {
                    collaborationId
                }
            });

            response.code(201);

            return response;
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async deleteCollaborationHandler(request, h) {
        try {
            this._validator.validateDeleteCollaborationPayload(request.payload);

            const { playlistId, userId } = request.payload;
            const { id: owner } = request.auth.credentials;

            await this._playlistsService.verifyPlaylistOwner(playlistId, owner);

            await this._collaborationsService.deleteCollaborationById({ playlistId, userId });

            return {
                status: 'success',
                message: 'Kolaborasi berhasil dihapus'
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }
}

module.exports = CollaborationsHandler;