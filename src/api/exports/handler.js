const autoBind = require('auto-bind');

class ExportsHandler {
    constructor(producerService, playlistsService, validator) {
        this._producerService = producerService;
        this._playlistsService = playlistsService;
        this._validator = validator;

        autoBind(this);
    }

    async postExportPlaylistHandler(request, h) {
        this._validator.validateExportPlaylistPayload(request.payload);

        const { id: userId } = request.auth.credentials;

        const { playlistId } = request.params;

        await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

        const message = {
            playlistId,
            targetEmail: request.payload.targetEmail
        };

        await this._producerService.sendMessage('export:playlist', JSON.stringify(message));

        const response = h.response({
            status: 'success',
            message: 'Permintaan Anda dalam antrean'
        });

        response.code(201);

        return response;
    }
}

module.exports = ExportsHandler;