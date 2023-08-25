const autoBind = require('auto-bind');

const { errorResponse } = require('../../utils');

class SongsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        autoBind(this);
    }

    async postSongHandler(request, h) {
        try {
            this._validator.validateSongPayload(request.payload);

            const songId = await this._service.addSong(request.payload);

            const response = h.response({
                status: 'success',
                message: 'Lagu berhasil ditambahkan',
                data: {
                    songId
                }
            });

            response.code(201);

            return response;
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async getSongsHandler(request, h) {
        try {
            const { title, performer } = request.query;

            const songs = await this._service.getSongs(title, performer);

            return {
                status: 'success',
                data: {
                    songs
                }
            };
        } catch (error) {
            console.log(error);
            
            return errorResponse(error, h);
        }

    }

    async getSongByIdHandler(request, h) {
        try {
            const { id } = request.params;
            const song = await this._service.getSongById(id);

            return {
                status: 'success',
                data: {
                    song
                }
            };
        } catch (error) {
            return errorResponse(error, h);
        }

    }

    async putSongByIdHandler(request, h) {
        try {
            this._validator.validateSongPayload(request.payload);
            const { id } = request.params;
            
            await this._service.editSongById(id, request.payload);

            return {
                status: 'success',
                message: 'Lagu berhasil diperbarui'
            };
        } catch (error) {
            return errorResponse(error, h);
        }

    }

    async deleteSongByIdHandler(request, h) {
        try {
            const { id } = request.params;

            await this._service.deleteSongById(id);

            return {
                status: 'success',
                message: 'Lagu berhasil dihapus'
            };
        } catch (error) {
            return errorResponse(error, h);
        }

    }
}

module.exports = SongsHandler;