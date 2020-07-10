const https = require('https');

const ENDPOINT = "https://ptax.bcb.gov.br/ptax_internet/consultaBoletim.do?method=gerarCSVFechamentoMoedaNoPeriodo&ChkMoeda=61"

const getFirstQuarterOfLastMonth = () => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  if (month === 0) {
    year--
  }

  return [
    `10/${month}/${year}`,
    `15/${month}/${year}`
  ]
}

const processCSVData = (csvString) => {
  const matches = csvString.match(/^[0-9].+\n/gm);
  const data = []

  matches.forEach(match => {
    const line = match.match(/[^(.+?);]+/g)
    const rate = line[4]
    const date = line[0].split(/(\d{2})(\d{2})(\d{4})/)
      .filter(Boolean)
      .join('/')

    data.push({
      date,
      rate
    })
  });

  return data;
}

const output = (exchangeRates) => {
  if (exchangeRates.length) {
    const { date, rate } = exchangeRates.reverse()[0];
    console.log(`Exchange rate on ${date}: R$ ${rate}`)
  } else {
    console.log(`No exchange rates found for the period.`)
  }
}

module.exports = function (args) {
  let [firstDate, lastDate] = getFirstQuarterOfLastMonth();

  if (args._.length > 0) {
    // a specific period was informed
  }

  const queryParams = `&DATAINI=${firstDate}&DATAFIM=${lastDate}`

  https.get(ENDPOINT + queryParams, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const exchangeRates = processCSVData(data)
      output(exchangeRates)
    });
  }).on("error", (err) => {
    console.log(`Error: ${err.message}`);
  });
}