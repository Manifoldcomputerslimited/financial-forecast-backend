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
  createSale,
  createSaleForecast,
  getInitialBalance,
  fetchAllInvoiceForecast,
  fetchAllBillForecast,
  fetchAllSaleForecast,
  fetchAllInvoice,
  fetchAllBill,
  fetchAllSale,
  getPreviousDayOpeningBalance,
} = require('../../helpers/dbQuery');
const { saleForecasts } = require('../../models');
moment().format();

const getInvoice = async (
  options,
  forecastNumber,
  forecastPeriod,
  rate,
  userId
) => {
  let date = moment();
  let startDate;
  let endDate;

  // monthly / yearly forecast
  //TODO:: rework to fetch data by date...
  startDate = date
    .clone()
    .add(0, forecastPeriod)
    .startOf(forecastPeriod)
    .format('YYYY-MM-DD');
  endDate = date
    .clone()
    .add(forecastNumber - 1, forecastPeriod)
    .endOf(forecastPeriod)
    .format('YYYY-MM-DD');

  let filteredInvoices = [];
  let i = 1;

  do {
    let url = `${config.ZOHO_BOOK_BASE_URL}/invoices?organization_id=${config.ORGANIZATION_ID}&due_date_end=${endDate}&sort_column=due_date&page=${i}`;

    resp = await axios.get(url, options);

    if (Array.isArray(resp.data.invoices) && resp.data.invoices.length > 0) {
      const filteredPreviousInvoices = resp.data.invoices.filter(
        (item, index) =>
          item.due_date < startDate &&
          (item.status == 'sent' ||
            item.status == 'overdue' ||
            item.status == 'partially_paid' ||
            item.status == 'unpaid')
      );

      const filteredCurrentInvoices = resp.data.invoices.filter(
        (item, index) =>
          item.due_date >= startDate &&
          item.due_date <= endDate &&
          (item.status == 'sent' ||
            item.status == 'overdue' ||
            item.status == 'partially_paid' ||
            item.status == 'unpaid')
      );

      filteredPreviousInvoices.reduce(async function (a, e) {
        e.due_date = startDate;
        filteredInvoices.push(e);
        return e;
      }, 0);

      filteredCurrentInvoices.reduce(async function (a, e) {
        filteredInvoices.push(e);
        return e;
      }, 0);
    }

    ++i;
  } while (!resp.data.invoices.length);

  for (i = 0; i < forecastNumber; i++) {
    startDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .startOf(forecastPeriod)
      .format('YYYY-MM-DD');
    endDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .endOf(forecastPeriod)
      .format('YYYY-MM-DD');

    let newFilteredInvoices = filteredInvoices.filter(
      (item, index) =>
        item.due_date >= startDate &&
        item.due_date <= endDate &&
        (item.status == 'sent' ||
          item.status == 'overdue' ||
          item.status == 'partially_paid' ||
          item.status == 'unpaid')
    );

    dollarClosingBalance = newFilteredInvoices.reduce(function (acc, obj) {
      balance = obj.currency_code === 'USD' ? obj.balance : 0.0;

      return acc + balance;
    }, 0);

    nairaClosingBalance = newFilteredInvoices.reduce(function (acc, obj) {
      balance =
        obj.currency_code === 'NGN'
          ? obj.balance
          : obj.balance * parseFloat(rate.latest).toFixed(2);

      if (rate.old !== rate.latest) {
        balance =
          (balance / parseFloat(rate.old).toFixed(2)) *
          parseFloat(rate.latest).toFixed(2);
      }

      return acc + balance;
    }, 0);

    await createInvoiceForecast(
      userId,
      parseFloat(nairaClosingBalance).toFixed(2),
      0.0,
      startDate,
      forecastNumber,
      forecastPeriod,
      'NGN'
    );

    await createInvoiceForecast(
      userId,
      0.0,
      parseFloat(dollarClosingBalance).toFixed(2),
      startDate,
      forecastNumber,
      forecastPeriod,
      'USD'
    );

    newFilteredInvoices.reduce(async function (a, e) {
      if (
        parseFloat(e.balance) > 0 &&
        (e.due_date >= startDate || e.due_date <= endDate)
      ) {
        if (
          parseFloat(rate.old).toFixed(2) !==
            parseFloat(rate.latest).toFixed(2) &&
          e.currency_code === 'NGN'
        ) {
          e.balance =
            (parseFloat(e.balance).toFixed(2) /
              parseFloat(rate.old).toFixed(2)) *
            parseFloat(rate.latest).toFixed(2);
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
          naira:
            e.currency_code === 'NGN'
              ? e.balance
              : e.balance * parseFloat(rate.latest).toFixed(2),
          dollar: e.currency_code === 'USD' ? e.balance : 0.0,
          exchangeRate: parseFloat(e.exchange_rate).toFixed(2),
          forecastType: `${forecastNumber} ${forecastPeriod}`,
        };

        await createInvoice({ payload });
      }

      return;
    }, 0);
  }
};

