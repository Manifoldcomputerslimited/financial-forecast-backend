const authController = require('../controllers/handlers/auth.handler');
const authSchema = require('../schemas/auth.schema');

const inviteUserOpts = {
    schema: authSchema.inviteUserOpts,
    handler: authController.inviteUserHandler,
}

const registerUserOpts = {
}

const loginUserOpts = {
}

const resetPasswordOpts = {
}

const authRoutes = async (fastify, options) => {
    // invite a new user
    fastify.post('/invite', inviteUserOpts);
}

module.exports = authRoutes;