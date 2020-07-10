#!/usr/bin/env node

const { argv } = require('yargs')
  .usage('Usage: $0 [options]')
  .describe('date', 'returns the exchange rate on a given <date> (dd/mm/yyyy)')
  .alias('d', 'date')
  .describe('raw', 'returns raw data')
  .alias('r', 'raw')
  .describe('period', 'accepts two dates and returns rates in between')
  .alias('p', 'period')
  .nargs('period', 2)
  .help('h')
  .alias('h', 'help')

require('../lib/index')(argv)