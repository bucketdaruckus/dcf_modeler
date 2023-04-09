const apiKey = 'REPLACE WITH YOUR API KEY'; //alphavantage api
const newsapi = 'REPLACE WITH YOUR API KEY'; //custom search json api
const searchEngineId = 'REPLACE WITH YOUR SEARCH ENGINE KEY'; //google search engine

let revenueCogsChart;
let cashFlowChart;

function calculateDCF(fcf, growthRate, terminalGrowth, discountRate, projectionYears) {
  let presentValueSum = 0;

  for (let i = 1; i <= projectionYears; i++) {
    const futureFCF = fcf * Math.pow(1 + growthRate, i);
    const presentValue = futureFCF / Math.pow(1 + discountRate, i);
    presentValueSum += presentValue;
  }

  const terminalValue = (fcf * Math.pow(1 + growthRate, projectionYears) * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);

  const intrinsicValue = presentValueSum + presentTerminalValue;
  return intrinsicValue;
}

const dcfForm = document.getElementById('dcf-form');
const intrinsicValueElement = document.getElementById('intrinsic-value');

dcfForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fcf = parseFloat(document.getElementById('fcf').value);
  const growthRate = parseFloat(document.getElementById('growth-rate').value) / 100;
  const terminalGrowth = parseFloat(document.getElementById('terminal-growth').value) / 100;
  const discountRate = parseFloat(document.getElementById('discount-rate').value) / 100;
  const projectionYears = parseInt(document.getElementById('projection-years').value);

  const intrinsicValue = calculateDCF(fcf, growthRate, terminalGrowth, discountRate, projectionYears);
  const formattedIntrinsicValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(intrinsicValue);
  intrinsicValueElement.innerText = formattedIntrinsicValue;
});

async function fetchNews(query) {
  const enhancedQuery = `${query} stock news article`;
  const apiUrl = `https://www.googleapis.com/customsearch/v1?cx=${searchEngineId}&key=${newsapi}&q=${enhancedQuery}&tbm=nws`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items) {
      displayNews(data.items);
    } else {
      console.log('No news found.');
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}

function displayNews(newsItems) {
  document.getElementById('news-container').innerHTML = '';
  const newsContainer = document.getElementById('news-container');
  const limitedNewsItems = newsItems.slice(0, 5);
  limitedNewsItems.forEach((item) => {
    const newsLink = document.createElement('a');
    newsLink.href = item.link;
    newsLink.textContent = item.title;
    newsLink.target = '_blank';
    const newsElement = document.createElement('li');
    newsElement.appendChild(newsLink);
    newsContainer.appendChild(newsElement);
  });
}

function createRevenueCogsPieChart(revenue, cogs) {
  const ctx = document.getElementById('revenue-cogs-chart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Revenue', 'COGS'],
      datasets: [{
        data: [revenue, cogs],
        backgroundColor: ['#4caf50', '#f44336'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
    },
  });
  return chart;
}

function createPieChart2(cashFlowFromOperations, capitalExpenditure) {
  const ctx2 = document.getElementById('cash-flow-chart').getContext('2d');
  const data2 = {
    labels: ['Cash From Ops', 'CapEx'],
    datasets: [
      {
        data: [cashFlowFromOperations, capitalExpenditure],
        backgroundColor: ['#4caf50', '#f44336'],
      },
    ],
  };

  const options2 = {
    maintainAspectRatio: true,
    tooltips: {
      backgroundColor: 'rgb(255,255,255)',
      bodyFontColor: '#858796',
      titleMarginBottom: 10,
      titleFontColor: '#6e707e',
      titleFontSize: 14,
      borderColor: '#dddfeb',
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      caretPadding: 10,
    },
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        fontColor: '#858796',
        usePointStyle: true,
      },
    },
    cutoutPercentage: 50,
  };

  return new Chart(ctx2, {
    type: 'doughnut',
    data: data2,
    options: options2,
  });
}

async function fetchLatestStockPrice(stockTicker) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockTicker}&apikey=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stock price data');
    const data = await response.json();
    return parseFloat(data['Global Quote']['05. price']);
  } catch (error) {
    console.error('Error fetching stock price data:', error);
    return null;
  }
}

async function fetchLatestCashFlowStatement(stockTicker) {
  const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${stockTicker}&apikey=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch cash flow statement data');
    const data = await response.json();
    return data['quarterlyReports'][0];
  } catch (error) {
    console.error('Error fetching cash flow statement data:', error);
    return null;
  }
}

