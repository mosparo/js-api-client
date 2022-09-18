const StatisticResult = require('../src/StatisticResult').StatisticResult;

test('Create StatisticResult object', () => {
    let byDate = {
        '2021-04-29': { numberOfValidSubmissions: 2, numberOfSpamSubmissions: 5 },
    };

    let statisticResult = new StatisticResult(
        10,
        20,
        byDate
    );

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(10);
    expect(statisticResult.getNumberOfSpamSubmissions()).toBe(20);
    expect(statisticResult.getNumbersByDate()).toBe(byDate);
});