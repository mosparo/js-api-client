class StatisticResult
{
    /**
     * Constructs the StatisticResult object
     *
     * @param {int} numberOfValidSubmissions
     * @param {int} numberOfSpamSubmissions
     * @param {Object} numbersByDate
     */
    constructor (numberOfValidSubmissions, numberOfSpamSubmissions, numbersByDate)
    {
        this.numberOfValidSubmissions = numberOfValidSubmissions;
        this.numberOfSpamSubmissions = numberOfSpamSubmissions;
        this.numbersByDate = numbersByDate;
    }

    /**
     * Returns the total number of valid submissions
     *
     * @returns {int}
     */
    getNumberOfValidSubmissions()
    {
        return this.numberOfValidSubmissions;
    }

    /**
     * Returns the total number of spam submissions
     *
     * @returns {int}
     */
    getNumberOfSpamSubmissions()
    {
        return this.numberOfSpamSubmissions;
    }

    /**
     * Returns the numbers by date
     *
     * @returns {Object}
     */
    getNumbersByDate()
    {
        return this.numbersByDate;
    }
}

module.exports = { StatisticResult };
