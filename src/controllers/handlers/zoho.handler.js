const { default: axios } = require('axios');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const db = require("../../models");
const config = require('../../../config');
const Invoice = db.invoices;
const InvoiceForecast = db.invoiceForecasts;
const Bill = db.bills;
const BillForecast = db.billForecasts;
const InitialBalance = db.initialBalances;


let moment = require('moment');
const { getZohoExchangeRateHandler } = require('./exchange.handler');
moment().format();

const getInvoice = async (options, forecastNumber, forecastPeriod, rate) => {
    let date = moment();
    let startDate
    let endDate

    // monthly / yearly forecast
    // TODO::: rework this... only fetch start date and end date. should not be a loop.
    startDate = date.clone().subtract(2, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${config.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    resp = await axios.get(url, options);

    for (i = 0; i < forecastNumber + 2; i++) {
        if (i <= 1) {
            startDate = date.clone().subtract(Math.abs(i - 2), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().subtract(Math.abs(i - 2), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(i - 2), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().add(Math.abs(i - 2), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');
        }

        const filteredItems = resp.data.invoices.filter((item, index) => item.due_date >= startDate && item.due_date <= endDate);

        dollarClosingBalance = filteredItems.reduce(function (acc, obj) {

            balance = obj.currency_code === 'USD' ? obj.balance : 0.0


            return acc + balance
        }, 0);

        nairaClosingBalance = filteredItems.reduce(function (acc, obj) {

            balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

            if (rate.old !== rate.latest) {
                balance = (balance / rate.old) * rate.latest;
            }

            return acc + balance
        }, 0);

        await InvoiceForecast.create(
            {
                nairaClosingBalance: nairaClosingBalance,
                dollarClosingBalance: 0.0,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                currency: "NGN"
            }
        );

        await InvoiceForecast.create(
            {
                nairaClosingBalance: 0.0,
                dollarClosingBalance: dollarClosingBalance,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                currency: "USD"
            }
        );
    }
    // TODO:: come up with a better solution. Currently n ^ 2
    for (const [i, e] of resp.data.invoices.entries()) {

        if (parseFloat(e.balance) > 0) {

            if ((rate.old !== rate.latest) && e.currency_code === 'NGN') {
                console.log("I am getting here", e.currency_code)
                e.balance = (e.balance / rate.old) * rate.latest;
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
                naira: e.currency_code === 'NGN' ? e.balance : 0.0,
                dollar: e.currency_code === 'USD' ? e.balance : 0.0,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Invoice.create(
                payload
            );

        }
    }

}

const getBill = async (options, forecastNumber, forecastPeriod, rate) => {
    let date = moment();
    let startDate;
    let endDate;

    startDate = date.clone().subtract(2, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')

    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${config.ZOHO_BOOK_BASE_URL}/bills?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    resp = await axios.get(url, options);

    for (i = 0; i < forecastNumber + 2; i++) {
        if (i <= 1) {
            startDate = date.clone().subtract(Math.abs(i - 2), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().subtract(Math.abs(i - 2), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');
        }

        if (i >= 2) {
            startDate = date.clone().add(Math.abs(i - 2), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = date.clone().add(Math.abs(i - 2), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');
        }

        const filteredItems = resp.data.bills.filter((item, index) => item.due_date >= startDate && item.due_date <= endDate);

        dollarClosingBalance = filteredItems.reduce(function (acc, obj) {

            balance = obj.currency_code === 'USD' ? obj.balance : 0.0

            return acc + balance
        }, 0);

        nairaClosingBalance = filteredItems.reduce(function (acc, obj) {

            balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

            if (rate.old !== rate.latest) {
                balance = (balance / rate.old) * rate.latest;
            }

            return acc + balance
        }, 0);

        await BillForecast.create(
            {
                nairaClosingBalance: nairaClosingBalance,
                dollarClosingBalance: 0.0,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                currency: "NGN",
            }
        );

        await BillForecast.create(
            {
                nairaClosingBalance: 0.0,
                dollarClosingBalance: dollarClosingBalance,
                month: startDate,
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                currency: "USD",
            }
        );
    }

    // TODO:: come up with a better solution. Currently n ^ 2
    for (const [i, e] of resp.data.bills.entries()) {

        if (parseFloat(e.balance) > 0) {

            if ((rate.old !== rate.latest) && e.currency_code === 'NGN') {
                e.balance = (e.balance / rate.old) * rate.latest;
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
                naira: e.currency_code === 'NGN' ? e.balance : 0.0,
                dollar: e.currency_code === 'USD' ? e.balance : 0.0,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await Bill.create(
                payload
            );
        }

    }
}

// update when you update exchange rate
// update when you refresh
const getOpeningBalance = async (options, rate) => {
    let date = moment();
    // get start date of last 3 months
    startDate = date.clone().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
    // get end date of last 3 months
    endDate = date.clone().subtract(3, 'month').endOf('month').format('YYYY-MM-DD');


    let invoiceUrl = `${config.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    openingInvoice = await axios.get(invoiceUrl, options);

    // get invoices for that month and sum it up
    let billsUrl = `${config.ZOHO_BOOK_BASE_URL}/bills?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    openingBills = await axios.get(billsUrl, options);


    dollarOpeningInvoicesBalance = openingInvoice.data.invoices.reduce(function (acc, obj) {

        balance = obj.currency_code === 'USD' ? obj.balance : 0.0

        return acc + balance
    }, 0);

    nairaOpeningInvoicesBalance = openingInvoice.data.invoices.reduce(function (acc, obj) {

        balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

        if (rate.old !== rate.latest) {
            balance = (balance / rate.old) * rate.latest;
        }

        return acc + balance
    }, 0);

    dollarOpeningBillsBalance = openingBills.data.bills.reduce(function (acc, obj) {

        balance = obj.currency_code === 'USD' ? obj.balance : 0.0

        return acc + balance
    }, 0);

    nairaOpeningBillsBalance = openingBills.data.bills.reduce(function (acc, obj) {

        balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

        if (rate.old !== rate.latest) {
            balance = (balance / rate.old) * rate.latest;
        }

        return acc + balance
    }, 0);

    // get bills for that month and sum it up
    // invoice - bills = opening bal 
    let nairaOpeningBalance = nairaOpeningInvoicesBalance - nairaOpeningBillsBalance;
    let dollarOpeningBalance = dollarOpeningInvoicesBalance - dollarOpeningBillsBalance;

    let startingBalance = {
        nairaOpeningBalance: nairaOpeningBalance,
        dollarOpeningBalance: dollarOpeningBalance,
    }
    // create this daily
    await InitialBalance.create(startingBalance);


    return startingBalance;
}

const openingBalanceHandler = async (req, reply) => {
    try {
        const { forecastNumber, forecastPeriod } = req.body;
        const date = moment();
        const zohoAccessToken = req.body.zohoAccessToken;
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const TODAY_END = new Date().setHours(23, 59, 59, 999);

        // let invoices = {
        //     count: 12,
        //     rows: [
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "JEVI AUSTIN",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 25000.00,
        //             "naira": 25000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "JEVI AUSTIN",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 4000.00,
        //             "naira": 0.00,
        //             "dollar": 4000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "LOTUS BANK LIMITED",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 4000.00,
        //             "naira": 4000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "ACCESS BANK ",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-08-25",
        //             "dueDate": "2022-08-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 4000.00,
        //             "naira": 0.00,
        //             "dollar": 4000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "Chevron",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-08-25",
        //             "dueDate": "2022-08-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 5000.00,
        //             "naira": 5000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "SHELL PETROLEUM",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-08-25",
        //             "dueDate": "2022-08-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 40000.00,
        //             "naira": 40000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "SHELL PETROLEUM",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-08-25",
        //             "dueDate": "2022-08-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 2000.00,
        //             "naira": 2000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "JEVI AUSTIN",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-09-25",
        //             "dueDate": "2022-09-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 30000.00,
        //             "naira": 30000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "JEVI AUSTIN",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-09-25",
        //             "dueDate": "2022-09-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 200.00,
        //             "naira": 0.00,
        //             "dollar": 200.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "LOTUS BANK LIMITED",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-09-25",
        //             "dueDate": "2022-09-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 5000.00,
        //             "naira": 0.00,
        //             "dollar": 5000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "MOBIL PRODUCING ",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-10-25",
        //             "dueDate": "2022-10-28",
        //             "due_days": "",
        //             "currencyCode": "NGN",
        //             "balance": 40000.00,
        //             "naira": 40000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //         {
        //             "invoiceId": "2597328000006277339",
        //             "customerName": "MOBIL PRODUCING",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-10-25",
        //             "dueDate": "2022-10-28",
        //             "due_days": "",
        //             "currencyCode": "USD",
        //             "balance": 2000.00,
        //             "naira": 0.00,
        //             "dollar": 2000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-18 22:15:07",
        //             "updatedAt": "2022-09-18 22:15:07"
        //         },
        //     ]
        // };


        // let bills = {
        //     count: 8,
        //     rows: [
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "BTI",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "currencyCode": "USD",
        //             "balance": 3000.00,
        //             "naira": 0.00,
        //             "dollar": 3000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "COSCHARIS",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "currencyCode": "NGN",
        //             "balance": 5000.00,
        //             "naira": 5000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "EXTRA VALUE ",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-08-25",
        //             "dueDate": "2022-08-28",
        //             "currencyCode": "USD",
        //             "balance": 1000.00,
        //             "naira": 0.00,
        //             "dollar": 1000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "KENNY JEE TECHNICAL",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "currencyCode": "NGN",
        //             "balance": 3000.00,
        //             "naira": 3000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "KENNY JEE TECHNICAL",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-07-25",
        //             "dueDate": "2022-07-28",
        //             "currencyCode": "USD",
        //             "balance": 200.00,
        //             "naira": 0.00,
        //             "dollar": 200.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "COSCHARIS",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-09-25",
        //             "dueDate": "2022-09-28",
        //             "currencyCode": "NGN",
        //             "balance": 73000.00,
        //             "naira": 73000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "COSCHARIS",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-09-25",
        //             "dueDate": "2022-09-28",
        //             "currencyCode": "USD",
        //             "balance": 8000.00,
        //             "naira": 0.00,
        //             "dollar": 8000.00,
        //             "exchange_rate": 1.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "billId": "2597328000006277339",
        //             "vendorId": "2597328000006277339",
        //             "vendorName": "BTI",
        //             "status": "approved",
        //             "invoiceNumber": "INV-000688",
        //             "referenceNumber": "PCARD 2531 SNEPCO",
        //             "date": "2022-10-25",
        //             "dueDate": "2022-10-28",
        //             "currencyCode": "NGN",
        //             "balance": 9000.00,
        //             "naira": 9000.00,
        //             "dollar": 0.00,
        //             "exchange_rate": 420.00,
        //             "forecastType": "3 Month",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //     ]
        // }

        // let invoiceForecasts = {
        //     count: 10,
        //     rows: [
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 29000,
        //             "month": "2022-07-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 4000,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-07-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 45000.00,
        //             "month": "2022-08-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 6000,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-08-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 30000,
        //             "month": "2022-09-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 5200,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-09-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 40000,
        //             "month": "2022-10-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 2000.00,
        //             "nairaClosingBalance": 0.00,
        //             "month": "2022-10-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0.00,
        //             "month": "2022-11-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-11-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //     ]
        // }

        // let billForecasts = {
        //     count: 10,
        //     rows: [
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 8000,
        //             "month": "2022-07-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 3200,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-07-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0.00,
        //             "month": "2022-08-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 1000,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-08-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 73000,
        //             "month": "2022-09-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 8000,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-09-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 9000,
        //             "month": "2022-10-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0.00,
        //             "month": "2022-10-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0.00,
        //             "month": "2022-11-28",
        //             "forecastType": "3 Month",
        //             "currency": "NGN",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //         {
        //             "id": "2597328000006277339",
        //             "dollarClosingBalance": 0.00,
        //             "nairaClosingBalance": 0,
        //             "month": "2022-11-28",
        //             "forecastType": "3 Month",
        //             "currency": "USD",
        //             "createdAt": "2022-09-07 22:15:07",
        //             "updatedAt": "2022-09-07 22:15:07"
        //         },
        //     ]
        // }

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        let rate = await getZohoExchangeRateHandler(zohoAccessToken, forecastNumber, forecastPeriod);

        if (!rate) {
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });
        }

        let invoices = await Invoice.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });
        // console.log('let me call ivoices', await invoices.count);

        let bills = await Bill.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        let initialOpeningBalance = await InitialBalance.findOne({
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        })



        // opening balance for july will be 0 USD, NG
        // get invoice forecast where forecastType 
        let invoiceForecasts = await InvoiceForecast.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        let billForecasts = await BillForecast.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        if (!initialOpeningBalance) {
            initialOpeningBalance = await getOpeningBalance(options, rate);
        }

        if (!billForecasts.count && !invoiceForecasts.count && !bills.count && !invoices.count) {

            await getInvoice(options, forecastNumber, forecastPeriod, rate);

            await getBill(options, forecastNumber, forecastPeriod, rate);

            invoices = await Invoice.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });


            bills = await Bill.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });



            // opening balance for july will be 0 USD, NG
            // get invoice forecast where forecastType 
            invoiceForecasts = await InvoiceForecast.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });

            billForecasts = await BillForecast.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });

        }



        let check = date.clone().subtract(Math.abs(-2), forecastPeriod).startOf(forecastPeriod);
        let month = check.format('MMMM');

        // console.log(invoiceForecasts.rows)
        let openingBalances = [
            { "month": month, "amount": parseFloat(initialOpeningBalance.nairaOpeningBalance), "currency": "NGN", "date": check },
            { "month": month, "amount": parseFloat(initialOpeningBalance.dollarOpeningBalance), "currency": "USD", "date": check }
        ];
        let closingBalances = [];
        let nairaOpeningBalance = parseFloat(initialOpeningBalance.nairaOpeningBalance)
        let dollarOpeningBalance = parseFloat(initialOpeningBalance.dollarOpeningBalance)
        for (i = 0; i < invoiceForecasts.rows.length - 2; i++) {
            //console.log('invoice to sum', invoiceForecasts.rows[i])
            let invoiceForeacastClosingBalance = invoiceForecasts.rows[i].currency === 'NGN' ? invoiceForecasts.rows[i].nairaClosingBalance : invoiceForecasts.rows[i].dollarClosingBalance
            let billForeacastClosingBalance = billForecasts.rows[i].currency === 'NGN' ? billForecasts.rows[i].nairaClosingBalance : billForecasts.rows[i].dollarClosingBalance

            let check = moment(invoiceForecasts.rows[i + 2].month, 'YYYY-MM-DD');

            let month = check.format('MMMM');
            // console.log('first currency', invoiceForecasts.rows[i].currency);
            if (invoiceForecasts.rows[i].currency === 'NGN') {
                nairaOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": month, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
                closingBalances.push({ "month": month, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            } else {
                dollarOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": month, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
                closingBalances.push({ "month": month, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            }
        }


        // Last Closing balance
        check = date.clone().add(Math.abs(forecastNumber), forecastPeriod).startOf(forecastPeriod);
        month = check.format('MMMM');

        // get last item from opening balance
        let dollarLastOpeningBalance = openingBalances.at(-1);

        let nairaLastOpeningBalance = openingBalances.at(-2);
        // get last item from invoiceForecasts
        let dollarLastInvoice = invoiceForecasts.rows.at(-1);
        let nairaLastInvoice = invoiceForecasts.rows.at(-2);

        // get last item from billForecasts
        let dollarLastBill = billForecasts.rows.at(-1);
        let nairaLastBill = billForecasts.rows.at(-2);

        let lastDollarClosingBalance = parseFloat(dollarLastOpeningBalance.amount) + parseFloat(dollarLastInvoice.dollarClosingBalance) - parseFloat(dollarLastBill.dollarClosingBalance);
        let lastNairaClosingBalance = parseFloat(nairaLastOpeningBalance.amount) + parseFloat(nairaLastInvoice.nairaClosingBalance) - parseFloat(nairaLastBill.nairaClosingBalance);
        // then push to closing Balance

        closingBalances.push({ "month": month, "amount": lastNairaClosingBalance, "currency": "NGN", "date": check })
        closingBalances.push({ "month": month, "amount": lastDollarClosingBalance, "currency": "USD", "date": check })


        // TODO:: remove this

        // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
        for (j = 0; j < openingBalances.length / 2; j++) {
            console.log('doing');
            startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').endOf(forecastPeriod).format('YYYY-MM-DD')

            // const totalAmountNGN = await Invoice.findAll({
            //     attributes: [
            //         [db.sequelize.fn('sum', db.sequelize.col('naira')), 'total_naira_amount'],
            //     ],
            //     where: {
            //         forecastType: `${forecastNumber} ${forecastPeriod}`,
            //         currencyCode: 'NGN',
            //         dueDate: {
            //             [Op.gt]: startDate,
            //             [Op.lt]: endDate
            //         }
            //     },
            // });

            // const totalAmountUSD = await Invoice.findAll({
            //     attributes: [
            //         [db.sequelize.fn('sum', db.sequelize.col('dollar')), 'total_dollar_amount'],
            //     ],
            //     where: {
            //         forecastType: `${forecastNumber} ${forecastPeriod}`,
            //         currencyCode: 'USD',
            //         dueDate: {
            //             [Op.gt]: startDate,
            //             [Op.lt]: endDate
            //         }
            //     },
            // });

        }

        let totalNairaCashInflow = 0.0;
        let totalDollarCashInflow = 0.0;
        let totalNairaCashOutflow = 0.0;
        let totalDollarCashOutflow = 0.0;

        for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {

            if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
                totalNairaCashInflow += parseFloat(inputData.nairaClosingBalance)
            } else {
                totalDollarCashInflow += parseFloat(inputData.dollarClosingBalance)
            }

        }

        for (const [rowNum, inputData] of billForecasts.rows.entries()) {

            if (billForecasts.rows[rowNum].currency === 'NGN') {
                totalNairaCashOutflow += parseFloat(inputData.nairaClosingBalance)

            } else {
                totalDollarCashOutflow += parseFloat(inputData.dollarClosingBalance)

            }

        }

        // nairaNetWorkingCapital
        let totalNairaNetWorkingCapital = parseFloat(initialOpeningBalance.nairaOpeningBalance) + parseFloat(totalNairaCashInflow) - parseFloat(totalNairaCashOutflow)
        // dollarNetWorkingCapital
        let totalDollarNetWorkingCapital = parseFloat(initialOpeningBalance.dollarOpeningBalance) + parseFloat(totalDollarCashInflow) - parseFloat(totalDollarCashOutflow)

        statusCode = 200;
        result = {
            status: true,
            data: {
                report: {
                    openingBalance: {
                        naira: initialOpeningBalance.nairaOpeningBalance,
                        dollar: initialOpeningBalance.dollarOpeningBalance
                    },
                    totalCashInflow: {
                        naira: totalNairaCashInflow,
                        dollar: totalDollarCashInflow
                    },
                    totalCashOutflow: {
                        naira: totalNairaCashOutflow,
                        dollar: totalDollarCashOutflow
                    },
                    networkingCapital: {
                        naira: totalNairaNetWorkingCapital,
                        dollar: totalDollarNetWorkingCapital
                    }
                },
                invoices: invoices.rows.reverse(),
                bills: bills.rows.reverse()
            }
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

const downloadReportHandler = async (req, reply) => {
    let buffer;
    try {

        const { forecastNumber, forecastPeriod } = req.body;
        const date = moment();
        const zohoAccessToken = req.body.zohoAccessToken;
        const TODAY_START = new Date().setHours(0, 0, 0, 0);
        const TODAY_END = new Date().setHours(23, 59, 59, 999);


        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        let rate = await getZohoExchangeRateHandler(zohoAccessToken, forecastNumber, forecastPeriod);

        if (!rate) {
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });
        }

        let invoices = await Invoice.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });
        // console.log('let me call ivoices', await invoices.count);

        let bills = await Bill.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        let initialOpeningBalance = await InitialBalance.findOne({
            where: {
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        })




        // opening balance for july will be 0 USD, NG
        // get invoice forecast where forecastType 
        let invoiceForecasts = await InvoiceForecast.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        let billForecasts = await BillForecast.findAndCountAll({
            where: {
                forecastType: `${forecastNumber} ${forecastPeriod}`,
                createdAt: {
                    [Op.gt]: TODAY_START,
                    [Op.lt]: TODAY_END
                }
            },
        });

        if (!initialOpeningBalance) {
            initialOpeningBalance = await getOpeningBalance(options, rate);
        }

        if (!billForecasts.count && !invoiceForecasts.count && !bills.count && !invoices.count) {
            await getInvoice(options, forecastNumber, forecastPeriod, rate);

            await getBill(options, forecastNumber, forecastPeriod, rate);

            invoices = await Invoice.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });


            bills = await Bill.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });



            // opening balance for july will be 0 USD, NG
            // get invoice forecast where forecastType 
            invoiceForecasts = await InvoiceForecast.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });

            billForecasts = await BillForecast.findAndCountAll({
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    createdAt: {
                        [Op.gt]: TODAY_START,
                        [Op.lt]: TODAY_END
                    }
                },
            });

        }



        let check = date.clone().subtract(Math.abs(-2), forecastPeriod).startOf(forecastPeriod);
        let month = check.format('MMMM');

        // console.log(invoiceForecasts.rows)
        let openingBalances = [
            { "month": month, "amount": parseFloat(initialOpeningBalance.nairaOpeningBalance), "currency": "NGN", "date": check },
            { "month": month, "amount": parseFloat(initialOpeningBalance.dollarOpeningBalance), "currency": "USD", "date": check }
        ];
        let closingBalances = [];
        let nairaOpeningBalance = parseFloat(initialOpeningBalance.nairaOpeningBalance)
        let dollarOpeningBalance = parseFloat(initialOpeningBalance.dollarOpeningBalance)
        for (i = 0; i < invoiceForecasts.rows.length - 2; i++) {
            //console.log('invoice to sum', invoiceForecasts.rows[i])
            let invoiceForeacastClosingBalance = invoiceForecasts.rows[i].currency === 'NGN' ? invoiceForecasts.rows[i].nairaClosingBalance : invoiceForecasts.rows[i].dollarClosingBalance
            let billForeacastClosingBalance = billForecasts.rows[i].currency === 'NGN' ? billForecasts.rows[i].nairaClosingBalance : billForecasts.rows[i].dollarClosingBalance

            let check = moment(invoiceForecasts.rows[i + 2].month, 'YYYY-MM-DD');

            let month = check.format('MMMM');
            // console.log('first currency', invoiceForecasts.rows[i].currency);
            if (invoiceForecasts.rows[i].currency === 'NGN') {
                nairaOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": month, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
                closingBalances.push({ "month": month, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            } else {
                dollarOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": month, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
                closingBalances.push({ "month": month, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            }
        }

        // Last Closing balance
        check = date.clone().add(Math.abs(forecastNumber), forecastPeriod).startOf(forecastPeriod);
        month = check.format('MMMM');

        // get last item from opening balance
        let dollarLastOpeningBalance = openingBalances.at(-1);

        let nairaLastOpeningBalance = openingBalances.at(-2);
        // get last item from invoiceForecasts
        let dollarLastInvoice = invoiceForecasts.rows.at(-1);
        let nairaLastInvoice = invoiceForecasts.rows.at(-2);

        // get last item from billForecasts
        let dollarLastBill = billForecasts.rows.at(-1);
        let nairaLastBill = billForecasts.rows.at(-2);

        let lastDollarClosingBalance = parseFloat(dollarLastOpeningBalance.amount) + parseFloat(dollarLastInvoice.dollarClosingBalance) - parseFloat(dollarLastBill.dollarClosingBalance);
        let lastNairaClosingBalance = parseFloat(nairaLastOpeningBalance.amount) + parseFloat(nairaLastInvoice.nairaClosingBalance) - parseFloat(nairaLastBill.nairaClosingBalance);
        // then push to closing Balance

        closingBalances.push({ "month": month, "amount": lastNairaClosingBalance, "currency": "NGN", "date": check })
        closingBalances.push({ "month": month, "amount": lastDollarClosingBalance, "currency": "USD", "date": check })
        // TODO:: remove this

        // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
        for (j = 0; j < openingBalances.length / 2; j++) {
            console.log('doing');
            startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').endOf(forecastPeriod).format('YYYY-MM-DD')

        }
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
        let openingBalanceLength = openingBalances.length;
        monthRow.getCell(openingBalanceLength + 2).value = 'Total'
        monthRow.getCell(openingBalanceLength + 3).value = 'Total'
        monthRow.getCell(openingBalanceLength + 5).value = 'Rate'

        currencyRow.getCell(openingBalanceLength + 2).value = 'NGN'
        currencyRow.getCell(openingBalanceLength + 3).value = 'USD Exposure'
        currencyRow.getCell(openingBalanceLength + 5).value = rate.latest

        openingBalanceRow.getCell(openingBalanceLength + 2).value = initialOpeningBalance.nairaOpeningBalance
        openingBalanceRow.getCell(openingBalanceLength + 3).value = initialOpeningBalance.dollarOpeningBalance

        monthRow.commit()
        currencyRow.commit()
        openingBalanceRow.commit()

        let cashInflowFromInvoiced;
        let totalCashInflowFromOperatingActivities;
        let cashOutflow;
        let endOfInvoice = await invoices.count + 7;
        let endOfBill = await bills.count + await invoices.count + 7;


        for (const [rowNum, inputData] of invoices.rows.entries()) {
            const rowX = sheet.getRow(rowNum + 7)

            inputData.dueDate = moment(inputData.dueDate, 'YYYY-MM-DD').format('MMMM');

            for (i = 2; i < invoiceForecasts.rows.length + 2; i++) {

                // console.log('invoice due date: ', inputData.dueDate);
                month = moment(invoiceForecasts.rows[i - 2].month, 'YYYY-MM-DD').format('MMMM');

                if ((inputData.dueDate === month)
                    && (inputData.currencyCode.toLowerCase() === invoiceForecasts.rows[i - 2].currency.toLowerCase())) {


                    if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {

                        rowX.getCell(i).value = inputData.balance
                    }

                    if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {

                        rowX.getCell(i).value = inputData.balance
                    }
                }

            }


            sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {

                rowX.getCell(1).value = inputData.customerName;

            });

            rowX.commit();

        }
        cashInflowFromInvoiced = sheet.getRow(endOfInvoice)
        totalCashInflowFromOperatingActivities = sheet.getRow(endOfInvoice + 1);
        cashOutflow = sheet.getRow(endOfInvoice + 3)

        cashInflowFromInvoiced.getCell(1).value = 'Cash inflow from invoiced sales'
        totalCashInflowFromOperatingActivities.getCell(1).value = 'Total Cash Inflows from Operating Activties'
        cashOutflow.getCell(1).value = 'CASH OUTFLOWS'
        let totalNairaClosingBalance = 0.0;
        let totalDollarClosingBalance = 0.0;
        for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {

            if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
                totalNairaClosingBalance = totalNairaClosingBalance + parseFloat(inputData.nairaClosingBalance)
                cashInflowFromInvoiced.getCell(rowNum + 2).value = inputData.nairaClosingBalance
                totalCashInflowFromOperatingActivities.getCell(rowNum + 2).value = inputData.nairaClosingBalance
            } else {
                totalDollarClosingBalance = totalDollarClosingBalance + parseFloat(inputData.dollarClosingBalance)
                cashInflowFromInvoiced.getCell(rowNum + 2).value = inputData.dollarClosingBalance
                totalCashInflowFromOperatingActivities.getCell(rowNum + 2).value = inputData.dollarClosingBalance
            }


            cashInflowFromInvoiced.commit()
        }


        let invoiceForecastsLength = invoiceForecasts.rows.length;
        cashInflowFromInvoiced.getCell(invoiceForecastsLength + 2).value = totalNairaClosingBalance
        cashInflowFromInvoiced.getCell(invoiceForecastsLength + 3).value = totalDollarClosingBalance
        totalCashInflowFromOperatingActivities.getCell(invoiceForecastsLength + 2).value = totalNairaClosingBalance
        totalCashInflowFromOperatingActivities.getCell(invoiceForecastsLength + 3).value = totalDollarClosingBalance

        cashInflowFromInvoiced.commit()
        totalCashInflowFromOperatingActivities.commit()

        newArray = []
        for (const [rowNum, inputData] of bills.rows.entries()) {
            // console.log('row number', rowNum);

            const rowX = sheet.getRow(rowNum + endOfInvoice + 4)

            inputData.dueDate = moment(inputData.dueDate, 'YYYY-MM-DD').format("MMMM");
            // console.log('invoice forecast rows', invoiceForecasts.rows.length)
            for (i = 2; i < invoiceForecasts.rows.length + 2; i++) {
                // console.log('invoice due date: ', inputData.dueDate);
                month = moment(invoiceForecasts.rows[i - 2].month, 'YYYY-MM-DD').format('MMMM');
                if ((inputData.dueDate === month)
                    && (inputData.currencyCode.toLowerCase() === invoiceForecasts.rows[i - 2].currency.toLowerCase())) {

                    if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }

                    if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {
                        rowX.getCell(i).value = inputData.balance
                    }
                }

            }


            sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {


                rowX.getCell(1).value = inputData.vendorName;

                // }
                // endOfBill = rowNumber;

            });

            rowX.commit();

        }

        cashOutflowsOnCurrentTradePayables = sheet.getRow(endOfBill + 4);
        totalCashOutflows = sheet.getRow(endOfBill + 5);
        netWorkingCapital = sheet.getRow(endOfBill + 7);
        cashOutflowsOnCurrentTradePayables.getCell(1).value = 'Cash Outflows on Current Trade Payables';
        totalCashOutflows.getCell(1).value = 'Total Cash Outflows';

        let totalNairaCashOutflowsOnCurrentTradePayables = 0.0;
        let totalNairaCashOutflows = 0.0;
        let totalDollarCashOutflowsOnCurrentTradePayables = 0.0;
        let totalDollarCashOutflows = 0.0;

        for (const [rowNum, inputData] of billForecasts.rows.entries()) {

            if (billForecasts.rows[rowNum].currency === 'NGN') {
                totalNairaCashOutflowsOnCurrentTradePayables += parseFloat(inputData.nairaClosingBalance)
                totalNairaCashOutflows += parseFloat(inputData.nairaClosingBalance)
                cashOutflowsOnCurrentTradePayables.getCell(rowNum + 2).value = inputData.nairaClosingBalance
                totalCashOutflows.getCell(rowNum + 2).value = inputData.nairaClosingBalance
            } else {
                totalDollarCashOutflowsOnCurrentTradePayables += parseFloat(inputData.dollarClosingBalance)
                totalDollarCashOutflows += parseFloat(inputData.dollarClosingBalance)
                cashOutflowsOnCurrentTradePayables.getCell(rowNum + 2).value = inputData.dollarClosingBalance
                totalCashOutflows.getCell(rowNum + 2).value = inputData.dollarClosingBalance
            }


            cashOutflowsOnCurrentTradePayables.commit()
        }

        let billForecastsLength = billForecasts.rows.length;
        cashOutflowsOnCurrentTradePayables.getCell(billForecastsLength + 2).value = totalNairaCashOutflowsOnCurrentTradePayables
        totalCashOutflows.getCell(billForecastsLength + 2).value = totalNairaCashOutflows

        cashOutflowsOnCurrentTradePayables.getCell(billForecastsLength + 3).value = totalDollarCashOutflowsOnCurrentTradePayables
        totalCashOutflows.getCell(billForecastsLength + 3).value = totalDollarCashOutflows

        cashOutflowsOnCurrentTradePayables.commit()
        totalCashOutflows.commit()

        netWorkingCapital.getCell(1).value = 'Net Working Capital/(Deficit)';
        const closingBalanceRow = netWorkingCapital

        for (const [rowNum, inputData] of closingBalances.entries()) {

            closingBalanceRow.getCell(rowNum + 2).value = inputData.amount

            closingBalanceRow.commit()
        }

        // nairaNetWorkingCapital
        let totalNairaNetWorkingCapital = parseFloat(initialOpeningBalance.nairaOpeningBalance) + parseFloat(totalNairaClosingBalance) - parseFloat(totalNairaCashOutflows)
        // dollarNetWorkingCapital
        let totalDollarNetWorkingCapital = parseFloat(initialOpeningBalance.dollarOpeningBalance) + parseFloat(totalDollarClosingBalance) - parseFloat(totalDollarCashOutflows)

        netWorkingCapital.getCell(closingBalances.length + 2).value = totalNairaNetWorkingCapital
        netWorkingCapital.getCell(closingBalances.length + 3).value = totalDollarNetWorkingCapital

        // await workbook.xlsx.writeFile('doings.xlsx')

        // const fileName = `logs${date}.xlsx`

        // reply.header(
        //     'Content-Type',
        //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        // )
        // reply.header('Content-Disposition', 'attachment; filename=' + fileName)
        buffer = await workbook.xlsx.writeBuffer()

        statusCode = 200;
        result = {
            status: true,
            message: 'Download successful'
        }

    } catch (e) {
        statusCode = e.response.status;
        result = {
            status: false,
            message: e.response.data.message,
        };
    }

    return reply.status(statusCode).send(buffer);
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

        // console.log(options)

        let url = `${config.ZOHO_BOOK_BASE_URL}/salesorders?organization_id=${config.ORGANIZATION_ID}`;

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


module.exports = { openingBalanceHandler, salesOrderHandler, downloadReportHandler }