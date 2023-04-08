# DCF modeler

DCF modeler provides a quick financial overview for a company along with an intrinsic value calculator.
This project requires API keys from the following free services:

1. Alpha Vantage API
2. Google Custom Search JSON API
3. Google Search Engine ID

## How to set up the API keys in the code

Follow the steps below to set up the required API keys in your JavaScript code.

### 1. Obtain API keys

- Sign up for an Alpha Vantage API key [here](https://www.alphavantage.co/support/#api-key).
- Obtain a Google Custom Search JSON API key and a Google Search Engine ID by following the instructions [here](https://developers.google.com/custom-search/v1/introduction).

### 2. Replace placeholders in the code

Once you have the API keys and the Google Search Engine ID, open the JavaScript file and replace the placeholders:

```javascript
const apiKey = 'REPLACE WITH YOUR API KEY HERE'; // Alpha Vantage API key
const newsapi = 'REPLACE WITH YOUR API KEY HERE'; // Google Custom Search JSON API key
const searchEngineId = 'REPLACE WITH YOUR GOOGLE SEARCH ENGINE ID'; // Google Search Engine ID
```

Double click index.html to run the web app. Type your ticker in the search bar and hit enter.
The Alpha Vantage API has a limitation on its search query returns. It'll allow about one search per minute.
If you get a web error that says no stock data found, chances are your searching too fast.
This app is unfinished and probably buggy, but totally free.
