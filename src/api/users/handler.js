const autoBind = require('auto-bind');
const { errorResponse } = require('../../utils');

class UsersHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        autoBind(this);
    }

    async postUserHandler(request, h) {
        try {
            // console.log(request.payload);

            await this._validator.validateUserPayload(request.payload);

            const userId = await this._service.addUser(request.payload);

            const response = h.response({
                status: 'success',
                message: 'User berhasil ditambahkan',
                data: {
                    userId
                }
            });

            response.code(201);

            return response;
        } catch (error) {
            return errorResponse(error, h);
        }
    }
}

module.exports = UsersHandler;