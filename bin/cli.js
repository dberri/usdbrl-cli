#!/usr/bin/env node

const { argv } = require('yargs')
// .usage('Usage: $0 <command> [options]')
// .command('create', 'Creates a PDF invoice')
// .describe('d', 'Description')
// .describe('q', 'Hours')
// .describe('r', 'Rate')
// .help('h')
// .alias('h', 'help')

require('../lib/index')(argv)