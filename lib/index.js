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
 * Validates and processes a list of dates
 * Returns an array of date pairs (each date and its 5-day previous range)
 * 
 * @param {String} dateList - comma-separated list of dates
 * @return {Object} - object with date ranges and original dates
 */
const processDateList = (dateList) => {
  if (!dateList) {
    throw new Error('Date list is required');
  }
  
  const dates = dateList.split(',').map(d => d.trim());
  
  // Validate all dates
  dates.forEach(date => {
    if (!date.match(/\d{2}\/\d{2}\/\d{4}/)) {
      throw new Error(`Invalid date format: ${date}. Dates must be in the format: dd/mm/yyyy`);
    }
  });
  
  // Return both the date ranges and the original dates (needed for filtering in raw mode)
  return {
    dateRanges: dates.map(date => getGivenDateAndPreviousRange(date)),
    originalDates: dates
  };
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
 * @param {Object} exchangeRates - The exchange rates data
 * @param {Boolean} pretty - Whether to format the output or return raw data
 * @param {Boolean} buy - Whether to show buy rates (true) or sell rates (false)
 * @param {Array} originalDates - Original dates from list (optional)
 * @return {void}
 */
const output = (exchangeRates, pretty = true, buy = true, originalDates = null) => {
  if (exchangeRates.length) {
    if (pretty) {
      // If it's an array of arrays (multiple date results), handle differently
      if (Array.isArray(exchangeRates[0])) {
        exchangeRates.forEach(rateGroup => {
          if (rateGroup.length) {
            const { date, buyRate, sellRate } = rateGroup.reverse()[0];
            const rate = buy ? buyRate : sellRate;
            console.log(`Exchange rate on ${date}: R$ ${rate}`);
          }
        });
      } else {
        // Handle single date result
        const { date, buyRate, sellRate } = exchangeRates.reverse()[0];
        const rate = buy ? buyRate : sellRate;
        console.log(`Exchange rate on ${date}: R$ ${rate}`)
      }
    } else {
      // Raw output handling
      if (Array.isArray(exchangeRates[0]) && originalDates) {
        // For raw output with a list of dates, filter to only show the requested dates
        const filteredResults = [];
        
        exchangeRates.forEach((rateGroup, index) => {
          if (rateGroup.length) {
            // Find the exact date match or closest date
            const targetDate = originalDates[index];
            let matchingRate = rateGroup.find(rate => rate.date === targetDate);
            
            // If no exact match, take the most recent one (which would be the last in the array)
            if (!matchingRate) {
              matchingRate = rateGroup.reverse()[0];
            }
            
            // Format to match expected output format from project context
            filteredResults.push({
              date: matchingRate.date,
              rate: buy ? matchingRate.buyRate : matchingRate.sellRate
            });
          }
        });
        
        console.log(filteredResults);
      } else {
        // For single period raw output, format to match expected output format
        const formattedRates = exchangeRates.map(rate => ({
          date: rate.date,
          rate: buy ? rate.buyRate : rate.sellRate
        }));
        console.log(formattedRates);
      }
    }
  } else {
    console.log(`No exchange rates found for the period.`)
  }
}

/**
 * Fetches exchange rates for a given date range
 * 
 * @param {String} firstDate 
 * @param {String} lastDate 
 * @param {Function} callback 
 * @return {void}
 */
const fetchExchangeRates = (firstDate, lastDate, callback) => {
  const queryParams = `&DATAINI=${firstDate}&DATAFIM=${lastDate}`;
  
  https.get(ENDPOINT + queryParams, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      try {
        const exchangeRates = processCSVData(data);
        callback(null, exchangeRates);
      } catch (err) {
        callback(err);
      }
    });
  }).on("error", (err) => {
    callback(err);
  });
}

module.exports = function (args) {
  const prettyOutput = !args.r;

  // Handle list of dates
  if (args.l) {
    try {
      const { dateRanges, originalDates } = processDateList(args.l);
      const results = [];
      let completedRequests = 0;
      
      // Process each date range
      dateRanges.forEach((dateRange, index) => {
        const [firstDate, lastDate] = dateRange;
        
        fetchExchangeRates(firstDate, lastDate, (err, rates) => {
          completedRequests++;
          
          if (err) {
            console.error(`Error fetching rates for ${lastDate}: ${err.message}`);
          } else {
            results.push(rates);
          }
          
          // When all requests are completed, output results
          if (completedRequests === dateRanges.length) {
            output(results, prettyOutput, !args.s, originalDates);
          }
        });
      });
      
      return; // Exit to avoid running the other code paths
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return;
    }
  }

  let [firstDate, lastDate] = getFirstQuarterOfLastMonth();

  if (args.d) {
    [firstDate, lastDate] = getGivenDateAndPreviousRange(args.d)
  }

  if (args.p) {
    [firstDate, lastDate] = getGivenPeriod(args.p)
  }

  fetchExchangeRates(firstDate, lastDate, (err, exchangeRates) => {
    if (err) {
      console.error(`Error: ${err.message}`);
    } else {
      output(exchangeRates, prettyOutput, !args.s);
    }
  });
}
