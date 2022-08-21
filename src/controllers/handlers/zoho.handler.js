const { default: axios } = require('axios');

const openingBalanceHandler = async (req, reply) => {

    try {
        let res;
        let zohoAccessToken = req.body.zohoAccessToken;

        console.log(zohoAccessToken)

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        console.log(options)

        let url = `${process.env.ZOHO_BOOK_BASE_URL}/settings/openingbalances?organization_id=${process.env.ORGANIZATION_ID}`;

        res = await axios.get(url, options);

       // console.log('i got inisde', res)

        if (res.data.error)
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch opening balance',
            });

        statusCode = 200;

        result = {
            status: true,
            message: 'Opening balance fetched successfully',
            data: res.data.opening_balance.total,
        }
    } catch (e) {
        statusCode = e.response.status;
        result = {
            status: false,
            message: e.response.data.message,
        };
    }

    return reply.status(statusCode).send(result);
}

module.exports = { openingBalanceHandler }