export class Client {
    /**
     * Constructs the client
     *
     * @param {string} host
     * @param {string} publicKey
     * @param {string} privateKey
     * @param {Object} [clientOptions] Optional client configuration
     * @param {number} [clientOptions.timeout] Request timeout in milliseconds
     * @param {AbortSignal} [clientOptions.signal] AbortSignal for request cancellation
     * @param {Object} [clientOptions.headers] Additional headers to include in all requests
     */
    constructor(host: string, publicKey: string, privateKey: string, clientOptions?: {
        timeout?: number | undefined;
        signal?: AbortSignal | undefined;
        headers?: Object | undefined;
    });
    host: string;
    publicKey: string;
    privateKey: string;
    clientOptions: {
        timeout: number | undefined;
        signal: AbortSignal | undefined;
        headers: {};
    };
    /**
     * Verifies the submission
     *
     * @param {Object} formData
     * @param {string} submitToken
     * @param {string} validationToken
     * @returns {Promise}
     */
    verifySubmission(formData: Object, submitToken: string, validationToken: string): Promise<any>;
    /**
     * Verifies the submission
     *
     * @param {Object} formData
     * @param {string} submitToken
     * @param {string} validationToken
     * @returns {Promise}
     *
     * @deprecated 1.0.0 Use verifySubmission() instead since the process is to verify the data, not to validate
     */
    validateSubmission(formData: Object, submitToken: string, validationToken: string): Promise<any>;
    /**
     * Returns the statistic grouped by date for the given range in days
     *
     * @param {int} range ime range in seconds (will be rounded up to a full day since mosparo v1.1)
     * @param {string} startDate The start date from which the statistics are to be returned (format: YYYY-MM-DD, requires mosparo v1.1)
     * @returns {Promise}
     */
    getStatisticByDate(range: int, startDate: string): Promise<any>;
    /**
     * Sends the request to the mosparo API
     *
     * @param {string} url
     * @param {Object} options
     * @returns {Promise}
     */
    sendRequest(url: string, options: Object): Promise<any>;
}
//# sourceMappingURL=Client.d.ts.map