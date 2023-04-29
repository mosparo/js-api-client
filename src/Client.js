const RequestHelper = require("./RequestHelper").RequestHelper;
const VerificationResult = require("./VerificationResult").VerificationResult;
const StatisticResult = require("./StatisticResult").StatisticResult;

const axios = require('axios');

class Client
{
    /**
     * Constructs the client
     *
     * @param {string} host
     * @param {string} publicKey
     * @param {string} privateKey
     * @param {Object} clientOptions
     */
    constructor(host, publicKey, privateKey, clientOptions)
    {
        this.host = host;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.clientOptions = clientOptions;
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
     * @param {int} range
     * @returns {Promise}
     */
    getStatisticByDate(range)
    {
        let requestHelper = new RequestHelper(this.publicKey, this.privateKey);
        let apiEndpoint = '/api/v1/statistic/by-date';
        let queryData = {};
        if (typeof range !== 'undefined' && range > 0) {
            queryData.range = range;
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
        options = {
            ...this.clientOptions,
            ...options
        };
        options.url = this.host.replace(/\/+$/, '') + url;

        return new Promise((resolve, reject) => {
            axios.request(options).then((response) => {
                let data = response.data;
                if (!data || (typeof data.result === 'undefined' && typeof data.valid === 'undefined' && typeof data.error === 'undefined')) {
                    reject('Response from the API is invalid.');
                    return;
                }

                resolve(data);
            }).catch((error) => {
                reject(error.message);
            });
        });
    }
}

module.exports = { Client };