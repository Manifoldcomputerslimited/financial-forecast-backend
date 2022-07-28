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

module.exports = { inviteUserOpts, registerUserOpts, loginUserOpts };