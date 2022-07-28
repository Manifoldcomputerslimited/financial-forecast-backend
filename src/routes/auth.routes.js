const authController = require('../controllers/handlers/auth.handler');
const authSchema = require('../schemas/auth.schema');

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

const resetPasswordOpts = {
}

const authRoutes = async (fastify, options) => {
    // invite a new user
    fastify.post('/invite', inviteUserOpts);

    // register a new user
    fastify.post('/register', registerUserOpts);

    // login a user
    fastify.post('/login', loginUserOpts);
}

module.exports = authRoutes;