const { default: axios } = require('axios');

const db = require("../../models");
const Invoice = db.invoices;
const InvoiceForecast = db.invoiceForecasts;
const Bill = db.bills;
const BillForecast = db.billForecasts;


let moment = require('moment');
moment().format();

const getInvoice = async (options) => {
    let date = moment();
    let forecastNumber = 3; // get this data from the frontend
    let forecastPeriod = 'month'; // get this data from the frontend

    let startDate
    let endDate

    let invoices = [
        // [
        //     {
        //         "invoice_id": "2597328000006005805",
        //         "customer_name": "FOUNTAIN HEIGHT SECONDARY SCHOOL",
        //         "customer_id": "2597328000000095823",
        //         "company_name": "FOUNTAIN HEIGHT SECONDARY SCHOOL",
        //         "status": "paid",
        //         "invoice_number": "INV-000660",
        //         "reference_number": "FOUNTAIN HEIGHT SECONDARY SCH",
        //         "date": "2022-07-14",
        //         "due_date": "2022-07-17",
        //         "due_days": "",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-08-02T15:26:50+0100",
        //         "transaction_type": "",
        //         "total": 220805.00,
        //         "balance": 1000.00,
        //         "created_time": "2022-08-02T15:24:28+0100",
        //         "exchange_rate": 1.00
        //     },
        //     {
        //         "invoice_id": "2597328000006005001",
        //         "customer_name": "CONSOLIDATED HALLMARK INSURANCE PLC",
        //         "customer_id": "2597328000000160554",
        //         "company_name": "CONSOLIDATED HALLMARK INSURANCE PLC",
        //         "status": "paid",
        //         "invoice_number": "INV-000657",
        //         "reference_number": "Consolidated Hallmark _15/7/2022",
        //         "date": "2022-07-21",
        //         "due_date": "2022-07-21",
        //         "due_days": "",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-08-01T18:45:23+0100",
        //         "transaction_type": "",
        //         "total": 155875.00,
        //         "balance": 500000.00,
        //         "created_time": "2022-08-01T18:40:39+0100",
        //         "exchange_rate": 1.00
        //     },
        //     {
        //         "invoice_id": "2597328000006005805",
        //         "customer_name": "FOUNTAIN HEIGHT SECONDARY SCHOOL",
        //         "customer_id": "2597328000000095823",
        //         "company_name": "FOUNTAIN HEIGHT SECONDARY SCHOOL",
        //         "status": "paid",
        //         "invoice_number": "INV-000660",
        //         "reference_number": "FOUNTAIN HEIGHT SECONDARY SCH",
        //         "date": "2022-07-14",
        //         "due_date": "2022-07-17",
        //         "due_days": "",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-08-02T15:26:50+0100",
        //         "transaction_type": "",
        //         "total": 220805.00,
        //         "balance": 1000.00,
        //         "created_time": "2022-08-02T15:24:28+0100",
        //         "exchange_rate": 1.00
        //     },
        // ],
        // [
        //     {
        //         "invoice_id": "2597328000006330149",
        //         "customer_name": "HUAWEI TECHNOLOGIES COMPANY NIGERIA LTD",
        //         "customer_id": "2597328000000095977",
        //         "company_name": "HUAWEI TECHNOLOGIES COMPANY NIGERIA LTD",
        //         "status": "overdue",
        //         "invoice_number": "INV-000692",
        //         "reference_number": "Funded Head Service Charge",
        //         "date": "2022-08-30",
        //         "due_date": "2022-08-30",
        //         "due_days": "Overdue by 4 days",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-09-02T18:32:47+0100",
        //         "transaction_type": "",
        //         "total": 135000.00,
        //         "balance": 135000.00,
        //         "created_time": "2022-08-30T17:27:28+0100",
        //         "exchange_rate": 1.00
        //     },
        //     {
        //         "invoice_id": "2597328000006277339",
        //         "customer_name": "SHELL NIGERIA EXPLORATION COMPANY- EPROCUREMENT",
        //         "customer_id": "2597328000000096307",
        //         "company_name": "SHELL NIGERIA EXPLORATION COMPANY EPROCUREMENT",
        //         "status": "overdue",
        //         "invoice_number": "INV-000688",
        //         "reference_number": "PCARD 2531 SNEPCO",
        //         "date": "2022-08-25",
        //         "due_date": "2022-08-28",
        //         "due_days": "Overdue by 6 days",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-09-01T08:30:44+0100",
        //         "transaction_type": "",
        //         "total": 320719.95,
        //         "balance": 320719.95,
        //         "created_time": "2022-08-25T14:55:32+0100",
        //         "exchange_rate": 1.00
        //     },
        //     {
        //         "invoice_id": "2597328000006277019",
        //         "customer_name": "SHELL NIGERIA EXPLORATION COMPANY- EPROCUREMENT",
        //         "customer_id": "2597328000000096307",
        //         "company_name": "SHELL NIGERIA EXPLORATION COMPANY EPROCUREMENT",
        //         "status": "overdue",
        //         "invoice_number": "INV-000687",
        //         "reference_number": "PCARD_2536 SNEPCO",
        //         "date": "2022-08-24",
        //         "due_date": "2022-08-27",
        //         "due_days": "Overdue by 7 days",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-08-26T08:14:16+0100",
        //         "transaction_type": "",
        //         "total": 1020345.31,
        //         "balance": 1020345.31,
        //         "created_time": "2022-08-25T11:42:57+0100",
        //         "exchange_rate": 1.00
        //     },
        //     {
        //         "invoice_id": "2597328000006232009",
        //         "customer_name": "SHELL NIGERIA EXPLORATION COMPANY- EPROCUREMENT",
        //         "customer_id": "2597328000000096307",
        //         "company_name": "SHELL NIGERIA EXPLORATION COMPANY EPROCUREMENT",
        //         "status": "overdue",
        //         "invoice_number": "INV-000681",
        //         "reference_number": "PCARD 2270 SNEPCO",
        //         "date": "2022-08-22",
        //         "due_date": "2022-08-25",
        //         "due_days": "Overdue by 9 days",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-08-24T08:12:19+0100",
        //         "transaction_type": "",
        //         "total": 148816.31,
        //         "balance": 148816.31,
        //         "created_time": "2022-08-22T13:21:59+0100",
        //         "exchange_rate": 1.00
        //     },
        // ],
        // [
        //     {
        //         "invoice_id": "2597328000006371055",
        //         "customer_name": "HUAWEI TECHNOLOGIES COMPANY NIGERIA LTD",
        //         "customer_id": "2597328000000095977",
        //         "company_name": "HUAWEI TECHNOLOGIES COMPANY NIGERIA LTD",
        //         "status": "pending_approval",
        //         "invoice_number": "INV-000694",
        //         "reference_number": " SUBCONTRACTORPO_ 01583   ",
        //         "date": "2022-09-02",
        //         "due_date": "2022-09-02",
        //         "due_days": "",
        //         "currency_id": "2597328000000073082",
        //         "currency_code": "NGN",
        //         "currency_symbol": "NGN",
        //         "type": "invoice",
        //         "updated_time": "2022-09-02T18:51:01+0100",
        //         "transaction_type": "",
        //         "total": 4298808.15,
        //         "balance": 4298808.15,
        //         "created_time": "2022-09-02T18:51:01+0100",
        //         "exchange_rate": 1.00
        //     },
        // ],
    ]

    // let dollar;

    // monthly / yearly forecast
    for (i = -2; i < forecastNumber; i++) {

        if (i < 0) {
            startDate = date.clone().subtract(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().subtract(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
        }

        if (i > 0) {
            startDate = date.clone().add(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().add(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
        }


        // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
        let url = `${process.env.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${process.env.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}`

        resp = await axios.get(url, options);


        invoices.push(resp.data.invoices)

    }

    // TODO:: come up with a better solution. Currently n ^ 2
    for (const [i, invoice] of invoices.entries()) {
        let naira = 0;
        let dollar = 0;

        if (i > -2 && i < 2) {
            startDate = date.clone().subtract(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }
        for (const e of invoice) {

            if (e.currency_code === 'USD') {
                dollar = e.balance
                naira = e.balance * e.exchange_rate
            }

            if (e.currency_code === 'NGN') {
                naira = e.balance
                // get this from exchange rate endpoint
                dollar = (e.balance / 420)
            }

            const payload = {
                invoiceId: e.invoice_id,
                customerName: e.customer_name,
                status: e.status,
                invoiceNumber: e.invoice_number,
                refrenceNumber: e.reference_number,
                date: e.date,
                dueDate: e.due_date,
                currencyCode: e.currency_code,
                balance: e.balance,
                naira: naira,
                dollar: dollar,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Invoice.create(
                payload
            );

        }

        dollarClosingBalance = invoice.reduce(function (acc, obj) {
            if (obj.currency_code === 'USD') {
                dollar = obj.balance
            }

            if (obj.currency_code === 'NGN') {
                // naira = obj.balance
                // get this from exchange rate endpoint
                dollar = (obj.balance / 420)
            }


            return acc + dollar
        }, 0);

        nairaClosingBalance = invoice.reduce(function (acc, obj) {
            if (obj.currency_code === 'USD') {
                naira = obj.balance * obj.exchange_rate
            }

            if (obj.currency_code === 'NGN') {
                naira = obj.balance
            }


            return acc + naira
        }, 0);

        await InvoiceForecast.create(
            {
                nairaClosingBalance: nairaClosingBalance,
                dollarClosingBalance: dollarClosingBalance,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }
        );

    
    
    
    }

}

const getBill = async (options) => {
    let date = moment();
    let forecastNumber = 3; // get this data from the frontend
    let forecastPeriod = 'month'; // get this data from the frontend

    let startDate;
    let endDate;

    let bills = [];

    for (i = -2; i < forecastNumber; i++) {
        if (i < 0) {
            startDate = date.clone().subtract(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().subtract(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
        }

        if (i > 0) {
            startDate = date.clone().add(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().add(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
        }

         // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
         let url = `${process.env.ZOHO_BOOK_BASE_URL}/bills?organization_id=${process.env.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}`

         resp = await axios.get(url, options);
 
 
         bills.push(resp.data.bills)
    }

    // TODO:: come up with a better solution. Currently n ^ 2
    for (const [i, bill] of bills.entries()) {
        let naira = 0;
        let dollar = 0;

        if (i > -2 && i < 2) {
            startDate = date.clone().subtract(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }
        for (const e of bill) {

            if (e.currency_code === 'USD') {
                dollar = e.balance
                naira = e.balance * e.exchange_rate
            }

            if (e.currency_code === 'NGN') {
                naira = e.balance
                // get this from exchange rate endpoint
                dollar = (e.balance / 420)
            }

            const payload = {
                billId: e.bill_id,
                vendorId: e.vendor_id,
                vendorName: e.vendor_name,
                status: e.status,
                invoiceNumber: e.invoice_number,
                refrenceNumber: e.reference_number,
                date: e.date,
                dueDate: e.due_date,
                currencyCode: e.currency_code,
                balance: e.balance,
                naira: naira,
                dollar: dollar,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Bill.create(
                payload
            );

        }

        dollarClosingBalance = bill.reduce(function (acc, obj) {
            if (obj.currency_code === 'USD') {
                dollar = obj.balance
            }

            if (obj.currency_code === 'NGN') {
                // naira = obj.balance
                // get this from exchange rate endpoint
                dollar = (obj.balance / 420)
            }


            return acc + dollar
        }, 0);

        nairaClosingBalance = bill.reduce(function (acc, obj) {
            if (obj.currency_code === 'USD') {
                naira = obj.balance * obj.exchange_rate
            }

            if (obj.currency_code === 'NGN') {
                naira = obj.balance
            }


            return acc + naira
        }, 0);

        await BillForecast.create(
            {
                nairaClosingBalance: nairaClosingBalance,
                dollarClosingBalance: dollarClosingBalance,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }
        );

    
    
    
    }
}

const openingBalanceHandler = async (req, reply) => {

    try {
        let res;
        let invoiceBalance;
        let billsBalance;
        let zohoAccessToken = req.body.zohoAccessToken;


        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        invoiceBalance = await getInvoice(options);

        billsBalance = await getBill(options);



    } catch (e) {
        console.log(e)
        // statusCode = e.response.status;
        // result = {
        //     status: false,
        //     message: e.response.data.message,
        // };
    }

    // return reply.status(statusCode).send(result);
}


const salesOrderHandler = async (req, reply) => {

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

        let url = `${process.env.ZOHO_BOOK_BASE_URL}/salesorders?organization_id=${process.env.ORGANIZATION_ID}`;

        res = await axios.get(url, options);

        if (res.data.error)
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch sales order',
            });

        statusCode = 200;

        result = {
            status: true,
            message: 'Sales fetched successfully',
            data: res.data,
        }
    } catch (e) {
        console.log(e)
        statusCode = e.response.status;
        result = {
            status: false,
            message: e.response.data.message,
        };
    }

    return reply.status(statusCode).send(result);
}


module.exports = { openingBalanceHandler, salesOrderHandler }