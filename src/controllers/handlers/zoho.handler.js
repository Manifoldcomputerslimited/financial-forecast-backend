const { default: axios } = require('axios');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const db = require("../../models");
const Invoice = db.invoices;
const InvoiceForecast = db.invoiceForecasts;
const Bill = db.bills;
const BillForecast = db.billForecasts;


let moment = require('moment');
const { Sequelize } = require('../../models');
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


        if (i > -2 && i < 2) {
            startDate = date.clone().subtract(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }
        for (const e of invoice) {


            // if (e.currency_code === 'USD') {
            //     dollar = e.balance
            //     naira = e.balance * e.exchange_rate
            // }

            // if (e.currency_code === 'NGN') {
            //     naira = e.balance
            //     // get this from exchange rate endpoint
            //     dollar = (e.balance / 420)
            // }

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
                naira: e.currency_code === 'NGN' ? e.balance : 0.0,
                dollar: e.currency_code === 'USD' ? e.balance : 0.0,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Invoice.create(
                payload
            );

        }

        dollarClosingBalance = invoice.reduce(function (acc, obj) {
            // if (obj.currency_code === 'USD') {
            //     dollar = obj.balance
            // }

            // if (obj.currency_code === 'NGN') {
            //     // naira = obj.balance
            //     // get this from exchange rate endpoint
            //     dollar = (obj.balance / 420)
            // }
            balance = obj.currency_code === 'USD' ? obj.balance : 0.0


            return acc + balance
        }, 0);

        nairaClosingBalance = invoice.reduce(function (acc, obj) {
            // if (obj.currency_code === 'USD') {
            //     naira = obj.balance * obj.exchange_rate
            // }

            // if (obj.currency_code === 'NGN') {
            //     naira = obj.balance
            // }
            balance = obj.currency_code === 'NGN' ? obj.balance : 0.0


            return acc + balance
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

        if (i > -2 && i < 2) {
            startDate = date.clone().subtract(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(-2 + i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        }
        for (const e of bill) {

            // if (e.currency_code === 'USD') {
            //     dollar = e.balance
            //     naira = e.balance * e.exchange_rate
            // }

            // if (e.currency_code === 'NGN') {
            //     naira = e.balance
            //     // get this from exchange rate endpoint
            //     dollar = (e.balance / 420)
            // }

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
                naira: e.currency_code === 'NGN' ? e.balance : 0.0,
                dollar: e.currency_code === 'USD' ? e.balance : 0.0,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Bill.create(
                payload
            );

        }

        dollarClosingBalance = bill.reduce(function (acc, obj) {
            // if (obj.currency_code === 'USD') {
            //     dollar = obj.balance
            // }

            // if (obj.currency_code === 'NGN') {
            //     // naira = obj.balance
            //     // get this from exchange rate endpoint
            //     dollar = (obj.balance / 420)
            // }
            balance = obj.currency_code === 'USD' ? obj.balance : 0.0

            return acc + balance
        }, 0);

        nairaClosingBalance = bill.reduce(function (acc, obj) {
            // if (obj.currency_code === 'USD') {
            //     naira = obj.balance * obj.exchange_rate
            // }

            // if (obj.currency_code === 'NGN') {
            //     naira = obj.balance
            // }
            balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

            return acc + balance
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
    console.log('doing great');
    try {
        let forecastPeriod = 'month';
        let date = moment();
        let invoiceBalance;
        let billsBalance;
        let zohoAccessToken = req.body.zohoAccessToken;
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const NOW = new Date();


        // let openingBalances = [
        //     {
        //         "month": "july",
        //         "amount": 0,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "july",
        //         "amount": 0,
        //         "currency": "USD"
        //     },
        //     {
        //         "month": "august",
        //         "amount": 55000,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "august",
        //         "amount": 3000,
        //         "currency": "USD"
        //     },
        //     {
        //         "month": "september",
        //         "amount": 3000,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "september",
        //         "amount": 1000,
        //         "currency": "USD"
        //     },
        // ]

        // let invoices = [
        //     {
        //         "title": "kvb",
        //         "month": "2022-07-17",
        //         "amount": 40000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "manifold",
        //         "month": "2022-07-01",
        //         "amount": 4000,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "kvb",
        //         "month": "2022-09-17",
        //         "amount": 1000,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "vic",
        //         "month": "2022-07-17",
        //         "amount": 4000,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "deepnet",
        //         "month": "2022-08-17",
        //         "amount": 3000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "silver fox",
        //         "month": "2022-08-29",
        //         "amount": 4000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "kvb",
        //         "month": "2022-07-17",
        //         "amount": 1000,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "manifold",
        //         "month": "2022-09-17",
        //         "amount": 2000,
        //         "currency": "NG"
        //     },
        // ]


        // let bills = [
        //     {
        //         "title": "bti",
        //         "month": "2022-07-17",
        //         "amount": 2500,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "blessed",
        //         "month": "2022-07-17",
        //         "amount": 1400,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "ict",
        //         "month": "2022-07-17",
        //         "amount": 50,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "kenny",
        //         "month": "2022-08-17",
        //         "amount": 60000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "bti",
        //         "month": "2022-07-17",
        //         "amount": 5000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "upper",
        //         "month": "2022-09-17",
        //         "amount": 4000,
        //         "currency": "NG"
        //     },
        //     {
        //         "title": "jk koncepts",
        //         "month": "2022-08-17",
        //         "amount": 10200,
        //         "currency": "USD"
        //     },
        //     {
        //         "title": "ict",
        //         "month": "2022-07-17",
        //         "amount": 232000,
        //         "currency": "NG"
        //     },
        // ]

        // let invoiceForeacast = [
        //     {
        //         "month": "July",
        //         "nairaClosing": 123,
        //         "dollarClosing": 400,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "July",
        //         "nairaClosing": 123,
        //         "dollarClosing": 400,
        //         "currency": "USD"
        //     },
        //     {
        //         "month": "august",
        //         "nairaClosing": 3000,
        //         "dollarClosing": 400,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "august",
        //         "nairaClosing": 3000,
        //         "dollarClosing": 400,
        //         "currency": "USD"
        //     },
        //     {
        //         "month": "september",
        //         "nairaClosing": 4000,
        //         "dollarClosing": 400,
        //         "currency": "NG"
        //     },
        //     {
        //         "month": "september",
        //         "nairaClosing": 4000,
        //         "dollarClosing": 400,
        //         "currency": "USD"
        //     },
        // ]

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        await getInvoice(options);

        await getBill(options);

        let invoices = await Invoice.findAndCountAll({
            where: {
                forecastType: '3 month',
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
        });

        let bills = await Bill.findAndCountAll({
            where: {
                forecastType: '3 month',
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
        });

        let openingBalanceNG = 0;
        let openingBalanceUSD = 0;


        // opening balance for july will be 0 USD, NG
        // get invoice forecast where forecastType 
        const invoiceForeacasts = await InvoiceForecast.findAndCountAll({
            where: {
                forecastType: '3 month',
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
        });

        const billForeacasts = await BillForecast.findAndCountAll({
            where: {
                forecastType: '3 month',
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                }
            },
        });

        let check = date.clone().subtract(Math.abs(-2), forecastPeriod).startOf(forecastPeriod);
        let month = check.format('MMMM');

        // console.log(invoiceForeacasts.rows)
        let openingBalances = [{ "month": month, "amount": 0, "currency": "NG", "date": check }, { "month": month, "amount": 0, "currency": "USD", "date": check }];
        let ngOpeningBalance = 0
        let usdOpeningBalance = 0
        for (i = 0; i < invoiceForeacasts.rows.length - 1; i++) {
            ngOpeningBalance += invoiceForeacasts.rows[i].nairaClosingBalance - billForeacasts.rows[i].nairaClosingBalance;
            usdOpeningBalance += invoiceForeacasts.rows[i].dollarClosingBalance - billForeacasts.rows[i].dollarClosingBalance;


            let check = moment(invoiceForeacasts.rows[i + 1].month + 1, 'YYYY-MM-DD');

            let month = check.format('MMMM');
            openingBalances.push({ "month": month, "amount": ngOpeningBalance, "currency": "NG", "date": check })
            openingBalances.push({ "month": month, "amount": usdOpeningBalance, "currency": "USD", "date": check })

        }

        // TODO:: remove this
       
        // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
        for (j = 0; j < openingBalances.length / 2; j++) {

            startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').endOf(forecastPeriod).format('YYYY-MM-DD')

            console.log('startDate', startDate);
            console.log('endDate', endDate);

            const totalAmountNGN = await Invoice.findAll({
                attributes: [
                    [db.sequelize.fn('sum', db.sequelize.col('naira')), 'total_naira_amount'],
                ],
                where: {
                    forecastType: '3 month',
                    currencyCode: 'NGN',
                    dueDate: {
                        [Op.gt]: startDate,
                        [Op.lt]: endDate
                    }
                },
            });

            const totalAmountUSD = await Invoice.findAll({
                attributes: [
                    [db.sequelize.fn('sum', db.sequelize.col('dollar')), 'total_dollar_amount'],
                ],
                where: {
                    forecastType: '3 month',
                    currencyCode: 'USD',
                    dueDate: {
                        [Op.gt]: startDate,
                        [Op.lt]: endDate
                    }
                },
            });

            console.log(totalAmountNGN)
            console.log(totalAmountUSD)
        }


        // get bills forecast where forecastType
        // opening naira balance + invoice closing bal - bills = agust opening bal
        // sept opening bal + invoice - bills = sept




        const workbook = new ExcelJS.Workbook();
        workbook.calcProperties.fullCalcOnLoad = true;
        const sheet = workbook.addWorksheet('My Sheet');
        console.log('doing great');


        const monthRow = sheet.getRow(1)
        const currencyRow = sheet.getRow(2)
        const openingBalanceRow = sheet.getRow(3)
        const cashInflow = sheet.getRow(6);

        openingBalanceRow.getCell(1).value = 'Opening Balance'
        cashInflow.getCell(1).value = 'CASH INFLOWS'

        for (const [rowNum, inputData] of openingBalances.entries()) {

            // console.log('row: ', rowNum, ', data', inputData);
            monthRow.getCell(rowNum + 2).value = inputData.month
            currencyRow.getCell(rowNum + 2).value = inputData.currency
            openingBalanceRow.getCell(rowNum + 2).value = inputData.amount

            monthRow.commit()
            currencyRow.commit()
            openingBalanceRow.commit()
        }
        // idCol.commit()
        let newArray = []
        let cashInflowFromInvoiced;
        let totalCashInflowFromOperatingActivities;
        let cashOutflow;
        let endOfInvoice;
        let endOfBill;

        for (const [rowNum, inputData] of invoices.rows.entries()) {
            // console.log('input data', inputData);
            const rowX = sheet.getRow(rowNum + 7)

            let check = moment(inputData.month, 'YYYY-MM-DD');

            inputData.month = check.format('MMMM');


            for (i = 2; i < invoiceForeacasts.length + 2; i++) {

                if ((inputData.month.toLowerCase() === invoiceForeacasts[i - 2].month.toLowerCase()) && (inputData.currency.toLowerCase() === invoiceForeacasts[i - 2].currency.toLowerCase())) {
                    if (inputData.currency.toLowerCase() === 'NG'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }

                    if (inputData.currency.toLowerCase() === 'USD'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }
                }

            }


            sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                console.log('row number', rowNumber);

                rowX.getCell(1).value = inputData.customerName;

                endOfInvoice = rowNumber + 1;

            });

            rowX.commit();
        }
        cashInflowFromInvoiced = sheet.getRow(endOfInvoice)
        totalCashInflowFromOperatingActivities = sheet.getRow(endOfInvoice + 2);
        cashOutflow = sheet.getRow(endOfInvoice + 3)

        cashInflowFromInvoiced.getCell(1).value = 'Cash inflow from invoiced sales'
        totalCashInflowFromOperatingActivities.getCell(1).value = 'Total Cash Inflows from Operating Activties'
        cashOutflow.getCell(1).value = 'CASH OUTFLOWS'

        newArray = []
        console.log(bills.rows);
        for (const [rowNum, inputData] of bills.rows.entries()) {

            // console.log('the row is, ' + rowNum + ' input data ', inputData)
            // console.log(endOfInvoice)
            const rowX = sheet.getRow(rowNum + endOfInvoice + 4)

            let check = moment(inputData.month, 'YYYY-MM-DD');

            inputData.month = check.format('MMMM');


            for (i = 2; i < invoiceForeacasts.length + 2; i++) {
                console.log(inputData.month)
                console.log(invoiceForeacast[i - 2].month)
                if ((inputData.month.toLowerCase() === invoiceForeacasts[i - 2].month.toLowerCase()) && (inputData.currencyCode.toLowerCase() === invoiceForeacasts[i - 2].currency.toLowerCase())) {
                    if (inputData.currencyCode.toLowerCase() === 'NG'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }

                    if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }
                }

            }


            sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {

                // console.log('Row ' + rowNumber);
                // console.log('is ' +  inputData.title + 'in ' + newArray );
                // if (newArray.includes(inputData.title)) {
                //     return;
                // }

                // if (rowNumber > 6 && (row.values[1] == undefined && row.values[1] != inputData.title)) {
                // console.log('i got here', inputData.title)
                // newArray.push(inputData.title);
                rowX.getCell(1).value = inputData.customerName;

                // }
                endOfBill = rowNumber;

            });

            rowX.commit();
        }

        cashOutflowsOnCurrentTradePayables = sheet.getRow(endOfBill + 1);
        totalCashOutflows = sheet.getRow(endOfBill + 2);
        netWorkingCapital = sheet.getRow(endOfBill + 4);
        cashOutflowsOnCurrentTradePayables.getCell(1).value = 'Cash Outflows on Current Trade Payables';
        totalCashOutflows.getCell(1).value = 'Total Cash Outflows';
        netWorkingCapital.getCell(1).value = 'Net Working Capital/(Deficit)';

        await workbook.xlsx.writeFile('di.xlsx')

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