const getBill = async (
  options,
  forecastNumber,
  forecastPeriod,
  rate,
  userId
) => {
  let date = moment();
  let startDate;
  let endDate;

  startDate = date
    .clone()
    .add(0, forecastPeriod)
    .startOf(forecastPeriod)
    .format('YYYY-MM-DD');
  endDate = date
    .clone()
    .add(forecastNumber - 1, forecastPeriod)
    .endOf(forecastPeriod)
    .format('YYYY-MM-DD');

  // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
  let url = `${config.ZOHO_BOOK_BASE_URL}/bills?organization_id=${config.ORGANIZATION_ID}&due_date_start=${startDate}&due_date_end=${endDate}&sort_column=due_date`;

  resp = await axios.get(url, options);

  for (i = 0; i < forecastNumber; i++) {
    startDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .startOf(forecastPeriod)
      .format('YYYY-MM-DD');
    endDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .endOf(forecastPeriod)
      .format('YYYY-MM-DD');

    const filteredBills = resp.data.bills.filter(
      (item, index) =>
        item.due_date >= startDate &&
        item.due_date <= endDate &&
        (item.status == 'open' ||
          item.status == 'overdue' ||
          item.status == 'partially_paid')
    );

    dollarClosingBalance = filteredBills.reduce(function (acc, obj) {
      balance = obj.currency_code === 'USD' ? obj.balance : 0.0;

      return acc + balance;
    }, 0);

    nairaClosingBalance = filteredBills.reduce(function (acc, obj) {
      balance =
        obj.currency_code === 'NGN' ? obj.balance : obj.balance * rate.latest;

      if (rate.old !== rate.latest) {
        balance = (balance / rate.old) * rate.latest;
      }

      return acc + balance;
    }, 0);

    await createBillForecast(
      userId,
      nairaClosingBalance,
      0.0,
      startDate,
      forecastNumber,
      forecastPeriod,
      'NGN'
    );

    await createBillForecast(
      userId,
      0.0,
      dollarClosingBalance,
      startDate,
      forecastNumber,
      forecastPeriod,
      'USD'
    );

    filteredBills.reduce(async function (a, e) {
      if (parseFloat(e.balance) > 0) {
        if (rate.old !== rate.latest && e.currency_code === 'NGN') {
          e.balance = (e.balance / rate.old) * rate.latest;
        }

        const payload = {
          userId,
          billId: e.bill_id,
          vendorId: e.vendor_id,
          vendorName: e.vendor_name,
          status: e.status,
          invoiceNumber: e.bill_number,
          refrenceNumber: e.reference_number,
          date: e.date,
          dueDate: e.due_date,
          currencyCode: e.currency_code,
          balance: e.balance,
          naira:
            e.currency_code === 'NGN' ? e.balance : e.balance * rate.latest,
          dollar: e.currency_code === 'USD' ? e.balance : 0.0,
          exchangeRate: e.exchange_rate,
          forecastType: `${forecastNumber} ${forecastPeriod}`,
        };

        await createBill({ payload });
      }

      return;
    }, 0);
  }
};

