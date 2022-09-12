const { default: axios } = require('axios');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const db = require("../../models");
const Invoice = db.invoices;
const InvoiceForecast = db.invoiceForecasts;
const Bill = db.bills;
const BillForecast = db.billForecasts;


let moment = require('moment');
const { Sequelize, invoiceForecasts } = require('../../models');
moment().format();

const getInvoice = async (options, forecastNumber, forecastPeriod) => {
    let date = moment();
    let startDate
    let endDate

    // monthly / yearly forecast
    // TODO::: rework this... only fetch start date and end date. should not be a loop.
    startDate = date.clone().subtract(2, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')

    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${process.env.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${process.env.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

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

const getBill = async (options, forecastNumber, forecastPeriod) => {
    let date = moment();
    let startDate;
    let endDate;

    startDate = date.clone().subtract(2, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')

    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${process.env.ZOHO_BOOK_BASE_URL}/bills?organization_id=${process.env.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

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


const openingBalanceHandler = async (req, reply) => {
    try {
        const { forecastPeriod, forecastNumber } = req.body;
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
        // TODO:: undo later

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


        if (!billForecasts.count && !invoiceForecasts.count && !bills.count && !invoices.count) {
            await getInvoice(options, forecastNumber, forecastPeriod);

            await getBill(options, forecastNumber, forecastPeriod);

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
        let openingBalances = [{ "month": month, "amount": 0, "currency": "NGN", "date": check }, { "month": month, "amount": 0, "currency": "USD", "date": check }];
        let nairaOpeningBalance = 0
        let dollarOpeningBalance = 0
        for (i = 0; i < invoiceForecasts.rows.length - 2; i++) {
            // console.log('invoice to sum', invoiceForecasts.rows[i])
            let invoiceForeacastClosingBalance = invoiceForecasts.rows[i].currency === 'NGN' ? invoiceForecasts.rows[i].nairaClosingBalance : invoiceForecasts.rows[i].dollarClosingBalance
            let billForeacastClosingBalance = billForecasts.rows[i].currency === 'NGN' ? billForecasts.rows[i].nairaClosingBalance : billForecasts.rows[i].dollarClosingBalance

            let check = moment(invoiceForecasts.rows[i + 2].month, 'YYYY-MM-DD');

            let month = check.format('MMMM');
            // console.log('first currency', invoiceForecasts.rows[i].currency);
            if (invoiceForecasts.rows[i].currency === 'NGN') {
                nairaOpeningBalance += invoiceForeacastClosingBalance - billForeacastClosingBalance
                openingBalances.push({ "month": month, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            } else {
                dollarOpeningBalance += invoiceForeacastClosingBalance - billForeacastClosingBalance
                openingBalances.push({ "month": month, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": check })
            }



        }


        // TODO:: remove this

        // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
        for (j = 0; j < openingBalances.length / 2; j++) {

            startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').endOf(forecastPeriod).format('YYYY-MM-DD')

            const totalAmountNGN = await Invoice.findAll({
                attributes: [
                    [db.sequelize.fn('sum', db.sequelize.col('naira')), 'total_naira_amount'],
                ],
                where: {
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
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
                    forecastType: `${forecastNumber} ${forecastPeriod}`,
                    currencyCode: 'USD',
                    dueDate: {
                        [Op.gt]: startDate,
                        [Op.lt]: endDate
                    }
                },
            });

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

        for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {

            if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
                cashInflowFromInvoiced.getCell(rowNum + 2).value = inputData.nairaClosingBalance
                totalCashInflowFromOperatingActivities.getCell(rowNum + 2).value = inputData.nairaClosingBalance
            } else {
                cashInflowFromInvoiced.getCell(rowNum + 2).value = inputData.dollarClosingBalance
                totalCashInflowFromOperatingActivities.getCell(rowNum + 2).value = inputData.dollarClosingBalance
            }


            cashInflowFromInvoiced.commit()
        }


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
        netWorkingCapital.getCell(1).value = 'Net Working Capital/(Deficit)';


        for (const [rowNum, inputData] of billForecasts.rows.entries()) {

            if (billForecasts.rows[rowNum].currency === 'NGN') {
                cashOutflowsOnCurrentTradePayables.getCell(rowNum + 2).value = inputData.nairaClosingBalance
                totalCashOutflows.getCell(rowNum + 2).value = inputData.nairaClosingBalance
            } else {
                cashOutflowsOnCurrentTradePayables.getCell(rowNum + 2).value = inputData.dollarClosingBalance
                totalCashOutflows.getCell(rowNum + 2).value = inputData.dollarClosingBalance
            }


            cashOutflowsOnCurrentTradePayables.commit()
        }


        await workbook.xlsx.writeFile('latest.xlsx')

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

        // console.log(options)

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