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

const updatePasswordOpts = {
    schema: authSchema.updatePasswordOpts,
    handler: authController.updatePasswordHandler,
}

const forgotPasswordOpts = {
    schema: authSchema.forgotPasswordOpts,
    handler: authController.forgotPasswordHandler,
}

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

    // forgot password
    fastify.post('/password/forgot', forgotPasswordOpts);

    // reset password
    fastify.post('/password/reset', resetPasswordOpts);

    fastify.register(require("@fastify/auth"))
        .after(() => privateRoutes(fastify))
}


const privateRoutes = async (fastify, options) => {

    // view my profile
    fastify.get('/me', {
        preHandler: fastify.auth([verifyToken]),
        ...getUserOpts,
    });

    // update user password
    fastify.post("/password/update", {
        preHandler: fastify.auth([verifyToken]),
        ...updatePasswordOpts
    })
}

module.exports = authRoutes;