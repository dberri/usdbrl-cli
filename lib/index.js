const https = require('https');
const subDays = require('date-fns/subDays')
const format = require('date-fns/format')

const ENDPOINT = "https://ptax.bcb.gov.br/ptax_internet/consultaBoletim.do?method=gerarCSVFechamentoMoedaNoPeriodo&ChkMoeda=61"

/**
 * Gets the 1st and 15th of the previous month
 * 
 * @return {Array}
 */
const getFirstQuarterOfLastMonth = () => {
  const today = new Date();
  let month = today.getMonth();
  let year = today.getFullYear();

  if (month === 0) {
    year--
    month = 12
  }

  return [
    `10/${month}/${year}`,
    `15/${month}/${year}`
  ]
}

/**
 * Subtracts 5 days of the given date
 * and returns it in the dd/mm/yyy format
 * 
 * @param {String} date 
 * @return {String}
 */
const subtractFiveDays = (date) => {
  const [day, month, year] = date.split('/');
  const dateObj = new Date(year, month - 1, day);
  return format(subDays(dateObj, 5), 'dd/MM/yyyy');
}

/**
 * Given a date, returns that date and a date 5 days earlier
 * This is used during the request, so an exchange rate is
 * always returned independent of holidays and weekends
 * 
 * @param {String} date 
 * @return {Array}
 */
const getGivenDateAndPreviousRange = (date) => {
  if (!date.match(/\d{2}\/\d{2}\/\d{4}/)) {
    throw new Error('Dates must be in the following format: dd/mm/yyyy');
  }

  firstDate = subtractFiveDays(date)
  lastDate = date;
  return [
    firstDate,
    lastDate
  ]
}

/**
 * Validates the period array of dates and returns it if
 * it's all good
 * 
 * @param {Array} period
 * @return {Array}
 */
const getGivenPeriod = (period) => {
  if (period.length !== 2) {
    throw new Error('Period requires exactly 2 dates');
  }

  if (!period[0].match(/\d{2}\/\d{2}\/\d{4}/) || !period[0].match(/\d{2}\/\d{2}\/\d{4}/)) {
    throw new Error('Dates must be in the following format: dd/mm/yyyy');
  }

  return period;
}

/**
 * Given a CSV string, returns an array with dates
 * and their respective exchange rate
 * 
 * @param {String} csvString 
 * @return {Array}
 */
const processCSVData = (csvString) => {
  const matches = csvString.match(/^[0-9].+\n/gm);
  if (!matches) {
    throw new Error("No rates found for given period")
  }

  const data = []

  matches.forEach(match => {
    const line = match.match(/[^(.+?);]+/g)
    const buyRate = line[4]
    const sellRate = line[5]
    const date = line[0].split(/(\d{2})(\d{2})(\d{4})/)
      .filter(Boolean)
      .join('/')

    data.push({
      date,
      buyRate,
      sellRate
    })
  });

  return data;
}

/**
 * Formats the output of the request
 * 
 * @param {Object} exchangeRates
 * @return {void}
 */
const output = (exchangeRates, pretty = true, buy = true) => {
  if (exchangeRates.length) {
    if (pretty) {
      const { date, buyRate, sellRate } = exchangeRates.reverse()[0];
      const rate = buy ? buyRate : sellRate;
      console.log(`Exchange rate on ${date}: R$ ${rate}`)
    } else {
      console.log(exchangeRates)
    }
  } else {
    console.log(`No exchange rates found for the period.`)
  }
}

module.exports = function (args) {
  const prettyOutput = !args.r;

  let [firstDate, lastDate] = getFirstQuarterOfLastMonth();

  if (args.d) {
    [firstDate, lastDate] = getGivenDateAndPreviousRange(args.d)
  }

  if (args.p) {
    [firstDate, lastDate] = getGivenPeriod(args.p)
  }

  const queryParams = `&DATAINI=${firstDate}&DATAFIM=${lastDate}`

  https.get(ENDPOINT + queryParams, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const exchangeRates = processCSVData(data)
      output(exchangeRates, prettyOutput, !args.s)
    });
  }).on("error", (err) => {
    console.error(`Error: ${err.message}`);
  });
}
