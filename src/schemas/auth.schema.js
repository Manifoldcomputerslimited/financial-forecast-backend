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

module.exports = { inviteUserOpts };