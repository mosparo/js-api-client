class StatisticResult
{
    constructor (numberOfValidSubmissions, numberOfSpamSubmissions, numbersByDate)
    {
        this.numberOfValidSubmissions = numberOfValidSubmissions;
        this.numberOfSpamSubmissions = numberOfSpamSubmissions;
        this.numbersByDate = numbersByDate;
    }

    getNumberOfValidSubmissions()
    {
        return this.numberOfValidSubmissions;
    }

    getNumberOfSpamSubmissions()
    {
        return this.numberOfSpamSubmissions;
    }

    getNumbersByDate()
    {
        return this.numbersByDate;
    }
}

module.exports = { StatisticResult };
