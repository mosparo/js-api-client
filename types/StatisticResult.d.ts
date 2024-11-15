export class StatisticResult {
    /**
     * Constructs the StatisticResult object
     *
     * @param {int} numberOfValidSubmissions
     * @param {int} numberOfSpamSubmissions
     * @param {Object} numbersByDate
     */
    constructor(numberOfValidSubmissions: int, numberOfSpamSubmissions: int, numbersByDate: any);
    numberOfValidSubmissions: int;
    numberOfSpamSubmissions: int;
    numbersByDate: any;
    /**
     * Returns the total number of valid submissions
     *
     * @returns {int}
     */
    getNumberOfValidSubmissions(): int;
    /**
     * Returns the total number of spam submissions
     *
     * @returns {int}
     */
    getNumberOfSpamSubmissions(): int;
    /**
     * Returns the numbers by date
     *
     * @returns {Object}
     */
    getNumbersByDate(): any;
}
//# sourceMappingURL=StatisticResult.d.ts.map