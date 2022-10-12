const { default: axios } = require('axios');
const ExcelJS = require('exceljs');
const config = require('../../../config');
let moment = require('moment');

const { getZohoExchangeRateHandler } = require('./exchange.handler');
const {
    createInvoiceForecast,
    createInvoice,
    createBill,
    createBillForecast,
    createInitialBalance,
    getInitialBalance,
    fetchAllInvoiceForecast,
    fetchAllBillForecast,
    fetchAllInvoice,
    fetchAllBill,
    createOpeningBalance,
    getPreviousDayOpeningBalance
} = require('../../helpers/dbQuery');
moment().format();

const getInvoice = async (options, forecastNumber, forecastPeriod, rate, userId) => {
    let date = moment();
    let startDate
    let endDate

    // monthly / yearly forecast
    // TODO::: rework this... only fetch start date and end date. should not be a loop.
    //TODO:: rework to fetch data by date...
    startDate = date.clone().add(0, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')
    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${config.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    resp = await axios.get(url, options);

    for (i = 0; i < forecastNumber; i++) {

        startDate = date.clone().add(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        endDate = date.clone().add(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');

        //TODO:: add filters here
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

        await createInvoiceForecast(userId, nairaClosingBalance, 0.0, startDate, forecastNumber, forecastPeriod, "NGN")

        await createInvoiceForecast(userId, 0.0, dollarClosingBalance, startDate, forecastNumber, forecastPeriod, "USD")

    }

    const filteredInvoices = resp.data.invoices.filter((item, index) =>
        item.status == 'sent' ||
        item.status == 'overdue' ||
        item.status == 'partially_paid' ||
        item.status == 'unpaid'
    );

    for (const [i, e] of filteredInvoices.entries()) {

        if (parseFloat(e.balance) > 0) {

            if ((rate.old !== rate.latest) && e.currency_code === 'NGN') {
                e.balance = (e.balance / rate.old) * rate.latest;
            }

            const payload = {
                userId,
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

            await createInvoice({ payload })

        }
    }
    return;

}

const getBill = async (options, forecastNumber, forecastPeriod, rate, userId) => {
    let date = moment();
    let startDate;
    let endDate;

    startDate = date.clone().add(0, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')

    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${config.ZOHO_BOOK_BASE_URL}/bills?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`

    resp = await axios.get(url, options);

    for (i = 0; i < forecastNumber; i++) {

        startDate = date.clone().add(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        endDate = date.clone().add(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');

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

        await createBillForecast(userId, nairaClosingBalance, 0.0, startDate, forecastNumber, forecastPeriod, "NGN")

        await createBillForecast(userId, 0.0, dollarClosingBalance, startDate, forecastNumber, forecastPeriod, "USD")

    }

    const filteredBills = resp.data.bills.filter((item, index) =>
        item.status == 'open' ||
        item.status == 'overdue' ||
        item.status == 'partially_paid'
    );

    for (const [i, e] of filteredBills.entries()) {

        if (parseFloat(e.balance) > 0) {

            if ((rate.old !== rate.latest) && e.currency_code === 'NGN') {
                e.balance = (e.balance / rate.old) * rate.latest;
            }

            const payload = {
                userId,
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

            await createBill({ payload })
        }

    }
}

const getSalesOrder = async (options, forecastNumber, forecastPeriod, rate, userId) => {
    let date = moment();
    let startDate;
    let endDate;

    startDate = date.clone().add(0, forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
    endDate = date.clone().add(forecastNumber - 1, forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD')

    // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
    let url = `${config.ZOHO_BOOK_BASE_URL}/salesorders?organization_id=${config.ORGANIZATION_ID}&shipment_date_start=${startDate}&shipment_date_end=${endDate}&sort_column=shipment_date`

    resp = await axios.get(url, options);

    for (i = 0; i < forecastNumber; i++) {
        startDate = date.clone().add(Math.abs(i), forecastPeriod).startOf(forecastPeriod).format('YYYY-MM-DD');
        endDate = date.clone().add(Math.abs(i), forecastPeriod).endOf(forecastPeriod).format('YYYY-MM-DD');


        const filteredItems = resp.data.sales.filter((item, index) => item.shipment_date >= startDate && item.shipment_date <= endDate);

        dollarClosingBalance = filteredItems.reduce(function (acc, obj) {

            total = obj.currency_code === 'USD' ? obj.total : 0.0

            return acc + total
        }, 0);

        nairaClosingBalance = filteredItems.reduce(function (acc, obj) {

            total = obj.currency_code === 'NGN' ? obj.total : 0.0

            if (rate.old !== rate.latest) {
                balance = (balance / rate.old) * rate.latest;
            }

            return acc + total
        }, 0);

        await createSaleForecast(userId, nairaClosingBalance, 0.0, startDate, forecastNumber, forecastPeriod, "NGN")

        await createSaleForecast(userId, 0.0, dollarClosingBalance, startDate, forecastNumber, forecastPeriod, "USD")

    }

    for (const [i, e] of resp.data.sales.entries()) {

        if (parseFloat(e.total) > 0) {

            if ((rate.old !== rate.latest) && e.currency_code === 'NGN') {
                e.total = (e.total / rate.old) * rate.latest;
            }

            const payload = {
                userId,
                saleOrderId: e.salesorder_id,
                customerName: e.customer_id,
                status: e.status,
                salesOrderNumber: e.salesorder_number,
                refrenceNumber: e.reference_number,
                date: e.date,
                shipmentDate: e.shipment_date,
                currencyCode: e.currency_code,
                total: e.total,
                naira: e.currency_code === 'NGN' ? e.total : 0.0,
                dollar: e.currency_code === 'USD' ? e.total : 0.0,
                exchangeRate: e.exchange_rate,
                forecastType: `${forecastNumber} ${forecastPeriod}`
            }

            await createBill({ payload })
        }

    }
}

// USE CRON JOB.
const createOpeningBalanceHandler = async (req, reply) => {
    try {
        const TODAY_START = moment().startOf('day').format();
        const TODAY_END = moment().endOf('day').format();

        let prevOpeningBalData = {
            yesterday_start: TODAY_START,
            yesterday_end: TODAY_END
        }
        // check if opening balance has been updated today. 
        const openingBalance = await getPreviousDayOpeningBalance({ prevOpeningBalData })

        if (openingBalance) {
            return reply.code(400).send({
                status: false,
                message: 'Opening Balance Already Exists',
            });
        }

        zoho = await axios.post('https://accounts.zoho.com/oauth/v2/token?refresh_token=1000.2850a17db7c34f1c1b49bc4ab95c5d8b.96921da50a793a7b48c2e97dc9d509a7&client_id=1000.TJGNSOYFT192B23XTR4P5889QPF6RC&client_secret=cacd523d84375e5c039b3c9474e4c0ffd6fbd311e4&redirect_uri=https://manifoldcomputers.com&grant_type=refresh_token');

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zoho.data.access_token
            }
        }

        let rateUrl = `${config.ZOHO_BOOK_BASE_URL}/settings/currencies/${config.DOLLAR_CURRENCY_ID}/exchangerates?organization_id=${config.ORGANIZATION_ID}`;

        res = await axios.get(rateUrl, options);

        if (res.data.error)
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });


        let bankAccountUrl = `${config.ZOHO_BOOK_BASE_URL}/bankaccounts?organization_id=${config.ORGANIZATION_ID}`;

        resp = await axios.get(bankAccountUrl, options);

        if (resp.data.error)
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch bank accounts',
            });

        let ngnBalance = 0;
        let usdBalance = 0;

        for (const [rowNum, inputData] of resp.data.bankaccounts.entries()) {
            if (inputData.currency_code === 'USD') {
                usdBalance += inputData.balance;
            }

            if (inputData.currency_code === 'NGN') {
                ngnBalance += inputData.balance;
            }
        }

        let usdToNaira = usdBalance * res.data.exchange_rates[0].rate;
        let totalOpeningBalance = ngnBalance + usdToNaira

        payload = {
            naira: ngnBalance,
            dollar: usdBalance,
            rate: res.data.exchange_rates[0].rate,
            amount: totalOpeningBalance
        }

        await createOpeningBalance({ payload })

        statusCode = 200;

        result = {
            status: true,
            message: 'Successfully',
            data: '',
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

// update when you update exchange rate
// update when you refresh
const getOpeningBalance = async (options, forecastNumber, forecastPeriod, rate, userId) => {
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


    let dollarOpeningInvoicesBalance = openingInvoice.data.invoices.reduce(function (acc, obj) {

        balance = obj.currency_code === 'USD' ? obj.balance : 0.0

        return acc + balance
    }, 0);

    let nairaOpeningInvoicesBalance = openingInvoice.data.invoices.reduce(function (acc, obj) {

        balance = obj.currency_code === 'NGN' ? obj.balance : 0.0

        if (rate.old !== rate.latest) {
            balance = (balance / rate.old) * rate.latest;
        }

        return acc + balance
    }, 0);

    let dollarOpeningBillsBalance = openingBills.data.bills.reduce(function (acc, obj) {

        balance = obj.currency_code === 'USD' ? obj.balance : 0.0

        return acc + balance
    }, 0);

    let nairaOpeningBillsBalance = openingBills.data.bills.reduce(function (acc, obj) {

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
        userId,
        nairaOpeningBalance: nairaOpeningBalance,
        dollarOpeningBalance: dollarOpeningBalance,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
    }
    // create this daily
    await createInitialBalance({ startingBalance })


    return startingBalance;
}

const generateReportHandler = async (req, reply) => {

    let statusCode = 400;
    let result = {
        status: false,
        message: 'Could not generate report',
    };

    try {
        let payload;
        const { forecastNumber, forecastPeriod, download } = req.body;
        const date = moment();
        const zohoAccessToken = req.body.zohoAccessToken;
        const YESTERDAY_START = moment().subtract(1, 'days').startOf('day').format()
        const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format()
        const TODAY_START = moment().startOf('day').format();
        const TODAY_END = moment().endOf('day').format();
        let previousDayOpeningBalance;


        const userId = req.user.id;

        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }

        let rate = await getZohoExchangeRateHandler(zohoAccessToken, forecastNumber, forecastPeriod, userId);

        if (!rate) {
            return reply.code(400).send({
                status: false,
                message: 'Could not fetch exchange rate',
            });
        }

        payload = {
            userId: userId,
            forecastNumber: forecastNumber,
            forecastPeriod: forecastPeriod,
            today_start: TODAY_START,
            today_end: TODAY_END
        }

        let invoices = await fetchAllInvoice({ payload });

        let bills = await fetchAllBill({ payload });

        // Get initial opening balance for a particular user
        let initialOpeningBalance = await getInitialBalance({ payload });

        // get invoice forecast where forecastType 
        let invoiceForecasts = await fetchAllInvoiceForecast({ payload });

        let billForecasts = await fetchAllBillForecast({ payload });

        // if user has not generated opening balance for the day then
        if (!initialOpeningBalance) {

            let prevOpeningBalData = {
                yesterday_start: YESTERDAY_START,
                yesterday_end: YESTERDAY_END
            }

            // fetch previous day opening balance.
            // previous day opening balance should have been populated from the CRON JOB.
            previousDayOpeningBalance = await getPreviousDayOpeningBalance({ prevOpeningBalData });

            // if no previous day opneing balance throw and error
            if (!previousDayOpeningBalance) {
                return reply.code(400).send({
                    status: false,
                    message: 'Could not fetch exchange rate for previous day',
                });
            }

            dollarOpening = previousDayOpeningBalance.amount / previousDayOpeningBalance.rate;

            let startingBalance = {
                userId,
                nairaOpeningBalance: dollarOpening * rate.latest,
                dollarOpeningBalance: dollarOpening,
                forecastType: `${forecastNumber} ${forecastPeriod}`,
            }

            await createInitialBalance({ startingBalance });

            let payload = {
                userId: userId,
                forecastNumber: forecastNumber,
                forecastPeriod: forecastPeriod,
                today_start: TODAY_START,
                today_end: TODAY_END
            }

            initialOpeningBalance = await getInitialBalance({ payload });

        }


        if (!billForecasts.count && !invoiceForecasts.count && !bills.count && !invoices.count) {

            //TODO:: this should be v2
            //await getSalesOrder(options, forecastNumber, forecastPeriod, rate, userId);

            await getInvoice(options, forecastNumber, forecastPeriod, rate, userId);

            await getBill(options, forecastNumber, forecastPeriod, rate, userId);

            invoices = await fetchAllInvoice({ payload });

            bills = await fetchAllBill({ payload });

            // get invoice forecast where forecastType 
            invoiceForecasts = await fetchAllInvoiceForecast({ payload });

            billForecasts = await fetchAllBillForecast({ payload });

        }



        let check = date.clone().add(0, forecastPeriod).startOf(forecastPeriod);
        let month = check.format('MMMM');


        let closingBalances = [];
        let nairaOpeningBalance = parseFloat(initialOpeningBalance.nairaOpeningBalance)
        let dollarOpeningBalance = parseFloat(initialOpeningBalance.dollarOpeningBalance)
        let openingBalances = [
            { "month": month, "amount": parseFloat(initialOpeningBalance.nairaOpeningBalance), "currency": "NGN", "date": check },
            { "month": month, "amount": parseFloat(initialOpeningBalance.dollarOpeningBalance), "currency": "USD", "date": check }
        ];

        for (i = 0; i < invoiceForecasts.rows.length - 2; i++) {
            let invoiceForeacastClosingBalance = invoiceForecasts.rows[i].currency === 'NGN' ? invoiceForecasts.rows[i].nairaClosingBalance : invoiceForecasts.rows[i].dollarClosingBalance
            let billForeacastClosingBalance = billForecasts.rows[i].currency === 'NGN' ? billForecasts.rows[i].nairaClosingBalance : billForecasts.rows[i].dollarClosingBalance

            let openingBalDate = moment(invoiceForecasts.rows[i + 2].month, 'YYYY-MM-DD')
            let opneingBalMonth = openingBalDate.format('MMMM');


            let closingBalDate = moment(invoiceForecasts.rows[i].month, 'YYYY-MM-DD')
            let closingBalMonth = closingBalDate.format('MMMM');

            if (invoiceForecasts.rows[i].currency === 'NGN') {


                nairaOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": opneingBalMonth, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": openingBalDate })
                closingBalances.push({ "month": closingBalMonth, "amount": nairaOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": closingBalDate })
            } else {
                dollarOpeningBalance += parseFloat(invoiceForeacastClosingBalance) - parseFloat(billForeacastClosingBalance)
                openingBalances.push({ "month": opneingBalMonth, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": openingBalDate })
                closingBalances.push({ "month": closingBalMonth, "amount": dollarOpeningBalance, "currency": invoiceForecasts.rows[i].currency, "date": closingBalDate })
            }
        }


        // Last Closing balance
        closingBalDate = date.clone().add(Math.abs(forecastNumber - 1), forecastPeriod).startOf(forecastPeriod);
        closingBalMonth = closingBalDate.format('MMMM');


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

        closingBalances.push({ "month": closingBalMonth, "amount": lastNairaClosingBalance, "currency": "NGN", "date": closingBalDate })
        closingBalances.push({ "month": closingBalMonth, "amount": lastDollarClosingBalance, "currency": "USD", "date": closingBalDate })


        // TODO:: remove this

        // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
        for (j = 0; j < openingBalances.length / 2; j++) {
            startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').startOf(forecastPeriod).format('YYYY-MM-DD');
            endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD').endOf(forecastPeriod).format('YYYY-MM-DD')

        }


        // Allows you to generate and download report
        if (download) {
            const workbook = new ExcelJS.Workbook();
            workbook.calcProperties.fullCalcOnLoad = true;
            const sheet = workbook.addWorksheet('My Sheet');


            const monthRow = sheet.getRow(1)
            const currencyRow = sheet.getRow(2)
            const openingBalanceRow = sheet.getRow(3)
            const cashInflow = sheet.getRow(6);

            openingBalanceRow.getCell(1).value = 'Opening Balance'
            cashInflow.getCell(1).value = 'CASH INFLOWS'

            for (const [rowNum, inputData] of openingBalances.entries()) {

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

                for (i = 1; i < invoiceForecasts.rows.length + 1; i++) {

                    month = moment(invoiceForecasts.rows[i - 1].month, 'YYYY-MM-DD').format('MMMM');

                    if ((inputData.dueDate === month)
                        && (inputData.currencyCode.toLowerCase() === invoiceForecasts.rows[i - 1].currency.toLowerCase())) {


                        if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {

                            rowX.getCell(i + 1).value = inputData.balance
                        }

                        if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {

                            rowX.getCell(i + 1).value = inputData.balance
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

                const rowX = sheet.getRow(rowNum + endOfInvoice + 4)

                inputData.dueDate = moment(inputData.dueDate, 'YYYY-MM-DD').format("MMMM");

                for (i = 1; i < invoiceForecasts.rows.length + 1; i++) {
                    month = moment(invoiceForecasts.rows[i - 1].month, 'YYYY-MM-DD').format('MMMM');
                    if ((inputData.dueDate === month)
                        && (inputData.currencyCode.toLowerCase() === invoiceForecasts.rows[i - 1].currency.toLowerCase())) {

                        if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {
                            rowX.getCell(i + 1).value = inputData.balance
                        }

                        if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {
                            rowX.getCell(i + 1).value = inputData.balance
                        }
                    }

                }


                sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {

                    rowX.getCell(1).value = inputData.vendorName;

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

            statusCode = 200;
            result = await workbook.xlsx.writeBuffer()
        } else {
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
                message: 'Report generated succesfully',
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



const salesOrderHandler = async (req, reply) => {

    try {
        let res;
        let zohoAccessToken = req.body.zohoAccessToken;


        const options = {
            headers: {
                'Content-Type': ['application/json'],
                'Authorization': 'Bearer ' + zohoAccessToken
            }
        }


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
        statusCode = e.response.status;
        result = {
            status: false,
            message: e.response.data.message,
        };
    }

    return reply.status(statusCode).send(result);
}


module.exports = { generateReportHandler, salesOrderHandler, createOpeningBalanceHandler }