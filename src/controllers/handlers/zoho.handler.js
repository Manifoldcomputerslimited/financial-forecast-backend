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
  createPurchase,
  createPurchaseForecast,
  createSale,
  createSaleForecast,
  createVendorPayment,
  createCustomerPayment,
  getInitialBalance,
  fetchAllInvoiceForecast,
  fetchAllBillForecast,
  fetchAllPurchaseForecast,
  fetchAllSaleForecast,
  fetchAllInvoice,
  fetchAllBill,
  fetchAllPurchase,
  fetchAllSale,
  fetchAllVendorPayments,
  fetchAllCustomerPayments,
  getPurchaseForecast,
  getSaleForecast,
  getPreviousDayOpeningBalance,
  getVendorPaymentByVendorId,
  getCustomerPaymentByCustomerId,
} = require('../../helpers/dbQuery');
const db = require('../../models');
const VendorPayment = db.vendorPayments;
const CustomerPayment = db.customerPayments;
const Purchase = db.purchases;
const Sale = db.sales;
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
          (item.currency_code == 'NGN' || item.currency_code == 'USD') &&
          (item.status == 'sent' ||
            item.status == 'overdue' ||
            item.status == 'partially_paid' ||
            item.status == 'unpaid')
      );

      const filteredCurrentInvoices = resp.data.invoices.filter(
        (item, index) =>
          item.due_date >= startDate &&
          item.due_date <= endDate &&
          (item.currency_code == 'NGN' || item.currency_code == 'USD') &&
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
        (item.currency_code == 'NGN' || item.currency_code == 'USD') &&
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

const getCustomerPayments = async (
  zohoAccessToken,
  forecastNumber,
  forecastPeriod,
  rate,
  userId
) => {
  let currency_code;
  let customerPayments = [];
  let i = 1;
  const TODAY_START = moment().startOf('day').format();
  const TODAY_END = moment().endOf('day').format();

  options = {
    headers: {
      'Content-Type': ['application/json'],
      Authorization: 'Zoho-oauthtoken ' + zohoAccessToken,
    },
  };

  do {
    let url = `${config.ZOHO_BOOK_BASE_URL}/customerpayments?organization_id=${config.ORGANIZATION_ID}&page=${i}`;

    resp = await axios.get(url, options);

    const filteredCustomerPayments = resp.data.customerpayments.filter(
      (item, index) => {
        const accountName = item.account_name;
        const naira = /NGN/;
        const dollar = /USD/;

        if (accountName.match(naira)) {
          currency_code = 'NGN';
        }

        if (accountName.match(dollar)) {
          currency_code = 'USD';
        }
        return (
          item.unused_amount > 0 &&
          (currency_code === 'USD' || currency_code === 'NGN')
        );
      }
    );

    filteredCustomerPayments.reduce(async function (a, e) {
      customerPayments.push(e);
      return e;
    }, 0);

    ++i;
  } while (resp.data.page_context.has_more_page);

  for (i = 0; i < customerPayments.length; i++) {
    let e = customerPayments[i];
    const accountName = e.account_name;
    const ngn = /NGN/;
    const usd = /USD/;
    let naira = accountName.match(ngn);
    let dollar = accountName.match(usd);

    if (accountName.match(naira)) {
      currency_code = 'NGN';
    }

    if (accountName.match(dollar)) {
      currency_code = 'USD';
    }

    // let payload = {
    //   customerId: e.customer_id,
    //   userId,
    //   forecastNumber: forecastNumber,
    //   forecastPeriod: forecastPeriod,
    //   today_start: TODAY_START,
    //   today_end: TODAY_END,
    //   currencyCode: currency_code,
    // };

    // let customerPayment = await getCustomerPaymentByCustomerId({ payload });

    // if (customerPayment) {
    //   await customerPayment.update({
    //     amount:
    //       parseFloat(customerPayment.amount) + parseFloat(e.unused_amount),
    //     balance:
    //       parseFloat(customerPayment.unused_amount) +
    //       parseFloat(e.unused_amount),
    //     customerForcastbalance:
    //       parseFloat(customerPayment.customerForcastbalance) +
    //       parseFloat(e.unused_amount),
    //   });
    //   continue;
    // }

    payload = {
      userId,
      paymentId: e.payment_id,
      customerId: e.customer_id,
      customerName: e.customer_name,
      billNumbers: e.bill_numbers,
      referenceNumber: e.reference_number,
      date: e.date,
      currencyCode: currency_code,
      amount: e.unused_amount,
      balance: e.unused_amount,
      saleForcastbalance: e.unused_amount,
      exchangeRate: e.exchange_rate,
      forecastType: `${forecastNumber} ${forecastPeriod}`,
    };

    await createCustomerPayment({
      payload,
    });
  }
};

const getVendorPayments = async (
  zohoAccessToken,
  forecastNumber,
  forecastPeriod,
  rate,
  userId
) => {
  let vendorPayments = [];
  let i = 1;
  const TODAY_START = moment().startOf('day').format();
  const TODAY_END = moment().endOf('day').format();

  options = {
    headers: {
      'Content-Type': ['application/json'],
      Authorization: 'Zoho-oauthtoken ' + zohoAccessToken,
    },
  };

  do {
    let url = `${config.ZOHO_BOOK_BASE_URL}/vendorpayments?organization_id=${config.ORGANIZATION_ID}&page=${i}`;

    resp = await axios.get(url, options);

    const filteredVendorPayments = resp.data.vendorpayments.filter(
      (item, index) =>
        item.balance > 0 &&
        (item.currency_code === 'USD' || item.currency_code === 'NGN')
    );

    filteredVendorPayments.reduce(async function (a, e) {
      vendorPayments.push(e);
      return e;
    }, 0);

    ++i;
  } while (resp.data.page_context.has_more_page);

  for (i = 0; i < vendorPayments.length; i++) {
    let e = vendorPayments[i];
    // let payload = {
    //   vendorId: e.vendor_id,
    //   userId,
    //   forecastNumber: forecastNumber,
    //   forecastPeriod: forecastPeriod,
    //   today_start: TODAY_START,
    //   today_end: TODAY_END,
    //   currencyCode: e.currency_code,
    // };

    // let vendorPayment = await getVendorPaymentByVendorId({ payload });

    // if (vendorPayment) {
    //   await vendorPayment.update({
    //     amount: parseFloat(vendorPayment.amount) + parseFloat(e.balance),
    //     balance: parseFloat(vendorPayment.balance) + parseFloat(e.balance),
    //     purchaseForcastbalance:
    //       parseFloat(vendorPayment.purchaseForcastbalance) +
    //       parseFloat(e.balance),
    //   });
    //   continue;
    // }

    payload = {
      userId,
      paymentId: e.payment_id,
      vendorId: e.vendor_id,
      vendorName: e.vendor_name,
      billNumbers: e.bill_numbers.length > 15 ? e.bill_numbers.substring(0, 15) + "..." : e.bill_numbers,
      referenceNumber: e.reference_number,
      date: e.date,
      currencyCode: e.currency_code,
      amount: e.balance,
      balance: e.balance,
      purchaseForcastbalance: e.balance,
      exchangeRate: e.exchange_rate,
      forecastType: `${forecastNumber} ${forecastPeriod}`,
    };

    await createVendorPayment({
      payload,
    });
  }
};

const getPurchaseOrder = async (
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

  let filteredPurchases = [];
  let i = 1;
  let payload;

  do {
    let url = `${config.ZOHO_BOOK_BASE_URL}/purchaseorders?organization_id=${config.ORGANIZATION_ID}&delivery_date_end=${endDate}&sort_column=delivery_date&page=${i}`;

    resp = await axios.get(url, options);


    if (
      Array.isArray(resp.data.purchaseorders) &&
      resp.data.purchaseorders.length > 0
    ) {
      const filteredPreviousPurchases = resp.data.purchaseorders.filter(
        (item, index) => item.delivery_date < startDate
      );

      const filteredCurrentPurchases = resp.data.purchaseorders.filter(
        (item, index) =>
          item.delivery_date >= startDate && item.delivery_date <= endDate
      );

      filteredPreviousPurchases.reduce(async function (a, e) {
        e.delivery_date = startDate;
        filteredPurchases.push(e);
        return e;
      }, 0);

      filteredCurrentPurchases.reduce(async function (a, e) {
        filteredPurchases.push(e);
        return e;
      }, 0);
    }

    ++i;
  } while (!resp.data.purchaseorders.length);

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

    let newFilteredPurchases = filteredPurchases.filter(
      (item, index) =>
        item.delivery_date >= startDate &&
        item.delivery_date <= endDate &&
        item.status == 'open'
    );

    dollarClosingBalance = newFilteredPurchases.reduce(function (acc, obj) {
      balance = obj.currency_code === 'USD' ? obj.total : 0.0;

      return acc + balance;
    }, 0);

    nairaClosingBalance = newFilteredPurchases.reduce(function (acc, obj) {
      balance =
        obj.currency_code === 'NGN'
          ? obj.total
          : obj.total * parseFloat(rate.latest).toFixed(2);

      if (rate.old !== rate.latest) {
        balance =
          (balance / parseFloat(rate.old).toFixed(2)) *
          parseFloat(rate.latest).toFixed(2);
      }

      return acc + balance;
    }, 0);

    await createPurchaseForecast(
      userId,
      parseFloat(nairaClosingBalance).toFixed(2),
      0.0,
      startDate,
      forecastNumber,
      forecastPeriod,
      'NGN'
    );

    await createPurchaseForecast(
      userId,
      0.0,
      parseFloat(dollarClosingBalance).toFixed(2),
      startDate,
      forecastNumber,
      forecastPeriod,
      'USD'
    );

    newFilteredPurchases.reduce(async function (a, e) {
      if (
        parseFloat(e.total) > 0 &&
        (e.delivery_date >= startDate || e.delivery_date <= endDate)
      ) {
        if (
          parseFloat(rate.old).toFixed(2) !==
            parseFloat(rate.latest).toFixed(2) &&
          e.currency_code === 'NGN'
        ) {
          e.total =
            (parseFloat(e.total).toFixed(2) / parseFloat(rate.old).toFixed(2)) *
            parseFloat(rate.latest).toFixed(2);
        }

        payload = {
          userId,
          purchaseOrderId: e.purchaseorder_id,
          vendorId: e.vendor_id,
          vendorName: e.vendor_name,
          status: e.status,
          purchaseOrderNumber: e.purchaseorder_number,
          refrenceNumber: e.reference_number,
          date: e.date,
          deliveryDate: e.delivery_date,
          currencyCode: e.currency_code,
          total: e.total,
          naira:
            e.currency_code === 'NGN'
              ? e.total
              : e.total * parseFloat(rate.latest).toFixed(2),
          dollar: e.currency_code === 'USD' ? e.total : 0.0,
          balance: e.total,
          exchangeRate: parseFloat(rate.latest).toFixed(2),
          forecastType: `${forecastNumber} ${forecastPeriod}`,
        };

        await createPurchase({ payload });
      }
      return;
    }, 0);
  }
};

