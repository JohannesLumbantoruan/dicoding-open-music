const autoBind = require('auto-bind');

const { errorResponse } = require('../../utils');

class AlbumsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        autoBind(this);
    }

    async postAlbumHandler(request, h) {
        try {
            this._validator.validateAlbumPayload(request.payload);

            const { name, year } = request.payload;
            const albumId = await this._service.addAlbum({ name, year });

            const response = h.response({
                status: 'success',
                data: {
                    albumId
                }
            });

            response.code(201);

            return response;
        } catch (error) {            
            return errorResponse(error, h);
        }
    }

    async getAlbumsHandler(request, h) {
        try {
            const albums = await this._service.getAlbums();

            return {
                status: 'success',
                data: {
                    albums
                }
            };
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async getAlbumByIdHandler(request, h) {
        try {
            const { id } = request.params;
            const album = await this._service.getAlbumById(id);

            return {
                status: 'success',
                data: {
                    album
                }
            }
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async putAlbumByIdHandler(request, h) {
        try {
            this._validator.validateAlbumPayload(request.payload);
            const { id } = request.params;

            await this._service.editAlbumById(id, request.payload);

            return {
                status: 'success',
                message: 'Album berhasil diperbarui'
            }
        } catch (error) {
            return errorResponse(error, h);
        }
    }

    async deleteAlbumByIdHandler(request, h) {
        try {
            const { id } = request.params;

            await this._service.deleteAlbumById(id);

            return {
                status: 'success',
                message: 'Album berhasil dihapus'
            }
        } catch (error) {
            return errorResponse(error, h);
        }
    }
}

module.exports = AlbumsHandler;