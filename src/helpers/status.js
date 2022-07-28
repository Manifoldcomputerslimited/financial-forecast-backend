const badRequest = {
    type: "object",
    description: "Bad Request",
    properties: {
        status: { type: "boolean" },
        message: { type: "string" },
    },
};

const internalServer = {
    type: "object",
    description: "Internal Server Error",
    properties: {
        status: { type: "boolean" },
        message: { type: "string" },
    },
};

const noConent = {
    type: "object",
    description: "No Content",
    properties: {
        status: { type: "boolean" },
        message: { type: "string" },
    },
};

const success = {
    type: "object",
    description: "OK",
    properties: {
        status: { type: "boolean" },
        message: { type: "string" },
        data: {},
    },
};

const created = {
    type: "object",
    description: "Created",
    properties: {
        status: { type: "boolean" },
        message: { type: "string" },
    },
};
module.exports = { badRequest, internalServer, noConent, success, created };