// const processPurchases = async (
//   purchases,
//   vendorPayments,
//   userId,
//   forecastNumber,
//   forecastPeriod
// ) => {
//   const TODAY_START = moment().startOf('day').format();
//   const TODAY_END = moment().endOf('day').format();

//   let nairaBalance = 0;
//   let dollarBalance = 0;

//   for (i = 0; i < purchases.count; i++) {
//     for (j = 0; j < vendorPayments.count; j++) {
//       let purchase = purchases.rows[i];
//       let payment = vendorPayments.rows[j];
//       if (
//         purchase.vendorId == payment.vendorId &&
//         purchase.currencyCode == payment.currencyCode
//       ) {
//         let paymentMadeBalance = 0;
//         let total = 0;

//         let purchaseMade = parseFloat(purchase.total);
//         let vendorPayment = await VendorPayment.findOne({
//           where: {
//             vendorId: payment.vendorId,
//           },
//         });
//         let paymentMade = parseFloat(vendorPayment.balance);
//         if (paymentMade >= purchaseMade) {
//           paymentMadeBalance = paymentMade - purchaseMade;
//           dollarBalance =
//             payment.currencyCode == 'USD'
//               ? dollarBalance + purchaseMade
//               : dollarBalance;
//           nairaBalance =
//             payment.currencyCode == 'NGN'
//               ? nairaBalance + purchaseMade
//               : nairaBalance;

//           let payload = {
//             userId: userId,
//             forecastType: purchase.forecastType,
//             currency: payment.currencyCode == 'NGN' ? 'NGN' : 'USD',
//             today_start: TODAY_START,
//             today_end: TODAY_END,
//           };

//           let purchaseForecast = await getPurchaseForecast({ payload });

