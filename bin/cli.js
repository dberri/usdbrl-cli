#!/usr/bin/env node

const { argv } = require('yargs')
  .usage('Usage: $0 [options]')
  .alias('s', 'sell')
  .describe('sell', 'returns the exchange rate for the selling operation (default is buy)')
  .describe('date', 'returns the exchange rate on a given <date> (dd/mm/yyyy)')
  .alias('d', 'date')
  .describe('raw', 'returns raw data')
  .alias('r', 'raw')
  .describe('period', 'accepts two dates and returns rates in between')
  .alias('p', 'period')
  .nargs('period', 2)
  .describe('list', 'accepts a comma-separated list of dates (dd/mm/yyyy) and returns rates for each date')
  .alias('l', 'list')
  .help('h')
  .alias('h', 'help')

require('../lib/index')(argv)
