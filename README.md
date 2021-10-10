# debtcounter

This web app helps users keep track of their overall Debt by displaying the amount in large font on their screen. The hopes of this app is to remind the user that they have debts. Sometimes things get in the way of people seeing how much they owe and can lead them to financial ruin.

## Features

- view debts
- add new debts
- pay debts
- change currency
- edit debts
- delete debts
- view all conversions of total debt in other countries
- dark mode

## Technology

- Built using React.js utilizing the browsers localStorage for data persistence.
- Uses SASS for precompiling CSS
- Pulls data from https://exchangeratesapi.io
  - Display rates from
  - Data will then be converted to the selected currency
- Github Pages

## Things I learned

- Initially this project was deployed in Heroku, however the free provided service sleeps when not in used. Loading this application after causes a delay for the user. Found that Github Pages does not have this limitation.
- How to use Exchagerates API
- How to use browser localstorage
- Exchange Rate API uses now uses a private key. Need a server to hide key from public.
- react-spring for animations
- As of now, currency conversion is not available online.

Check it out here:
https://jrescalona96.github.io/debtcounter/