//           await purchaseForecast.update({
//             nairaClosingBalance:
//               payment.currencyCode == 'NGN'
//                 ? parseFloat(purchaseForecast.nairaClosingBalance) -
//                   parseFloat(purchaseMade)
//                 : parseFloat(purchaseForecast.nairaClosingBalance),
//             dollarClosingBalance:
//               payment.currencyCode == 'USD'
//                 ? parseFloat(purchaseForecast.dollarClosingBalance) -
//                   parseFloat(purchaseMade)
//                 : parseFloat(purchaseForecast.dollarClosingBalance),
//           });
//         } else {
//           total = purchaseMade - paymentMade;

//           dollarBalance =
//             payment.currencyCode == 'USD'
//               ? dollarBalance + paymentMade
//               : dollarBalance;
//           nairaBalance =
//             payment.currencyCode == 'NGN'
//               ? nairaBalance + paymentMade
//               : nairaBalance;
//           let payload = {
//             userId: userId,
//             forecastType: purchase.forecastType,
//             currency: payment.currencyCode == 'NGN' ? 'NGN' : 'USD',
//             today_start: TODAY_START,
//             today_end: TODAY_END,
//           };

//           let purchaseForecast = await getPurchaseForecast({ payload });

//           await purchaseForecast.update({
//             nairaClosingBalance:
//               payment.currencyCode == 'NGN'
//                 ? parseFloat(purchaseForecast.nairaClosingBalance) -
//                   parseFloat(purchaseMade)
//                 : parseFloat(purchaseForecast.nairaClosingBalance),
//             dollarClosingBalance:
//               payment.currencyCode == 'USD'
//                 ? parseFloat(purchaseForecast.dollarClosingBalance) -
//                   parseFloat(purchaseMade)
//                 : parseFloat(purchaseForecast.dollarClosingBalance),
//           });
//         }
//         await VendorPayment.update(
//           {
//             balance: paymentMadeBalance,
//           },
//           {
//             where: {
//               vendorId: payment.vendorId,
//             },
//           }
//         );

//         await Purchase.update(
//           {
//             balance: total,
//           },
//           {
//             where: {
//               vendorId: payment.vendorId,
//               purchaseOrderId: purchase.purchaseOrderId,
//             },
//           }
//         );
//       }
//     }
//   }
// };

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

  let filteredSales = [];
  let i = 1;

  do {
    let url = `${config.ZOHO_BOOK_BASE_URL}/salesorders?organization_id=${config.ORGANIZATION_ID}&shipment_date_start=${startDate}&shipment_date_end=${endDate}&sort_column=shipment_date&page=${i}`;

    resp = await axios.get(url, options);

    if (
      Array.isArray(resp.data.salesorders) &&
      resp.data.salesorders.length > 0
    ) {
      const filteredPreviousSales = resp.data.salesorders.filter(
        (item, index) =>
          item.shipment_date < startDate &&
          (item.status == 'open' ||
            item.status == 'overdue' ||
            item.status == 'partially_invoiced')
      );

      const filteredCurrentSales = resp.data.salesorders.filter(
        (item, index) =>
          item.shipment_date >= startDate &&
          item.shipment_date <= endDate &&
          (item.status == 'open' ||
            item.status == 'overdue' ||
            item.status == 'partially_invoiced')
      );

      filteredPreviousSales.reduce(async function (a, e) {
        e.shipment_date = startDate;
        filteredSales.push(e);
        return e;
      }, 0);

      filteredCurrentSales.reduce(async function (a, e) {
        filteredSales.push(e);
        return e;
      }, 0);
    }
    ++i;
  } while (!resp.data.salesorders.length);

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

    const newFilteredSales = filteredSales.filter(
      (item, index) =>
        item.shipment_date >= startDate &&
        item.shipment_date <= endDate &&
        (item.status == 'open' ||
          item.status == 'overdue' ||
          item.status == 'partially_invoiced')
    );


    dollarClosingBalance = newFilteredSales.reduce(function (acc, obj) {
      balance = obj.currency_code === 'USD' ? obj.total : 0.0;

      return acc + balance;
    }, 0);

    nairaClosingBalance = newFilteredSales.reduce(function (acc, obj) {

      balance =
        obj.currency_code === 'NGN'
          ? obj.total
          : obj.total * parseFloat(rate.latest).toFixed(2);

      if (rate.old !== rate.latest) {
        balance =
          (balance / parseFloat(rate.old).toFixed(2)) *
          parseFloat(rate.latest).toFixed(2);
      }

      return acc + balance;
    }, 0);

    await createSaleForecast(
      userId,
      parseFloat(nairaClosingBalance).toFixed(2),
      0.0,
      startDate,
      forecastNumber,
      forecastPeriod,
      'NGN'
    );

    await createSaleForecast(
      userId,
      0.0,
      parseFloat(dollarClosingBalance).toFixed(2),
      startDate,
      forecastNumber,
      forecastPeriod,
      'USD'
    );

    newFilteredSales.reduce(async function (a, e) {
      if (parseFloat(e.total) > 0) {
        if (
          parseFloat(rate.old).toFixed(2) !==
            parseFloat(rate.latest).toFixed(2) &&
          e.currency_code === 'NGN'
        ) {
          e.total =
            (parseFloat(e.total).toFixed(2) / parseFloat(rate.old).toFixed(2)) *
            parseFloat(rate.latest).toFixed(2);
        }

        const payload = {
          userId,
          saleOrderId: e.salesorder_id,
          customerId: e.customer_id,
          customerName: e.customer_name,
          status: e.status,
          salesOrderNumber: e.salesorder_number,
          refrenceNumber: e.reference_number,
          date: e.date,
          shipmentDate: e.shipment_date,
          currencyCode: e.currency_code,
          total: e.total,
          naira:
            e.currency_code === 'NGN'
              ? e.total
              : e.total * parseFloat(rate.latest).toFixed(2),
          dollar: e.currency_code === 'USD' ? e.total : 0.0,
          balance: e.total,
          exchangeRate: parseFloat(rate.latest).toFixed(2),
          forecastType: `${forecastNumber} ${forecastPeriod}`,
        };

        await createSale({ payload });
      }

      return;
    }, 0);
  }
};

// const processSales = async (
//   sales,
//   customerPayments,
//   userId,
//   forecastNumber,
//   forecastPeriod
// ) => {
//   const TODAY_START = moment().startOf('day').format();
//   const TODAY_END = moment().endOf('day').format();
//   let nairaBalance = 0;
//   let dollarBalance = 0;

