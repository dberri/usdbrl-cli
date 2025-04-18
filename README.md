# USD-BRL CLI

![Twitter Follow](https://img.shields.io/twitter/follow/dwberri?style=social)

USD-BRL CLI is a tool that allows developers to fetch the exchange rate of USD/BRL on the 15th 
workday of the previous month.

To file taxes in Brazil for foreign earnings, one needs to convert that income to USD using the
closed exchange rate of the payment date and then convert to BRL using the exchange rate on the 15th 
workday of the previous month.

The data comes from the oficial website for the [Brazilian Central Bank](https://www4.bcb.gov.br/pec/taxas/port/ptaxnpesq.asp?frame=1)

## Prerequisites

Before you begin, ensure you have met the following requirements:

* You have `Node.js` installed in your machine.
* You have an internet connection.

## Installing usdbrl-cli

To install usdbrl-cli, follow these steps:

using `npm`:
```
npm install -g usdbrl-cli
```

## Using usdbrl-cli

To use usdbrl-cli, follow these steps:

Get the exchange rate on the 15th workday of the past month
```sh
> usdbrl
Exchange rate on 15/06/2020: R$ 5,1877
```

Get the exchange rate on a specific date
```sh
> usdbrl -d 10/06/2020
Exchange rate on 10/06/2020: R$ 4,8888
```

Get the exchange rate for a list of specific dates
```sh
> usdbrl -l 10/06/2020,15/07/2020,20/08/2020
Exchange rate on 10/06/2020: R$ 4,8888
Exchange rate on 15/07/2020: R$ 5,3765
Exchange rate on 20/08/2020: R$ 5,4120
```

Get the exchange rate for a period
```sh
> usdbrl -r -p 05/07/2020 10/07/2020
[
  { date: '30/06/2020', buyRate: '5,4754', sellRate: '5,4754' },
  { date: '01/07/2020', buyRate: '5,3646', sellRate: '5,3646' },
  { date: '02/07/2020', buyRate: '5,3022', sellRate: '5,3022' },
  { date: '03/07/2020', buyRate: '5,3368', sellRate: '5,3368' }
]
```

## Contributing to usdbrl-cli

To contribute to usdbrl-cli, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin usdbrl-cli/<location>`
5. Create the pull request.

Alternatively see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## Contact

If you want to contact me you can reach me at <david@berribits.com>.

## License

This project uses the following license: [MIT](LICENSE.md).
