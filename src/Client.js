const RequestHelper = require("./RequestHelper").RequestHelper;
const VerificationResult = require("./VerificationResult").VerificationResult;
const StatisticResult = require("./StatisticResult").StatisticResult;

class Client
{
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
    constructor(host, publicKey, privateKey, clientOptions)
    {
        this.host = host;
        this.publicKey = publicKey;
        this.privateKey = privateKey;

        // Normalize clientOptions to an object
        const opts = (typeof clientOptions === 'object' && clientOptions !== null) ? clientOptions : {};

        // Validate signal: throw error if provided but not an AbortSignal
        if (typeof opts.signal !== 'undefined' && !(opts.signal instanceof AbortSignal)) {
            throw new Error('clientOptions.signal must be an instance of AbortSignal.');
        }

        // Validate headers: log warning and ignore if invalid
        let headers = {};
        if (typeof opts.headers !== 'undefined') {
            if (typeof opts.headers === 'object' && opts.headers !== null && !Array.isArray(opts.headers)) {
                headers = { ...opts.headers };
            } else {
                console.warn('clientOptions.headers must be a plain object. Ignoring invalid value.');
            }
        }

        // Store validated client options
        this.clientOptions = {
            timeout: (typeof opts.timeout === 'number' && opts.timeout > 0) ? opts.timeout : undefined,
            signal: opts.signal,
            headers: headers,
        };
    }

    /**
     * Verifies the submission
     *
     * @param {Object} formData
     * @param {string} submitToken
     * @param {string} validationToken
     * @returns {Promise}
     */
    verifySubmission(formData, submitToken, validationToken)
    {
        let requestHelper = new RequestHelper(this.publicKey, this.privateKey);

        if (submitToken == null && '_mosparo_submitToken' in formData) {
            submitToken = formData._mosparo_submitToken;
        }

        if (validationToken == null && '_mosparo_validationToken' in formData) {
            validationToken = formData._mosparo_validationToken;
        }

        if (submitToken == null || validationToken == null) {
            throw 'Submit or validation token not available.';
        }

        formData = requestHelper.prepareFormData(formData);
        let formSignature = requestHelper.createFormDataHmacHash(formData);

        let validationSignature = requestHelper.createHmacHash(validationToken);
        let verificationSignature = requestHelper.createHmacHash(validationSignature + formSignature);

        let apiEndpoint = '/api/v1/verification/verify';
        let requestData = {
            submitToken: submitToken,
            validationSignature: validationSignature,
            formSignature: formSignature,
            formData: formData,
        };
        let requestSignature = requestHelper.createHmacHash(apiEndpoint + requestHelper.toJson(requestData));

        let options = {
            method: 'POST',
            auth: {
                username: this.publicKey,
                password: requestSignature
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            data: requestData,
        }

        return new Promise((resolve, reject) => {
            this.sendRequest(apiEndpoint, options).then((result) => {
                let isSubmittable = false;
                let isValid = false;
                let verifiedFields = [];

                let issues = [];
                if ('issues' in result) {
                    issues = result.issues;
                }

                if ('valid' in result && result.valid && 'verificationSignature' in result && result.verificationSignature === verificationSignature) {
                    isSubmittable = true;
                    isValid = result.valid;
                    verifiedFields = result.verifiedFields;
                } else if ('error' in result && result.error) {
                    issues.push({ message: result.errorMessage });
                }

                resolve(new VerificationResult(
                    isSubmittable,
                    isValid,
                    verifiedFields,
                    issues
                ));
            }).catch((error) => {
                reject(error);
            });
        });
    }

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
    validateSubmission(formData, submitToken, validationToken)
    {
        return this.verifySubmission(formData, submitToken, validationToken)
    }

    /**
     * Returns the statistic grouped by date for the given range in days
     *
     * @param {int} range ime range in seconds (will be rounded up to a full day since mosparo v1.1)
     * @param {string} startDate The start date from which the statistics are to be returned (format: YYYY-MM-DD, requires mosparo v1.1)
     * @returns {Promise}
     */
    getStatisticByDate(range, startDate)
    {
        let requestHelper = new RequestHelper(this.publicKey, this.privateKey);
        let apiEndpoint = '/api/v1/statistic/by-date';
        let queryData = {};
        if (typeof range !== 'undefined' && range > 0) {
            queryData.range = range;
        }

        if (typeof startDate !== 'undefined' && startDate !== '') {
            queryData.startDate = startDate;
        }

        let requestSignature = requestHelper.createHmacHash(apiEndpoint + requestHelper.toJson(queryData));

        let options = {
            method: 'GET',
            auth: {
                username: this.publicKey,
                password: requestSignature
            },
            headers: {
                'Accept': 'application/json'
            },
            params: queryData,
        }

        return new Promise((resolve, reject) => {
            this.sendRequest(apiEndpoint, options).then((result) => {
                if (typeof result.error !== 'undefined' && result.error) {
                    reject(result.errorMessage);
                    return;
                }

                resolve(new StatisticResult(
                    result.data.numberOfValidSubmissions,
                    result.data.numberOfSpamSubmissions,
                    result.data.numbersByDate
                ));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * Sends the request to the mosparo API
     *
     * @param {string} url
     * @param {Object} options
     * @returns {Promise}
     */
    sendRequest(url, options)
    {
        const fullUrl = this.host.replace(/\/+$/, '') + url;

        // Setup AbortController for timeout and signal handling
        const controller = new AbortController();
        let timeoutId = null;
        let timedOut = false;

        // Link external signal if provided
        if (this.clientOptions.signal) {
            if (this.clientOptions.signal.aborted) {
                controller.abort();
            } else {
                this.clientOptions.signal.addEventListener('abort', () => {
                    controller.abort();
                });
            }
        }

        // Setup timeout if specified
        if (this.clientOptions.timeout) {
            timeoutId = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, this.clientOptions.timeout);
        }

        // Build fetch options with merged headers
        // Order: clientOptions.headers -> method headers -> Authorization (always wins)
        const fetchOptions = {
            method: options.method,
            signal: controller.signal,
            headers: {
                ...this.clientOptions.headers,
                ...options.headers,
                // Convert basic auth to Authorization header (cannot be overridden)
                'Authorization': 'Basic ' + Buffer.from(
                    `${options.auth.username}:${options.auth.password}`
                ).toString('base64')
            }
        };

        // Add body for POST requests
        if (options.data) {
            fetchOptions.body = JSON.stringify(options.data);
        }

        // Build URL with query params for GET requests
        const finalUrl = options.params
            ? `${fullUrl}?${new URLSearchParams(options.params)}`
            : fullUrl;

        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        return fetch(finalUrl, fetchOptions)
            .then(response => {
                cleanup();
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data || (typeof data.result === 'undefined' && typeof data.valid === 'undefined' && typeof data.error === 'undefined')) {
                    throw new Error('Response from the API is invalid.');
                }
                return data;
            })
            .catch(error => {
                cleanup();

                // Provide specific error message for timeout
                if (timedOut) {
                    throw new Error(`Request timeout after ${this.clientOptions.timeout}ms`);
                }

                throw new Error(error.message);
            });
    }
}

module.exports = { Client };