//   for (i = 0; i < sales.count; i++) {
//     for (j = 0; j < customerPayments.count; j++) {
//       let sale = sales.rows[i];
//       let payment = customerPayments.rows[j];

//       if (
//         sale.customerId == payment.customerId &&
//         sale.currencyCode == payment.currencyCode
//       ) {
//         let paymentRecievedBalance = 0;
//         let total = 0;

//         let saleRecieved = parseFloat(sale.total);
//         let customerPayment = await CustomerPayment.findOne({
//           where: {
//             customerId: payment.customerId,
//           },
//         });
//         let paymentRecieved = parseFloat(customerPayment.balance);
//         if (paymentRecieved >= saleRecieved) {
//           paymentRecievedBalance = paymentRecieved - saleRecieved;
//           dollarBalance =
//             payment.currencyCode == 'USD'
//               ? dollarBalance + saleRecieved
//               : dollarBalance;
//           nairaBalance =
//             payment.currencyCode == 'NGN'
//               ? nairaBalance + saleRecieved
//               : nairaBalance;
//         } else {
//           total = saleRecieved - paymentRecieved;

//           dollarBalance =
//             payment.currencyCode == 'USD'
//               ? dollarBalance + paymentRecieved
//               : dollarBalance;
//           nairaBalance =
//             payment.currencyCode == 'NGN'
//               ? nairaBalance + paymentRecieved
//               : nairaBalance;
//         }
//         await CustomerPayment.update(
//           {
//             balance: paymentRecievedBalance,
//           },
//           {
//             where: {
//               customerId: payment.customerId,
//             },
//           }
//         );

//         await Sale.update(
//           {
//             balance: total,
//           },
//           {
//             where: {
//               customerId: payment.customerId,
//               saleOrderId: sale.saleOrderId,
//             },
//           }
//         );
//       }
//     }
//   }

//   let payload = {
//     userId: userId,
//     forecastNumber: forecastNumber,
//     forecastPeriod: forecastPeriod,
//     currency: 'NGN',
//     today_start: TODAY_START,
//     today_end: TODAY_END,
//   };

//   let saleNairaForecast = await getSaleForecast({ payload });

//   await saleNairaForecast.update({
//     nairaClosingBalance:
//       parseFloat(saleNairaForecast.nairaClosingBalance) -
//       parseFloat(nairaBalance),
//   });

//   payload = {
//     userId: userId,
//     forecastNumber: forecastNumber,
//     forecastPeriod: forecastPeriod,
//     currency: 'USD',
//     today_start: TODAY_START,
//     today_end: TODAY_END,
//   };

//   let saleDollarForecast = await getSaleForecast({ payload });

