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

const getUsersOpts = {
    // schema: authSchema.getUsersOpts,
    handler: authController.getUsersHandler,
};

const deleteUserOpts = {
    handler: authController.deleteUserHandler,
};

const refreshTokenOpts = {
    schema: authSchema.refreshTokenOpts,
    handler: authController.refreshTokenHandler,
};

const updatePasswordOpts = {
    schema: authSchema.updatePasswordOpts,
    handler: authController.updatePasswordHandler,
}

const updateRoleOpts = {
    //schema: authSchema.updatePasswordOpts,
    handler: authController.updateUserRoleHandler,
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

    // view all users
    fastify.get('/users', {
        preHandler: fastify.auth([verifyToken]),
        ...getUsersOpts,
    });

    // update user role
    fastify.patch("/users/role/update", {
        preHandler: fastify.auth([verifyToken]),
        ...updateRoleOpts
    })

    // update user password
    fastify.post("/password/update", {
        preHandler: fastify.auth([verifyToken]),
        ...updatePasswordOpts
    })

    // delete user role
    fastify.delete("/users/delete/:id", {
        preHandler: fastify.auth([verifyToken]),
        ...deleteUserOpts
    })

}

module.exports = authRoutes;