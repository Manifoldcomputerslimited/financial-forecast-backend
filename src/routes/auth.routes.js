const authController = require('../controllers/handlers/auth.handler');
const authSchema = require('../schemas/auth.schema');
const verifyToken = require("../controllers/auth/verifyToken");

const inviteUserOpts = {
    schema: authSchema.inviteUserOpts,
    handler: authController.inviteUserHandler,
}

const registerUserOpts = {
    schema: authSchema.registerUserOpts,
    handler: authController.registerUserHandler,
}

const loginUserOpts = {
    schema: authSchema.loginUserOpts,
    handler: authController.loginUserHandler,
}

const getUserOpts = {
    schema: authSchema.getUserOpts,
    handler: authController.getUserHandler,
};

const refreshTokenOpts = {
    schema: authSchema.refreshTokenOpts,
    handler: authController.refreshTokenHandler,
};

const resetPasswordOpts = {
    schema: authSchema.resetPasswordOpts,
    handler: authController.resetPasswordHandler,
}


const authRoutes = async (fastify, options) => {
    // invite a new user
    fastify.post('/invite', inviteUserOpts);

    // register a new user
    fastify.post('/register', registerUserOpts);

    // login a user
    fastify.post('/login', loginUserOpts);

    // refresh token
    fastify.post('/token/refresh', refreshTokenOpts);

    fastify.register(require("@fastify/auth"))
        .after(() => privateRoutes(fastify))
}


const privateRoutes = async (fastify, options) => {
    // view my profile
    fastify.get('/profile', {
        preHandler: fastify.auth([verifyToken]),
        ...getUserOpts,
    });

    // reset password
    fastify.post("/password/reset", {
        preHandler: fastify.auth([verifyToken]),
        ...resetPasswordOpts
    })
}

module.exports = authRoutes;