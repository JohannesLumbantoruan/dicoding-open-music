const ClientError = require('../exceptions/ClientError');

exports.errorResponse = (error, h) => {
    if (error instanceof ClientError) {
        const response = h.response({
            status: 'fail',
            message: error.message
        });

        response.code(error.statusCode);

        return response;
    }

    const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.'
    });

    response.code(500);

    return response;
}

exports.mapToModel = ({ id, title, performer}) => ({
    id,
    title,
    performer
});