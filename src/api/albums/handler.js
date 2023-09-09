const autoBind = require('auto-bind');

const { errorResponse } = require('../../utils');

class AlbumsHandler {
    constructor(service, storageService, validator) {
        this._service = service;
        this._validator = validator;
        this._storageService = storageService;

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
        const albums = await this._service.getAlbums();

        return {
            status: 'success',
            data: {
                albums
            }
        };
    }

    async getAlbumByIdHandler(request, h) {
        const { id } = request.params;
        const album = await this._service.getAlbumById(id);

        return {
            status: 'success',
            data: {
                album
            }
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

    async postUploadAlbumCoverHandler(request, h) {
        const { id } = request.params;

        const album = await this._service.getAlbumById(id);

        const { cover } = request.payload;

        this._validator.validateImageHeaders(cover.hapi.headers);

        const fileLocation = await this._storageService.writeFile(cover, cover.hapi);

        const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/covers/${fileLocation}`;

        await this._service.editAlbumColumn(id, 'cover_url', coverUrl);

        const response = h.response({
            status: 'success',
            message: 'Sampul berhasil diunggah'
        });

        response.code(201);

        return response;
    }

    async postLikeAlbumHandler(request, h) {
        const { id: albumId } = request.params;
        const { id: userId } = request.auth.credentials;

        await this._service.getAlbumById(albumId);

        await this._service.addLikeAlbum(albumId, userId);

        const response = h.response({
            status: 'success',
            message: 'Berhasil menyukai album'
        });

        response.code(201);

        return response;
    }

    async deleteLikeAlbumHandler(request, h) {
        const { id: albumId } = request.params;
        const { id: userId } = request.auth.credentials;

        await this._service.getAlbumById(albumId);

        await this._service.deleteLikeAlbum(albumId, userId);

        return {
            status: 'success',
            message: 'Berhasil menghapus suka album'
        };
    }

    async getLikeAlbumHandler(request, h) {
        const { id: albumId } = request.params;

        await this._service.getAlbumById(albumId);

        const { likes, cache } = await this._service.getLikeAlbum(albumId);

        const response = h.response({
            status: 'success',
            data: {
                likes: parseInt(likes)
            }
        });

        if (cache) response.header('X-Data-Source', 'cache');

        return response;
    }
}

module.exports = AlbumsHandler;