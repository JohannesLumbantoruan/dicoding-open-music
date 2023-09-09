const config = {
    rabbitMq: {
        server: process.env.RABBITMQ_SERVER
    },
    redis: {
        host: process.env.REDIS_SERVER
    }
};

module.exports = config;