//   await saleDollarForecast.update({
//     dollarClosingBalance:
//       parseFloat(saleDollarForecast.dollarClosingBalance) -
//       parseFloat(dollarBalance),
//   });
// };

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
    let vendorPaymentForecastNairaClosingBalance = 0;
    let vendorPaymentForecastDollarClosingBalance = 0;
    let customerPaymentForecastNairaClosingBalance = 0;
    let customerPaymentForecastDollarClosingBalance = 0;
    

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

    // Get initial opening balance for a particular user
    let initialOpeningBalance = await getInitialBalance({ payload });

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

    let customerPayments = await fetchAllCustomerPayments({ payload });

    let vendorPayments = await fetchAllVendorPayments({ payload });

    let invoices = await fetchAllInvoice({ payload });

    let bills = await fetchAllBill({ payload });

    let purchases = await fetchAllPurchase({ payload });

    let sales = await fetchAllSale({ payload });

    let purchaseForecasts = await fetchAllPurchaseForecast({ payload });

    let saleForecasts = await fetchAllSaleForecast({ payload });

    // get invoice forecast where forecastType
    let invoiceForecasts = await fetchAllInvoiceForecast({ payload });

    let billForecasts = await fetchAllBillForecast({ payload });

    if (
      !saleForecasts.count &&
      !invoiceForecasts.count &&
      !purchaseForecasts.count &&
      !billForecasts.count &&
      !sales.count &&
      !invoices.count &&
      !purchases.count &&
      !bills.count &&
      !customerPayments.count &&
      !vendorPayments.count
    ) {
      await getCustomerPayments(
        zohoAccessToken,
        forecastNumber,
        forecastPeriod,
        rate,
        userId
      );

      await getVendorPayments(
        zohoAccessToken,
        forecastNumber,
        forecastPeriod,
        rate,
        userId
      );

      await getSalesOrder(
        options,
        forecastNumber,
        forecastPeriod,
        rate,
        userId
      );

      await getPurchaseOrder(
        options,
        forecastNumber,
        forecastPeriod,
        rate,
        userId
      );

      await getInvoice(options, forecastNumber, forecastPeriod, rate, userId);

      await getBill(options, forecastNumber, forecastPeriod, rate, userId);

      customerPayments = await fetchAllCustomerPayments({ payload });

      vendorPayments = await fetchAllVendorPayments({ payload });

      purchases = await fetchAllPurchase({ payload });

      sales = await fetchAllSale({ payload });

      invoices = await fetchAllInvoice({ payload });

      bills = await fetchAllBill({ payload });

      purchaseForecasts = await fetchAllPurchaseForecast({ payload });

      saleForecasts = await fetchAllSaleForecast({ payload });

      // get invoice forecast where forecastType
      invoiceForecasts = await fetchAllInvoiceForecast({ payload });

      billForecasts = await fetchAllBillForecast({ payload });

      // await processSales(
      //   sales,
      //   customerPayments,
      //   userId,
      //   forecastNumber,
      //   forecastPeriod
      // );

      // await processPurchases(
      //   purchases,
      //   vendorPayments,
      //   userId,
      //   forecastNumber,
      //   forecastPeriod
      // );
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
      //INFLOW TOTAL
      let invoiceForeacastClosingBalance =
        invoiceForecasts.rows[i].currency === 'NGN'
          ? invoiceForecasts.rows[i].nairaClosingBalance
          : invoiceForecasts.rows[i].dollarClosingBalance;
      let saleForecastClosingBalance =
        saleForecasts.rows[i].currency === 'NGN'
          ? saleForecasts.rows[i].nairaClosingBalance
          : saleForecasts.rows[i].dollarClosingBalance;

      // OUTFLOW TOTAL
      let billForeacastClosingBalance =
        billForecasts.rows[i].currency === 'NGN'
          ? billForecasts.rows[i].nairaClosingBalance
          : billForecasts.rows[i].dollarClosingBalance;
      let purchaseForecastClosingBalance =
        purchaseForecasts.rows[i].currency === 'NGN'
          ? purchaseForecasts.rows[i].nairaClosingBalance
          : purchaseForecasts.rows[i].dollarClosingBalance;

      let openingBalDate = moment(
        invoiceForecasts.rows[i + 2].month,
        'YYYY-MM-DD'
      );
      let opneingBalMonth = openingBalDate.format('MMMM');

      let closingBalDate = moment(invoiceForecasts.rows[i].month, 'YYYY-MM-DD');
      let closingBalMonth = closingBalDate.format('MMMM');

      // Get monthly opening and closing balances and keep them in an array
      if (invoiceForecasts.rows[i].currency === 'NGN') {
         openingInflowBalanceNairaResult = 0;
         openingOutflowBalanceNairaResult = 0;
         openingInflowBalanceNairaResult = 0;
         openingOutflowBalanceNairaResult = 0;
        // loop vendor payment and customer payment then sum up naira values
        if(i == 0){
          for (const [rowNum, inputData] of customerPayments.rows.entries()) {

            if(customerPayments.rows[rowNum].currencyCode === 'NGN'){
             
              customerPaymentForecastNairaClosingBalance = customerPaymentForecastNairaClosingBalance + parseFloat(inputData.amount)
            }
      
            if(customerPayments.rows[rowNum].currencyCode == 'USD'){
              customerPaymentForecastNairaClosingBalance += parseFloat(inputData.amount) * rate.latest;
              customerPaymentForecastDollarClosingBalance = customerPaymentForecastDollarClosingBalance + parseFloat(inputData.amount)
            }
          }
      
          for (const [rowNum, inputData] of vendorPayments.rows.entries()) {
          
            if(vendorPayments.rows[rowNum].currencyCode === 'NGN'){
             
              vendorPaymentForecastNairaClosingBalance = vendorPaymentForecastNairaClosingBalance + parseFloat(inputData.amount)
            }
      
            if(vendorPayments.rows[rowNum].currencyCode == 'USD'){
              vendorPaymentForecastNairaClosingBalance += parseFloat(inputData.amount) * rate.latest;
              vendorPaymentForecastDollarClosingBalance = vendorPaymentForecastDollarClosingBalance + parseFloat(inputData.amount)
            }
          }

          let openingInflowBalanceNaira =  parseFloat(invoiceForeacastClosingBalance) + parseFloat(saleForecastClosingBalance);
           openingInflowBalanceNairaResult = openingInflowBalanceNaira - parseFloat(customerPaymentForecastNairaClosingBalance);
          
          let openingOutflowBalanceNaira = parseFloat(purchaseForecastClosingBalance) + parseFloat(billForeacastClosingBalance);
           openingOutflowBalanceNairaResult = openingOutflowBalanceNaira - parseFloat(vendorPaymentForecastNairaClosingBalance);
         
        }else{
          let openingInflowBalanceNaira =  parseFloat(invoiceForeacastClosingBalance) + parseFloat(saleForecastClosingBalance);
           openingInflowBalanceNairaResult = openingInflowBalanceNaira;
          
          let openingOutflowBalanceNaira = parseFloat(purchaseForecastClosingBalance) + parseFloat(billForeacastClosingBalance);
           openingOutflowBalanceNairaResult = openingOutflowBalanceNaira;
        }

        nairaOpeningBalance += openingInflowBalanceNairaResult - openingOutflowBalanceNairaResult ;
       
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
        let openingInflowBalanceDollar =  parseFloat(invoiceForeacastClosingBalance) + parseFloat(saleForecastClosingBalance);
        let openingInflowBalanceDollarResult = openingInflowBalanceDollar - parseFloat(customerPaymentForecastDollarClosingBalance);
        
        let openingOutflowBalanceDollar = parseFloat(purchaseForecastClosingBalance) + parseFloat(billForeacastClosingBalance);
        let openingOutflowBalanceDollarResult = openingOutflowBalanceDollar - parseFloat(vendorPaymentForecastDollarClosingBalance);
        
        dollarOpeningBalance += openingInflowBalanceDollarResult - openingOutflowBalanceDollarResult;

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

    // get last item from salesForecast
    let dollarLastSale = saleForecasts.rows.at(-1);
    let nairaLastSale = saleForecasts.rows.at(-1);

    // get last item from purchaseForecasts
    let dollarLastPurchase = purchaseForecasts.rows.at(-1);
    let nairaLastPurchase = purchaseForecasts.rows.at(-1);


    // get last item from billForecasts
    let dollarLastBill = billForecasts.rows.at(-1);
    let nairaLastBill = billForecasts.rows.at(-2);

    lastTotalInflowDollar = parseFloat(dollarLastOpeningBalance.amount) +
    parseFloat(dollarLastInvoice.dollarClosingBalance) + 
    parseFloat(dollarLastSale.dollarClosingBalance);
    
    lastTotalOutflowDollar =  parseFloat(dollarLastBill.dollarClosingBalance) + 
    parseFloat(dollarLastPurchase.dollarClosingBalance);
    
    lastTotalInflowNaira =  parseFloat(nairaLastOpeningBalance.amount) +
    parseFloat(nairaLastInvoice.nairaClosingBalance) +
    parseFloat(nairaLastSale.nairaClosingBalance);
    
    lastTotalOutflowNaira =  parseFloat(nairaLastBill.nairaClosingBalance) + 
    parseFloat(nairaLastPurchase.nairaClosingBalance);
       
     
    let lastNairaClosingBalance =lastTotalInflowNaira - lastTotalOutflowNaira;
    let lastDollarClosingBalance =lastTotalInflowDollar - lastTotalOutflowDollar;


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
      let cashInflowFromPendingOrders;
      let totalCashInflowFromOperatingActivities;
      let cashInflowFromCustomerPayments;

      let cashOutflow;
      let cashOutflowFromPurchase;

      let endOfInvoice = (await invoices.count) + 7;
      let endOfSale = endOfInvoice + (await sales.count) + 2;
      let endOfCustomerPayment = endOfSale + (await customerPayments.count) + 2;
      // end of customer payment
      let endOfBill = (await bills.count) + endOfCustomerPayment + 4;
      let endOfPurchase = (await purchases.count) + endOfBill + 2;
      let endOfVendorPayment = (await vendorPayments.count) + endOfPurchase + 2;
      // end of vendor payment

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

      cashInflowFromInvoiced.getCell(1).value =
        'Cash inflow from invoiced sales';

      let totalNairaClosingBalance = 0.0;
      let totalDollarClosingBalance = 0.0;
      let totalNairaClosingBalanceSales = 0.0;
      let totalDollarClosingBalanceSales = 0.0;
      let totalNairaClosingBalancePurchase = 0.0;
      let totalDollarClosingBalancePurchase = 0.0;

      for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {
        if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaClosingBalance =
            totalNairaClosingBalance +
            parseFloat(inputData.nairaClosingBalance);
          cashInflowFromInvoiced.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
        } else {
          totalDollarClosingBalance =
            totalDollarClosingBalance +
            parseFloat(inputData.dollarClosingBalance);
          cashInflowFromInvoiced.getCell(rowNum + 3).value =
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

      cashInflowFromInvoiced.commit();
      // totalCashInflowFromOperatingActivities.commit();

      for (const [rowNum, inputData] of sales.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfInvoice + 2);

        inputData.shipmentDate = moment(
          inputData.shipmentDate,
          'YYYY-MM-DD'
        ).format('MMMM');

        for (i = 1; i < saleForecasts.rows.length + 1; i++) {
          month = moment(saleForecasts.rows[i - 1].month, 'YYYY-MM-DD').format(
            'MMMM'
          );

          if (
            inputData.shipmentDate === month &&
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
          rowX.getCell(2).value = inputData.salesOrderNumber;
        });

        rowX.commit();
      }
      cashInflowFromPendingOrders = sheet.getRow(endOfSale);

      cashInflowFromPendingOrders.getCell(1).value =
        'Cash inflow from pending orders';

      for (const [rowNum, inputData] of saleForecasts.rows.entries()) {
        if (saleForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaClosingBalanceSales =
            totalNairaClosingBalanceSales +
            parseFloat(inputData.nairaClosingBalance);
          cashInflowFromPendingOrders.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
        } else {
          totalDollarClosingBalanceSales =
            totalDollarClosingBalanceSales +
            parseFloat(inputData.dollarClosingBalance);
          cashInflowFromPendingOrders.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
        }

        cashInflowFromPendingOrders.commit();
      }

      for (const [rowNum, inputData] of customerPayments.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfSale + 2);

        if(customerPayments.rows[rowNum].currencyCode === 'NGN'){
          rowX.getCell(3).value = inputData.amount;
        }

        if(customerPayments.rows[rowNum].currencyCode === 'USD'){
          rowX.getCell(3).value = inputData.amount * rate.latest;
          rowX.getCell(4).value = inputData.amount;
        }

        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          rowX.getCell(1).value = inputData.customerName;
          rowX.getCell(2).value = inputData.paymentId;
        });

        rowX.commit();
      }

      cashInflowFromCustomerPayments = sheet.getRow(endOfCustomerPayment);

      cashInflowFromCustomerPayments.getCell(1).value =
      'Customers Payment';

      totalCashInflowFromOperatingActivities = sheet.getRow(endOfCustomerPayment + 1);
      cashOutflow = sheet.getRow(endOfCustomerPayment + 3);
      totalCashInflowFromOperatingActivities.getCell(1).value =
        'Total Cash Inflows from Operating Activties';
      cashOutflow.getCell(1).value = 'CASH OUTFLOWS';

      for (let i = 0; i < saleForecasts.rows.length; i++) {
        for (let j = 0; j < invoiceForecasts.rows.length; j++) {
  
          if(i <= 1){
            if (
              saleForecasts.rows[i].currency === 'NGN' &&
              invoiceForecasts.rows[i].currency === 'NGN'
            ) {
           
              totalCashInflowFromOperatingActivities.getCell(i + 3).value = parseFloat(saleForecasts.rows[i].nairaClosingBalance) +
              parseFloat(invoiceForecasts.rows[i].nairaClosingBalance) - parseFloat(customerPaymentForecastNairaClosingBalance);
            }
  
            if (
              saleForecasts.rows[i].currency === 'USD' &&
              invoiceForecasts.rows[i].currency === 'USD'
            ) {
            
              totalCashInflowFromOperatingActivities.getCell(i + 3).value =  parseFloat(saleForecasts.rows[i].dollarClosingBalance) +
              parseFloat(invoiceForecasts.rows[i].dollarClosingBalance) - parseFloat(customerPaymentForecastDollarClosingBalance);
            }
          }else{
           
            if (
              saleForecasts.rows[i].currency === 'NGN' &&
              invoiceForecasts.rows[i].currency === 'NGN'
            ) {
              totalCashInflowFromOperatingActivities.getCell(i + 3).value =
                parseFloat(saleForecasts.rows[i].nairaClosingBalance) +
                parseFloat(invoiceForecasts.rows[i].nairaClosingBalance);
            }
  
            if (
              saleForecasts.rows[i].currency === 'USD' &&
              invoiceForecasts.rows[i].currency === 'USD'
            ) {
              totalCashInflowFromOperatingActivities.getCell(i + 3).value =
                parseFloat(saleForecasts.rows[i].dollarClosingBalance) +
                parseFloat(invoiceForecasts.rows[i].dollarClosingBalance);
            }
          }
          
        }
      }
      // total invoice forecast for dollar and naira
      let saleForecastsLength = saleForecasts.rows.length;

      cashInflowFromPendingOrders.getCell(saleForecastsLength + 3).value =
        totalNairaClosingBalanceSales;

      cashInflowFromPendingOrders.getCell(saleForecastsLength + 4).value =
        totalDollarClosingBalanceSales;

      totalCashInflowFromOperatingActivities.getCell(
        saleForecastsLength + 3
      ).value = totalNairaClosingBalance + totalNairaClosingBalanceSales - parseFloat(customerPaymentForecastNairaClosingBalance);
      totalCashInflowFromOperatingActivities.getCell(
        saleForecastsLength + 4
      ).value = totalDollarClosingBalance + totalDollarClosingBalanceSales - parseFloat(customerPaymentForecastDollarClosingBalance);

      cashInflowFromPendingOrders.commit();
      totalCashInflowFromOperatingActivities.commit();

      newArray = [];
      for (const [rowNum, inputData] of bills.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfCustomerPayment + 4);

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

      cashOutflowsOnCurrentTradePayables = sheet.getRow(endOfBill);
      cashOutflowsOnCurrentTradePayables.getCell(1).value =
        'Cash Outflows on Current Trade Payables';

      let totalNairaCashOutflowsOnCurrentTradePayables = 0.0;
      let totalDollarCashOutflowsOnCurrentTradePayables = 0.0;

      for (const [rowNum, inputData] of billForecasts.rows.entries()) {
        if (billForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaCashOutflowsOnCurrentTradePayables += parseFloat(
            inputData.nairaClosingBalance
          );
          cashOutflowsOnCurrentTradePayables.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
        } else {
          totalDollarCashOutflowsOnCurrentTradePayables += parseFloat(
            inputData.dollarClosingBalance
          );
          // totalDollarCashOutflows += parseFloat(inputData.dollarClosingBalance);
          cashOutflowsOnCurrentTradePayables.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;
          // totalCashOutflows.getCell(rowNum + 3).value =
          //   inputData.dollarClosingBalance;
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

      // totalCashOutflows.getCell(billForecastsLength + 4).value =
      //   totalDollarCashOutflows;

      // totalCashOutflows.getCell(billForecastsLength + 3).value =
      //   totalNairaCashOutflows;

      cashOutflowsOnCurrentTradePayables.commit();
      // totalCashOutflows.commit();

      for (const [rowNum, inputData] of purchases.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfBill + 2);

        inputData.deliveryDate = moment(
          inputData.deliveryDate,
          'YYYY-MM-DD'
        ).format('MMMM');

        for (i = 1; i < purchaseForecasts.rows.length + 1; i++) {
          month = moment(
            purchaseForecasts.rows[i - 1].month,
            'YYYY-MM-DD'
          ).format('MMMM');

          if (
            inputData.deliveryDate === month &&
            inputData.currencyCode.toLowerCase() ===
              purchaseForecasts.rows[i - 1].currency.toLowerCase()
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
          rowX.getCell(2).value = inputData.purchaseOrderNumber;
        });

        rowX.commit();
      }

      cashOutflowFromPurchase = sheet.getRow(endOfPurchase);

      cashOutflowFromPurchase.getCell(1).value = 'Cash outflow from purchase';

      totalCashOutflows = sheet.getRow(endOfVendorPayment + 2);
      netWorkingCapital = sheet.getRow(endOfVendorPayment + 4);

      let totalNairaCashOutflows = 0.0;
      let totalDollarCashOutflows = 0.0;

      for (const [rowNum, inputData] of purchaseForecasts.rows.entries()) {
        if (purchaseForecasts.rows[rowNum].currency === 'NGN') {
          totalNairaClosingBalancePurchase =
            totalNairaClosingBalancePurchase +
            parseFloat(inputData.nairaClosingBalance);
          cashOutflowFromPurchase.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;

          totalNairaCashOutflows += parseFloat(inputData.nairaClosingBalance);

          totalCashOutflows.getCell(rowNum + 3).value =
            inputData.nairaClosingBalance;
          // totalCashInflowFromOperatingActivities.getCell(rowNum + 3).value =
          //   inputData.nairaClosingBalance;
        } else {
          totalDollarClosingBalancePurchase =
            totalDollarClosingBalancePurchase +
            parseFloat(inputData.dollarClosingBalance);
          cashOutflowFromPurchase.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;

          totalDollarCashOutflows += parseFloat(inputData.dollarClosingBalance);

          totalCashOutflows.getCell(rowNum + 3).value =
            inputData.dollarClosingBalance;

          // totalCashInflowFromOperatingActivities.getCell(rowNum + 3).value =
          //   inputData.dollarClosingBalance;
        }

        cashOutflowFromPurchase.commit();
      }

      for (let i = 0; i < purchaseForecasts.rows.length; i++) {
        for (let j = 0; j < billForecasts.rows.length; j++) {
          if(i <= 1) {
            if (
              purchaseForecasts.rows[i].currency === 'NGN' &&
              billForecasts.rows[i].currency === 'NGN'
            ) {
              totalCashOutflows.getCell(i + 3).value =
                parseFloat(purchaseForecasts.rows[i].nairaClosingBalance) +
                parseFloat(billForecasts.rows[i].nairaClosingBalance) - parseFloat(vendorPaymentForecastNairaClosingBalance);
            }

            if (
              purchaseForecasts.rows[i].currency === 'USD' &&
              billForecasts.rows[i].currency === 'USD'
            ) {
              totalCashOutflows.getCell(i + 3).value =
                parseFloat(purchaseForecasts.rows[i].dollarClosingBalance) +
                parseFloat(billForecasts.rows[i].dollarClosingBalance) - parseFloat(vendorPaymentForecastDollarClosingBalance);
            }
          }else{
            if (
              purchaseForecasts.rows[i].currency === 'NGN' &&
              billForecasts.rows[i].currency === 'NGN'
            ) {
              totalCashOutflows.getCell(i + 3).value =
                parseFloat(purchaseForecasts.rows[i].nairaClosingBalance) +
                parseFloat(billForecasts.rows[i].nairaClosingBalance);
            }

            if (
              purchaseForecasts.rows[i].currency === 'USD' &&
              billForecasts.rows[i].currency === 'USD'
            ) {
              totalCashOutflows.getCell(i + 3).value =
                parseFloat(purchaseForecasts.rows[i].dollarClosingBalance) +
                parseFloat(billForecasts.rows[i].dollarClosingBalance);
            }
          }
        }
      }

      for (const [rowNum, inputData] of vendorPayments.rows.entries()) {
        const rowX = sheet.getRow(rowNum + endOfPurchase + 2);

        if(vendorPayments.rows[rowNum].currencyCode === 'NGN'){
          rowX.getCell(3).value = inputData.amount;
        }

        if(vendorPayments.rows[rowNum].currencyCode === 'USD'){
          rowX.getCell(3).value = inputData.amount * rate.latest;
          rowX.getCell(4).value = inputData.amount;
        }

        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          rowX.getCell(1).value = inputData.vendorName;
          rowX.getCell(2).value = inputData.paymentId;
        });

        rowX.commit();
      }

      cashOutflowFromVendorPayments = sheet.getRow(endOfVendorPayment);

      cashOutflowFromVendorPayments.getCell(1).value =
      'Vendors Payment';

      totalCashOutflows.getCell(1).value = 'Total Cash Outflows';


      // total invoice forecast for dollar and naira
      let purchaseForecastsLength = purchaseForecasts.rows.length;

      cashOutflowFromPurchase.getCell(purchaseForecastsLength + 3).value =
        totalNairaClosingBalancePurchase; 

      cashOutflowFromPurchase.getCell(purchaseForecastsLength + 4).value =
        totalDollarClosingBalancePurchase;

      totalCashOutflows.getCell(purchaseForecastsLength + 3).value =
        totalNairaCashOutflowsOnCurrentTradePayables +
        totalNairaClosingBalancePurchase - parseFloat(vendorPaymentForecastNairaClosingBalance);
      totalCashOutflows.getCell(purchaseForecastsLength + 4).value =
        totalDollarCashOutflowsOnCurrentTradePayables +
        totalDollarClosingBalancePurchase - parseFloat(vendorPaymentForecastDollarClosingBalance);

      cashOutflowFromPurchase.commit();
      totalCashOutflows.commit();

      netWorkingCapital.getCell(1).value = 'Closing Balance';
      const closingBalanceRow = netWorkingCapital;

      for (const [rowNum, inputData] of closingBalances.entries()) {
        closingBalanceRow.getCell(rowNum + 3).value = inputData.amount;

        closingBalanceRow.commit();
      }

      // nairaNetWorkingCapital
      let totalNairaNetWorkingCapital =
        (parseFloat(initialOpeningBalance.openingBalance) +
        parseFloat(totalNairaClosingBalance + totalNairaClosingBalanceSales) - 
        parseFloat(customerPaymentForecastNairaClosingBalance)) -
        (parseFloat(
          totalNairaCashOutflowsOnCurrentTradePayables +
            totalNairaClosingBalancePurchase - vendorPaymentForecastNairaClosingBalance
        ));
      // dollarNetWorkingCapital
      let totalDollarNetWorkingCapital =
        (parseFloat(initialOpeningBalance.dollarOpeningBalance) +
        parseFloat(totalDollarClosingBalance + totalDollarClosingBalanceSales) - 
        parseFloat(customerPaymentForecastDollarClosingBalance)) -
        parseFloat(
          totalDollarCashOutflowsOnCurrentTradePayables +
            totalDollarClosingBalancePurchase - vendorPaymentForecastDollarClosingBalance
        );

      netWorkingCapital.getCell(closingBalances.length + 3).value =
        totalNairaNetWorkingCapital;
      netWorkingCapital.getCell(closingBalances.length + 4).value =
        totalDollarNetWorkingCapital;

      statusCode = 200;
      result = await workbook.xlsx.writeBuffer();
    } else {
      let totalInvoiceNairaCashInflow = 0.0;
      let totalInvoiceDollarCashInflow = 0.0;
      let totalSaleNairaCashInflow = 0.0;
      let totalSaleDollarCashInflow = 0.0;

      let totalBillNairaCashOutflow = 0.0;
      let totalBillDollarCashOutflow = 0.0;
      let totalPurchaseNairaCashOutflow = 0.0;
      let totalPurchaseDollarCashOutflow = 0.0;

      for (const [rowNum, inputData] of invoiceForecasts.rows.entries()) {
        if (invoiceForecasts.rows[rowNum].currency === 'NGN') {
          totalInvoiceNairaCashInflow += parseFloat(
            inputData.nairaClosingBalance
          );
        } else {
          totalInvoiceDollarCashInflow += parseFloat(
            inputData.dollarClosingBalance
          );
        }
      }

      for (const [rowNum, inputData] of saleForecasts.rows.entries()) {
        if (saleForecasts.rows[rowNum].currency === 'NGN') {
          totalSaleNairaCashInflow += parseFloat(inputData.nairaClosingBalance);
        } else {
          totalSaleDollarCashInflow += parseFloat(
            inputData.dollarClosingBalance
          );
        }
      }

      for (const [rowNum, inputData] of billForecasts.rows.entries()) {
        if (billForecasts.rows[rowNum].currency === 'NGN') {
          totalBillNairaCashOutflow += parseFloat(
            inputData.nairaClosingBalance
          );
        } else {
          totalBillDollarCashOutflow += parseFloat(
            inputData.dollarClosingBalance
          );
        }
      }

      for (const [rowNum, inputData] of purchaseForecasts.rows.entries()) {
        if (purchaseForecasts.rows[rowNum].currency === 'NGN') {
          totalPurchaseNairaCashOutflow += parseFloat(
            inputData.nairaClosingBalance
          );
        } else {
          totalPurchaseDollarCashOutflow += parseFloat(
            inputData.dollarClosingBalance
          );
        }
      }
      
      let totalNairaInflow =
        parseFloat(totalInvoiceNairaCashInflow) +
        parseFloat(totalSaleNairaCashInflow) - 
        parseFloat(customerPaymentForecastNairaClosingBalance)

      let totalDollarInflow =
        parseFloat(totalInvoiceDollarCashInflow) +
        parseFloat(totalSaleDollarCashInflow) - 
        parseFloat(customerPaymentForecastDollarClosingBalance)

      let totalNairaOutflow =
        parseFloat(totalBillNairaCashOutflow) +
        parseFloat(totalPurchaseNairaCashOutflow) -
        parseFloat(vendorPaymentForecastNairaClosingBalance)


      let totalDollarOutflow =
        parseFloat(totalBillDollarCashOutflow) +
        parseFloat(totalPurchaseDollarCashOutflow) -
        parseFloat(vendorPaymentForecastDollarClosingBalance)

      // nairaNetWorkingCapital
      let totalNairaNetWorkingCapital =
        parseFloat(initialOpeningBalance.openingBalance) +
        totalNairaInflow -
        totalNairaOutflow;
      // dollarNetWorkingCapital
      let totalDollarNetWorkingCapital =
        parseFloat(initialOpeningBalance.dollarOpeningBalance) +
        totalDollarInflow -
        totalDollarOutflow;

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
              naira: totalNairaInflow,
              dollar: totalDollarInflow,
            },
            totalCashOutflow: {
              naira: totalNairaOutflow,
              dollar: totalDollarOutflow,
            },
            closingBalance: {
              naira: totalNairaNetWorkingCapital,
              dollar: totalDollarNetWorkingCapital,
            },
          },
          invoices: invoices.rows,
          bills: bills.rows,
          sales: sales.rows,
          purchases: purchases.rows,
          customerPayments: customerPayments.rows,
          vendorPayments: vendorPayments.rows,
        },
      };
    }
  } catch (e) {
    console.log(e);
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