const getSalesOrder = async (
  options,
  forecastNumber,
  forecastPeriod,
  rate,
  userId
) => {
  let date = moment();
  let startDate;
  let endDate;

  startDate = date
    .clone()
    .add(0, forecastPeriod)
    .startOf(forecastPeriod)
    .format('YYYY-MM-DD');
  endDate = date
    .clone()
    .add(forecastNumber - 1, forecastPeriod)
    .endOf(forecastPeriod)
    .format('YYYY-MM-DD');

  // TODO:: only 200 per page what if the page is 1000. A loop needs to be created
  let url = `${config.ZOHO_BOOK_BASE_URL}/salesorders?organization_id=${config.ORGANIZATION_ID}&shipment_date_start=${startDate}&shipment_date_end=${endDate}&sort_column=shipment_date`;

  resp = await axios.get(url, options);

  for (i = 0; i < forecastNumber; i++) {
    startDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .startOf(forecastPeriod)
      .format('YYYY-MM-DD');
    endDate = date
      .clone()
      .add(Math.abs(i), forecastPeriod)
      .endOf(forecastPeriod)
      .format('YYYY-MM-DD');

    const filteredSales = resp.data.salesorders.filter(
      (item, index) =>
        item.shipment_date >= startDate &&
        item.shipment_date <= endDate &&
        (item.status == 'open' ||
          item.status == 'overdue' ||
          item.status == 'partially_invoiced' ||
          item.status == 'draft')
    );

    dollarClosingBalance = filteredSales.reduce(function (acc, obj) {
      total = obj.currency_code === 'USD' ? obj.total : 0.0;

      return acc + total;
    }, 0);

    nairaClosingBalance = filteredSales.reduce(function (acc, obj) {
      total =
        obj.currency_code === 'NGN' ? obj.total : obj.total * rate.lastest;

      if (rate.old !== rate.latest) {
        balance = (balance / rate.old) * rate.latest;
      }

      return acc + total;
    }, 0);

    await createSaleForecast(
      userId,
      nairaClosingBalance,
      0.0,
      startDate,
      forecastNumber,
      forecastPeriod,
      'NGN'
    );

    await createSaleForecast(
      userId,
      dollarClosingBalance * rate.latest,
      dollarClosingBalance,
      startDate,
      forecastNumber,
      forecastPeriod,
      'USD'
    );

    filteredSales.reduce(async function (a, e) {
      if (parseFloat(e.total) > 0) {
        if (rate.old !== rate.latest && e.currency_code === 'NGN') {
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
          balance: e.total,
          naira: e.currency_code === 'NGN' ? e.total : e.balance * rate.latest,
          dollar: e.currency_code === 'USD' ? e.total : 0.0,
          exchangeRate: e.exchange_rate,
          forecastType: `${forecastNumber} ${forecastPeriod}`,
        };

        await createSale({ payload });
      }

      return;
    }, 0);
  }
};

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
    const YESTERDAY_START = moment()
      .subtract(1, 'days')
      .startOf('day')
      .format();
    const YESTERDAY_END = moment().subtract(1, 'days').endOf('day').format();
    const TODAY_START = moment().startOf('day').format();
    const TODAY_END = moment().endOf('day').format();
    console.log(moment());
    console.log('is this working?', YESTERDAY_END);
    console.log('is this working?', YESTERDAY_START);

    let previousDayOpeningBalance;

    const userId = req.user.id;

    const options = {
      headers: {
        'Content-Type': ['application/json'],
        Authorization: 'Bearer ' + zohoAccessToken,
      },
    };

    let rate = await getZohoExchangeRateHandler(
      zohoAccessToken,
      forecastNumber,
      forecastPeriod,
      userId
    );

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
      today_end: TODAY_END,
    };

    let invoices = await fetchAllInvoice({ payload });

    let bills = await fetchAllBill({ payload });

    let sales = await fetchAllSale({ payload });

    // Get initial opening balance for a particular user
    let initialOpeningBalance = await getInitialBalance({ payload });

    let saleForecasts = await fetchAllSaleForecast({ payload });

    // get invoice forecast where forecastType
    let invoiceForecasts = await fetchAllInvoiceForecast({ payload });

    let billForecasts = await fetchAllBillForecast({ payload });

    // if user has not generated opening balance for the day then
    if (!initialOpeningBalance) {
      let prevOpeningBalData = {
        yesterday_start: YESTERDAY_START,
        yesterday_end: YESTERDAY_END,
      };

      // fetch previous day opening balance.
      // previous day opening balance should have been populated from the CRON JOB.
      previousDayOpeningBalance = await getPreviousDayOpeningBalance({
        prevOpeningBalData,
      });

      // if no previous day opneing balance throw and error
      if (!previousDayOpeningBalance) {
        return reply.code(400).send({
          status: false,
          message: 'Could not fetch exchange rate for previous day',
        });
      }

      let startingBalance = {
        userId,
        openingBalance:
          parseFloat(previousDayOpeningBalance.naira) +
          parseFloat(previousDayOpeningBalance.dollar) *
            parseFloat(rate.latest).toFixed(2),
        nairaOpeningBalance: parseFloat(previousDayOpeningBalance.naira),
        dollarOpeningBalance: parseFloat(previousDayOpeningBalance.dollar),
        rate: rate.latest,
        forecastType: `${forecastNumber} ${forecastPeriod}`,
      };

      await createInitialBalance({ startingBalance });

      let payload = {
        userId: userId,
        forecastNumber: forecastNumber,
        forecastPeriod: forecastPeriod,
        today_start: TODAY_START,
        today_end: TODAY_END,
      };

      initialOpeningBalance = await getInitialBalance({ payload });
    }

    if (
      !billForecasts.count &&
      !invoiceForecasts.count &&
      !bills.count &&
      !invoices.count
    ) {
      //TODO:: this should be v2
      await getSalesOrder(
        options,
        forecastNumber,
        forecastPeriod,
        rate,
        userId
      );

      await getInvoice(options, forecastNumber, forecastPeriod, rate, userId);

      await getBill(options, forecastNumber, forecastPeriod, rate, userId);

      sales = await fetchAllSale({ payload });

      invoices = await fetchAllInvoice({ payload });

      bills = await fetchAllBill({ payload });

      saleForecasts = await fetchAllSaleForecast({ payload });

      // get invoice forecast where forecastType
      invoiceForecasts = await fetchAllInvoiceForecast({ payload });

      billForecasts = await fetchAllBillForecast({ payload });
    }

    let check = date.clone().add(0, forecastPeriod).startOf(forecastPeriod);
    let month = check.format('MMMM');

    let closingBalances = [];
    let nairaOpeningBalance = parseFloat(initialOpeningBalance.openingBalance);
    let dollarOpeningBalance = parseFloat(
      initialOpeningBalance.dollarOpeningBalance
    );
    let openingBalances = [
      {
        month: month,
        amount: parseFloat(initialOpeningBalance.openingBalance),
        currency: 'NGN',
        date: check,
      },
      {
        month: month,
        amount: parseFloat(initialOpeningBalance.dollarOpeningBalance),
        currency: 'USD',
        date: check,
      },
    ];

    for (i = 0; i < invoiceForecasts.rows.length - 2; i++) {
      let invoiceForeacastClosingBalance =
        invoiceForecasts.rows[i].currency === 'NGN'
          ? invoiceForecasts.rows[i].nairaClosingBalance
          : invoiceForecasts.rows[i].dollarClosingBalance;
      let billForeacastClosingBalance =
        billForecasts.rows[i].currency === 'NGN'
          ? billForecasts.rows[i].nairaClosingBalance
          : billForecasts.rows[i].dollarClosingBalance;

      let openingBalDate = moment(
        invoiceForecasts.rows[i + 2].month,
        'YYYY-MM-DD'
      );
      let opneingBalMonth = openingBalDate.format('MMMM');

      let closingBalDate = moment(invoiceForecasts.rows[i].month, 'YYYY-MM-DD');
      let closingBalMonth = closingBalDate.format('MMMM');

      if (invoiceForecasts.rows[i].currency === 'NGN') {
        nairaOpeningBalance +=
          parseFloat(invoiceForeacastClosingBalance) -
          parseFloat(billForeacastClosingBalance);
        openingBalances.push({
          month: opneingBalMonth,
          amount: nairaOpeningBalance,
          currency: invoiceForecasts.rows[i].currency,
          date: openingBalDate,
        });
        closingBalances.push({
          month: closingBalMonth,
          amount: nairaOpeningBalance,
          currency: invoiceForecasts.rows[i].currency,
          date: closingBalDate,
        });
      } else {
        dollarOpeningBalance +=
          parseFloat(invoiceForeacastClosingBalance) -
          parseFloat(billForeacastClosingBalance);
        openingBalances.push({
          month: opneingBalMonth,
          amount: dollarOpeningBalance,
          currency: invoiceForecasts.rows[i].currency,
          date: openingBalDate,
        });
        closingBalances.push({
          month: closingBalMonth,
          amount: dollarOpeningBalance,
          currency: invoiceForecasts.rows[i].currency,
          date: closingBalDate,
        });
      }
    }

    // Last Closing balance
    closingBalDate = date
      .clone()
      .add(Math.abs(forecastNumber - 1), forecastPeriod)
      .startOf(forecastPeriod);
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

    let lastDollarClosingBalance =
      parseFloat(dollarLastOpeningBalance.amount) +
      parseFloat(dollarLastInvoice.dollarClosingBalance) -
      parseFloat(dollarLastBill.dollarClosingBalance);
    let lastNairaClosingBalance =
      parseFloat(nairaLastOpeningBalance.amount) +
      parseFloat(nairaLastInvoice.nairaClosingBalance) -
      parseFloat(nairaLastBill.nairaClosingBalance);

    // then push to closing Balance
    closingBalances.push({
      month: closingBalMonth,
      amount: lastNairaClosingBalance,
      currency: 'NGN',
      date: closingBalDate,
    });
    closingBalances.push({
      month: closingBalMonth,
      amount: lastDollarClosingBalance,
      currency: 'USD',
      date: closingBalDate,
    });

    // loop through opening balance to get cash inflow from invoiced sales total and cash outflow on currennt trade payables total
    for (j = 0; j < openingBalances.length / 2; j++) {
      startDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD')
        .startOf(forecastPeriod)
        .format('YYYY-MM-DD');
      endDate = moment(openingBalances[j * 2].date, 'YYYY-MM-DD')
        .endOf(forecastPeriod)
        .format('YYYY-MM-DD');
    }

    // Allows you to generate and download report
    if (download) {
      const workbook = new ExcelJS.Workbook();
      workbook.calcProperties.fullCalcOnLoad = true;
      const sheet = workbook.addWorksheet('My Sheet');

      const monthRow = sheet.getRow(1);
      const currencyRow = sheet.getRow(2);
      const openingBalanceRow = sheet.getRow(3);
      const cashInflow = sheet.getRow(6);

      openingBalanceRow.getCell(1).value = 'Opening Balance';
      cashInflow.getCell(1).value = 'CASH INFLOWS';

      for (const [rowNum, inputData] of openingBalances.entries()) {
        monthRow.getCell(rowNum + 3).value = inputData.month;
        currencyRow.getCell(rowNum + 3).value = inputData.currency;
        openingBalanceRow.getCell(rowNum + 3).value = inputData.amount;

        monthRow.commit();
        currencyRow.commit();
        openingBalanceRow.commit();
      }
      let openingBalanceLength = openingBalances.length + 1;
      monthRow.getCell(openingBalanceLength + 2).value = 'Total';
      monthRow.getCell(openingBalanceLength + 3).value = 'Total';
      monthRow.getCell(openingBalanceLength + 5).value = 'Rate';

      currencyRow.getCell(openingBalanceLength + 2).value = 'NGN';
      currencyRow.getCell(openingBalanceLength + 3).value = 'USD Exposure';
      currencyRow.getCell(openingBalanceLength + 5).value = rate.latest;

      openingBalanceRow.getCell(openingBalanceLength + 2).value =
        initialOpeningBalance.openingBalance;
      openingBalanceRow.getCell(openingBalanceLength + 3).value =
        initialOpeningBalance.dollarOpeningBalance;

      monthRow.commit();
      currencyRow.commit();
      openingBalanceRow.commit();

      let cashInflowFromInvoiced;
      let totalCashInflowFromOperatingActivities;
      let cashOutflow;
      let endOfInvoice = (await invoices.count) + 7;
      let endOfBill = (await bills.count) + (await invoices.count) + 7;

      for (const [rowNum, inputData] of invoices.rows.entries()) {
        const rowX = sheet.getRow(rowNum + 7);

        inputData.dueDate = moment(inputData.dueDate, 'YYYY-MM-DD').format(
          'MMMM'
        );

        for (i = 1; i < invoiceForecasts.rows.length + 1; i++) {
          month = moment(
            invoiceForecasts.rows[i - 1].month,
            'YYYY-MM-DD'
          ).format('MMMM');

          if (
            inputData.dueDate === month &&
            inputData.currencyCode.toLowerCase() ===
              invoiceForecasts.rows[i - 1].currency.toLowerCase()
          ) {
            if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {
              rowX.getCell(i + 2).value = inputData.balance;
            }

            if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {
              rowX.getCell(i + 1).value = inputData.naira;
              rowX.getCell(i + 2).value = inputData.balance;
            }
          }
        }

        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          rowX.getCell(1).value = inputData.customerName;
          rowX.getCell(2).value = inputData.invoiceNumber;
        });

        rowX.commit();
      }
      cashInflowFromInvoiced = sheet.getRow(endOfInvoice);
      totalCashInflowFromOperatingActivities = sheet.getRow(endOfInvoice + 1);
      cashOutflow = sheet.getRow(endOfInvoice + 3);

      cashInflowFromInvoiced.getCell(1).value =
        'Cash inflow from invoiced sales';
      totalCashInflowFromOperatingActivities.getCell(1).value =
        'Total Cash Inflows from Operating Activties';
      cashOutflow.getCell(1).value = 'CASH OUTFLOWS';
      let totalNairaClosingBalance = 0.0;
      let totalDollarClosingBalance = 0.0;
      for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {
        if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaClosingBalance =
            totalNairaClosingBalance +
            parseFloat(inputData.nairaClosingBalance);
          cashInflowFromInvoiced.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
          totalCashInflowFromOperatingActivities.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
        } else {
          totalDollarClosingBalance =
            totalDollarClosingBalance +
            parseFloat(inputData.dollarClosingBalance);
          cashInflowFromInvoiced.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
          totalCashInflowFromOperatingActivities.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
        }

        cashInflowFromInvoiced.commit();
      }

      // total invoice forecast for dollar and naira
      let invoiceForecastsLength = invoiceForecasts.rows.length;
      cashInflowFromInvoiced.getCell(invoiceForecastsLength + 3).value =
        totalNairaClosingBalance;
      cashInflowFromInvoiced.getCell(invoiceForecastsLength + 4).value =
        totalDollarClosingBalance;
      totalCashInflowFromOperatingActivities.getCell(
        invoiceForecastsLength + 3
      ).value = totalNairaClosingBalance;
      totalCashInflowFromOperatingActivities.getCell(
        invoiceForecastsLength + 4
      ).value = totalDollarClosingBalance;

      cashInflowFromInvoiced.commit();
      totalCashInflowFromOperatingActivities.commit();

      newArray = [];
      for (const [rowNum, inputData] of bills.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfInvoice + 4);

        inputData.dueDate = moment(inputData.dueDate, 'YYYY-MM-DD').format(
          'MMMM'
        );

        for (i = 1; i < invoiceForecasts.rows.length + 1; i++) {
          month = moment(
            invoiceForecasts.rows[i - 1].month,
            'YYYY-MM-DD'
          ).format('MMMM');
          if (
            inputData.dueDate === month &&
            inputData.currencyCode.toLowerCase() ===
              invoiceForecasts.rows[i - 1].currency.toLowerCase()
          ) {
            if (inputData.currencyCode.toLowerCase() === 'NGN'.toLowerCase()) {
              rowX.getCell(i + 2).value = inputData.balance;
            }

            if (inputData.currencyCode.toLowerCase() === 'USD'.toLowerCase()) {
              rowX.getCell(i + 1).value = inputData.naira;
              rowX.getCell(i + 2).value = inputData.balance;
            }
          }
        }

        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          rowX.getCell(1).value = inputData.vendorName;
          rowX.getCell(2).value = inputData.refrenceNumber;
        });

        rowX.commit();
      }

      cashOutflowsOnCurrentTradePayables = sheet.getRow(endOfBill + 4);
      totalCashOutflows = sheet.getRow(endOfBill + 5);
      netWorkingCapital = sheet.getRow(endOfBill + 7);
      cashOutflowsOnCurrentTradePayables.getCell(1).value =
        'Cash Outflows on Current Trade Payables';
      totalCashOutflows.getCell(1).value = 'Total Cash Outflows';

      let totalNairaCashOutflowsOnCurrentTradePayables = 0.0;
      let totalNairaCashOutflows = 0.0;
      let totalDollarCashOutflowsOnCurrentTradePayables = 0.0;
      let totalDollarCashOutflows = 0.0;

      for (const [rowNum, inputData] of billForecasts.rows.entries()) {
        if (billForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaCashOutflowsOnCurrentTradePayables += parseFloat(
            inputData.nairaClosingBalance
          );
          totalNairaCashOutflows += parseFloat(inputData.nairaClosingBalance);
          cashOutflowsOnCurrentTradePayables.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
          totalCashOutflows.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
        } else {
          totalDollarCashOutflowsOnCurrentTradePayables += parseFloat(
            inputData.dollarClosingBalance
          );
          totalDollarCashOutflows += parseFloat(inputData.dollarClosingBalance);
          cashOutflowsOnCurrentTradePayables.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
          totalCashOutflows.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
        }

        cashOutflowsOnCurrentTradePayables.commit();
      }

      // total bill forecast for naira and dollar
      let billForecastsLength = billForecasts.rows.length;
      cashOutflowsOnCurrentTradePayables.getCell(
        billForecastsLength + 3
      ).value = totalNairaCashOutflowsOnCurrentTradePayables;

      cashOutflowsOnCurrentTradePayables.getCell(
        billForecastsLength + 4
      ).value = totalDollarCashOutflowsOnCurrentTradePayables;

      totalCashOutflows.getCell(billForecastsLength + 3).value =
        totalDollarCashOutflows;

      totalCashOutflows.getCell(billForecastsLength + 4).value =
        totalNairaCashOutflows;

      cashOutflowsOnCurrentTradePayables.commit();
      totalCashOutflows.commit();

      netWorkingCapital.getCell(1).value = 'Closing Balance';
      const closingBalanceRow = netWorkingCapital;

      for (const [rowNum, inputData] of closingBalances.entries()) {
        closingBalanceRow.getCell(rowNum + 3).value = inputData.amount;

        closingBalanceRow.commit();
      }

      // nairaNetWorkingCapital
      let totalNairaNetWorkingCapital =
        parseFloat(initialOpeningBalance.openingBalance) +
        parseFloat(totalNairaClosingBalance) -
        parseFloat(totalNairaCashOutflows);
      // dollarNetWorkingCapital
      let totalDollarNetWorkingCapital =
        parseFloat(initialOpeningBalance.dollarOpeningBalance) +
        parseFloat(totalDollarClosingBalance) -
        parseFloat(totalDollarCashOutflows);

      netWorkingCapital.getCell(closingBalances.length + 3).value =
        totalNairaNetWorkingCapital;
      netWorkingCapital.getCell(closingBalances.length + 4).value =
        totalDollarNetWorkingCapital;

      statusCode = 200;
      result = await workbook.xlsx.writeBuffer();
    } else {
      let totalNairaCashInflow = 0.0;
      let totalDollarCashInflow = 0.0;
      let totalNairaCashOutflow = 0.0;
      let totalDollarCashOutflow = 0.0;

      for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {
        if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaCashInflow += parseFloat(inputData.nairaClosingBalance);
        } else {
          totalDollarCashInflow += parseFloat(inputData.dollarClosingBalance);
        }
      }

      for (const [rowNum, inputData] of billForecasts.rows.entries()) {
        if (billForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaCashOutflow += parseFloat(inputData.nairaClosingBalance);
        } else {
          totalDollarCashOutflow += parseFloat(inputData.dollarClosingBalance);
        }
      }

      // nairaNetWorkingCapital
      let totalNairaNetWorkingCapital =
        parseFloat(initialOpeningBalance.openingBalance) +
        parseFloat(totalNairaCashInflow) -
        parseFloat(totalNairaCashOutflow);
      // dollarNetWorkingCapital
      let totalDollarNetWorkingCapital =
        parseFloat(initialOpeningBalance.dollarOpeningBalance) +
        parseFloat(totalDollarCashInflow) -
        parseFloat(totalDollarCashOutflow);

      statusCode = 200;
      result = {
        status: true,
        message: 'Report generated succesfully',
        data: {
          report: {
            openingBalance: {
              naira: initialOpeningBalance.openingBalance,
              dollar: initialOpeningBalance.dollarOpeningBalance,
            },
            totalCashInflow: {
              naira: totalNairaCashInflow,
              dollar: totalDollarCashInflow,
            },
            totalCashOutflow: {
              naira: totalNairaCashOutflow,
              dollar: totalDollarCashOutflow,
            },
            closingBalance: {
              naira: totalNairaNetWorkingCapital,
              dollar: totalDollarNetWorkingCapital,
            },
          },
          invoices: invoices.rows.reverse(),
          bills: bills.rows.reverse(),
          sales: sales.rows.reverse(),
        },
      };
    }
  } catch (e) {
    statusCode = e.response.status;
    result = {
      status: false,
      message: e.response.data.message,
    };
  }

  return reply.status(statusCode).send(result);
};

const salesOrderHandler = async (req, reply) => {
  try {
    let res;
    let zohoAccessToken = req.body.zohoAccessToken;

    const options = {
      headers: {
        'Content-Type': ['application/json'],
        Authorization: 'Bearer ' + zohoAccessToken,
      },
    };

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
    };
  } catch (e) {
    statusCode = e.response.status;
    result = {
      status: false,
      message: e.response.data.message,
    };
  }

  return reply.status(statusCode).send(result);
};

module.exports = {
  generateReportHandler,
  salesOrderHandler,
};
