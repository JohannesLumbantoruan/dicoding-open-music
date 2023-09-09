const InvariantError = require('../../exceptions/InvariantError');
const { AlbumPayloadSchema, ImageHeaderSchema } = require('./schema');

const AlbumsValidator = {
    validateAlbumPayload: (payload) => {
        const validationResult = AlbumPayloadSchema.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    },
    validateImageHeaders: (payload) => {
        const validationResult = ImageHeaderSchema.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    }
};

module.exports = AlbumsValidator;