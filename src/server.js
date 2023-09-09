require('dotenv').config();

const path = require('path');

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');

const ClientError = require('./exceptions/ClientError');
const CacheService = require('./services/redis/CacheService');

const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');
const StorageService = require('./services/storage/StorageService');

const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const AuthenticationValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsSongsService = require('./services/postgres/PlaylistsSongsService');
const PlaylistsActivitiesService = require('./services/postgres/PlaylistsActivitiesService');
const PlaylistsValidator = require('./validator/playlists');

const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService.');
const CollaborationsValidator = require('./validator/collaborations');

const _exports = require('./api/exports');
const producerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

const init = async () => {
    const cacheService = new CacheService();
    const storageService = new StorageService(path.resolve(__dirname, 'public/images/covers'));
    const albumsService = new AlbumsService(cacheService);
    const songsService = new SongsService();
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();
    const collaborationsService = new CollaborationsService(usersService);
    const playlistsService = new PlaylistsService(collaborationsService);
    const playlistsSongsService = new PlaylistsSongsService(songsService);
    const playlistsActivitiesService = new PlaylistsActivitiesService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*']
            }
        }
    });

    await server.register([
        {
            plugin: Jwt
        },
        {
            plugin: Inert
        }
    ]);

    server.auth.strategy('openmusic_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id
            }
        })
    });

    await server.register([
        {
            plugin: albums,
            options: {
                service: albumsService,
                storageService,
                validator: AlbumsValidator
            }
        },
        {
            plugin: songs,
            options: {
                service: songsService,
                validator: SongsValidator
            }
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator
            }
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationValidator
            }
        },
        {
            plugin: playlists,
            options: {
                playlistsService,
                playlistsSongsService,
                playlistsActivitiesService,
                validator: PlaylistsValidator
            }
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                playlistsService,
                validator: CollaborationsValidator
            }
        },
        {
            plugin: _exports,
            options: {
                producerService,
                playlistsService,
                validator: ExportsValidator
            }
        }
    ]);

    server.ext('onPreResponse', (request, h) => {
        const { response } = request;

        if (response instanceof Error) {
            if (response instanceof ClientError) {
                const newResponse = h.response({
                    status: 'fail',
                    message: response.message
                });

                newResponse.code(response.statusCode);

                return newResponse;
            }

            if (!response.isServer) {
                return h.continue;
            }

            const newResponse = h.response({
                status: 'error',
                message: 'terjadi kegagalan pada server kami'
            });

            console.log(response);
            
            newResponse.code(500);

            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();