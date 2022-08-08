const status = require("../helpers/status");

const inviteUserOpts = {
    tags: ["Authentication"],
    description: "Invite a new user to join the application",
    body: {
        required: ["email"],
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email",
                description: "The email of the user"
            },
        }
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    logLevel: "debug",
}

const registerUserOpts = {
    tags: ["Authentication"],
    description: "Register a new user to join the application",
    body: {
        required: ["firstName", "lastName", "inviteToken", "email", "password"],
        type: "object",
        properties: {
            firstName: {
                type: "string",
                description: "The first name of the user"
            },
            lastName: {
                type: "string",
                description: "The last name of the user"
            },
            inviteToken: {
                type: "string",
                description: "The token generated when an invite is sent to a user"
            },
            email: {
                type: "string",
                format: "email",
                description: "The email of the user"
            },
            password: {
                type: "string",
                description: "The password of the user"
            },
        }
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    logLevel: "debug",
}

const loginUserOpts = {
    tags: ["Authentication"],
    description: "Login a user to the application",
    body: {
        required: ["email", "password"],
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email",
                description: "The email of the user"
            },
            password: {
                type: "string",
                description: "The password of the user"
            },
        }
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    logLevel: "debug",
}

const refreshTokenOpts = {
    tags: ["Authentication"],
    description: "A user who wants to refresh token",
    body: {
        required: ["refreshToken"],
        type: "object",
        properties: {
            refreshToken: {
                type: "string",
                description: "Token",
            },
        },
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    logLevel: "debug",
};

const getUserOpts = {
    tags: ["Authentication"],
    description: "Get the user information",
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
}

const updatePasswordOpts = {
    tags: ["Authentication"],
    description: "User who wants to change password",
    body: {
        required: ["currentPassword", "newPassword"],
        type: "object",
        properties: {
            currentPassword: {
                type: "string",
                description: "Current Password",
            },
            newPassword: {
                type: "string",
                description: "New Password",
            },
        },
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    security: [
        {
            apiKey: [],
        },
    ],
    logLevel: "debug",
};

const forgotPasswordOpts = {
    tags: ["Authentication"],
    description: "User who forgot password",
    body: {
        required: ["email"],
        type: "object",
        properties: {
            eamil: {
                type: "string",
                description: "Email address",
            },
        },
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    security: [
        {
            apiKey: [],
        },
    ],
    logLevel: "debug",
};

const resetPasswordOpts = {
    tags: ["Authentication"],
    description: "User who wants to reset password",
    body: {
        required: ["password", "token"],
        type: "object",
        properties: {
            password: {
                type: "string",
                description: "Email address",
            },
            token: {
                type: "string",
                description: "Token",
            },
        },
    },
    response: {
        200: status.success,
        204: status.noConent,
        400: status.badRequest,
        500: status.internalServer,
    },
    security: [
        {
            apiKey: [],
        },
    ],
    logLevel: "debug",
};

module.exports = {
    inviteUserOpts, registerUserOpts, loginUserOpts, refreshTokenOpts,
    getUserOpts, updatePasswordOpts, forgotPasswordOpts, resetPasswordOpts
};