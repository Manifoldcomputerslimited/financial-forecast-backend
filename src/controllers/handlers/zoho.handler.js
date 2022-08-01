const { default: axios } = require('axios');

const generateZohoTokenHandler = async (req, reply) => {
    const { code } = req.body;

    try {

        const options = {
            headers: { 'Content-Type': ['application/json', 'application/json'] }
        }

        let url = `https://accounts.zoho.com/oauth/v2/token?code=${code}&client_id=1000.TJGNSOYFT192B23XTR4P5889QPF6RC&client_secret=cacd523d84375e5c039b3c9474e4c0ffd6fbd311e4&redirect_uri=http://localhost:3000&grant_type=authorization_code`;

        let resp = await axios.post(url,
            options)

        if (resp.data.error) {
            return reply.code(400).send({
                status: false,
                message: 'Invalid code',
            });
        }

        statusCode = 200;
        result = {
            status: true,
            message: "Zoho Token generated successfully",
            data: {
                ...resp.data
            }
        }

    } catch (e) {
        statusCode = e.code;
        result = {
            status: false,
            message: e.message,
        };
    }

    return reply.status(statusCode).send(result);
}

module.exports = { generateZohoTokenHandler }