async function fetchStockData(stockTicker) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${stockTicker}&apikey=${apiKey}`;
  const incomeStatementUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${stockTicker}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const incomeStatementResponse = await fetch(incomeStatementUrl);
    if (!response.ok || !incomeStatementResponse.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    const incomeStatementData = await incomeStatementResponse.json();
    const latestAnnualReport = incomeStatementData.annualReports[0];
    const latestQuarterlyReport = incomeStatementData.quarterlyReports[0];
    const latestCashFlowStatement = await fetchLatestCashFlowStatement(stockTicker);

    const latestReport =
      new Date(latestAnnualReport['fiscalDateEnding']) > new Date(latestQuarterlyReport['fiscalDateEnding'])
        ? latestAnnualReport
        : latestQuarterlyReport;

    return {
      lastClosingPrice: await fetchLatestStockPrice(stockTicker),
      sharesOutstanding: parseInt(data['SharesOutstanding']),
      marketCap: parseInt(data['MarketCapitalization']),
      fiscalDateEnding: latestReport['fiscalDateEnding'],
      revenue: parseFloat(latestReport['totalRevenue']),
      costOfGoodsSold: parseFloat(latestReport['costOfRevenue']),
      grossMargin: parseFloat(latestReport['totalRevenue']) - parseFloat(latestReport['costOfRevenue']),
      grossMarginPercentage: ((parseFloat(latestReport['totalRevenue']) - parseFloat(latestReport['costOfRevenue'])) / parseFloat(latestReport['totalRevenue'])) * 100,
      netIncome: parseFloat(latestReport['netIncome']),
      cashFlowFromOperations: parseFloat(latestCashFlowStatement['operatingCashflow']),
      capitalExpenditure: parseFloat(latestCashFlowStatement['capitalExpenditures']),
      freeCashFlow: parseFloat(latestCashFlowStatement['operatingCashflow']) - parseFloat(latestCashFlowStatement['capitalExpenditures']),
      companyName: data['Name'],
      companyDescription: data['Description'],
    };
            

  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

document.getElementById('search-input').addEventListener('keydown', async function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const searchInput = document.getElementById('search-input');
    const stockTicker = searchInput.value.trim().toUpperCase();

    if (stockTicker) {
      fetchNews(stockTicker);
      const stockData = await fetchStockData(stockTicker);

      if (stockData) {
        document.getElementById('stock-ticker').textContent = stockTicker;
        document.getElementById('company-name').textContent = stockData.companyName;
        document.getElementById('company-description').textContent = stockData.companyDescription;
        document.getElementById('last-closing-price').textContent = stockData.lastClosingPrice.toFixed(2);
        document.getElementById('shares-outstanding').textContent = stockData.sharesOutstanding.toLocaleString();
        document.getElementById('market-cap').textContent = stockData.marketCap.toLocaleString();
        document.getElementById('fiscal-date-ending').textContent = stockData.fiscalDateEnding;
        document.getElementById('latest-revenue').textContent = stockData.revenue.toLocaleString();
        document.getElementById('cost-of-goods-sold').textContent = stockData.costOfGoodsSold.toLocaleString();
        document.getElementById('gross-margin').textContent = stockData.grossMargin.toLocaleString();
        document.getElementById('gross-margin-percentage').textContent = stockData.grossMarginPercentage.toFixed(2);
        document.getElementById('net-income').textContent = stockData.netIncome.toLocaleString();
        document.getElementById('cash-flow-from-operations').textContent = stockData.cashFlowFromOperations.toLocaleString();
        document.getElementById('capital-expenditure').textContent = stockData.capitalExpenditure.toLocaleString();
        document.getElementById('free-cash-flow').textContent = stockData.freeCashFlow.toLocaleString();
        document.getElementById('cost-of-goods-sold').textContent = stockData.costOfGoodsSold.toLocaleString();
        document.getElementById('fcf').value = stockData.freeCashFlow;

        document.getElementById('results-section').style.display = 'block';
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

        if (revenueCogsChart) revenueCogsChart.destroy();
        revenueCogsChart = createRevenueCogsPieChart(stockData.revenue, stockData.costOfGoodsSold);
        if (cashFlowChart) cashFlowChart.destroy();
        cashFlowChart = createPieChart2(stockData.cashFlowFromOperations, stockData.capitalExpenditure);

      } else {
        alert('Failed to fetch stock data. Please try again.');
      }
    }
  }
});