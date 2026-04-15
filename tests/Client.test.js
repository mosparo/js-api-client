const Client = require('../src/Client').Client;
const RequestHelper = require("../src/RequestHelper").RequestHelper;
const FIELD_VALID = require("../src/VerificationResult").FIELD_VALID;

const host = 'https://test.local';
const publicKey = 'publicKey';
const privateKey = 'privateKey';

// Mock fetch globally
global.fetch = jest.fn();

// Store request details for verification
let lastFetchCall = null;

beforeEach(() => {
    fetch.mockClear();
    lastFetchCall = null;
});

test('Verify submission without tokens', () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example'
    }

    expect(() => { client.verifySubmission(formData) }).toThrow('Submit or validation token not available.');
});

test('Verify submission without validation token', () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
        _mosparo_submitToken: 'submitToken',
    }

    expect(() => { client.verifySubmission(formData) }).toThrow('Submit or validation token not available.');
});

test('Get empty response from the API', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
        _mosparo_submitToken: 'submitToken',
        _mosparo_validationToken: 'validationToken',
    };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
    });

    await expect(client.verifySubmission(formData)).rejects.toThrow('Response from the API is invalid.');
});

test('Get empty response from the API with tokens as argument', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
    };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
    });

    await expect(client.verifySubmission(formData, 'submitToken', 'validationToken'))
        .rejects.toThrow('Response from the API is invalid.');
});

test('Handle HTTP error (non-200 status)', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
    };

    fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
    });

    await expect(client.verifySubmission(formData, 'submitToken', 'validationToken'))
        .rejects.toThrow('HTTP error! status: 500');
});

test('Handle connection error', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
    };

    fetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(client.verifySubmission(formData, 'submitToken', 'validationToken'))
        .rejects.toThrow('Network Error');
});

test('Submission is valid', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let requestHelper = new RequestHelper(publicKey, privateKey);

    let submitToken = 'submitToken';
    let validationToken = 'validationToken';
    let formData = {
        name: 'John Example',
    };

    let preparedFormData = requestHelper.prepareFormData(formData);
    let formSignature = requestHelper.createFormDataHmacHash(preparedFormData);

    let validationSignature = requestHelper.createHmacHash(validationToken);
    let verificationSignature = requestHelper.createHmacHash(validationSignature + formSignature);

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                valid: true,
                verificationSignature: verificationSignature,
                verifiedFields: { 'name': FIELD_VALID },
                issues: {}
            })
        });
    });

    let validationResult = await client.verifySubmission(formData, submitToken, validationToken);

    // Verify the request was made correctly
    let jsonData = JSON.parse(lastFetchCall.options.body);

    expect(jsonData.submitToken).toEqual(submitToken);
    expect(jsonData.validationSignature).toEqual(validationSignature);
    expect(jsonData.formSignature).toEqual(formSignature);
    expect(jsonData.formData).toStrictEqual(preparedFormData);

    expect(validationResult.isSubmittable()).toBeTruthy();
    expect(validationResult.isValid()).toBeTruthy();
    expect(validationResult.getVerifiedField('name')).toEqual(FIELD_VALID);
    expect(validationResult.hasIssues()).toBeFalsy();
});

test('Submission is invalid', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let requestHelper = new RequestHelper(publicKey, privateKey);

    let submitToken = 'submitToken';
    let validationToken = 'validationToken';
    let formData = {
        name: 'John Example',
    };

    let preparedFormData = requestHelper.prepareFormData(formData);
    let formSignature = requestHelper.createFormDataHmacHash(preparedFormData);

    let validationSignature = requestHelper.createHmacHash(validationToken);

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                error: true,
                errorMessage: 'Validation failed',
            })
        });
    });

    let validationResult = await client.verifySubmission(formData, submitToken, validationToken);

    // Verify the request was made correctly
    let jsonData = JSON.parse(lastFetchCall.options.body);

    expect(jsonData.submitToken).toEqual(submitToken);
    expect(jsonData.validationSignature).toEqual(validationSignature);
    expect(jsonData.formSignature).toEqual(formSignature);
    expect(jsonData.formData).toStrictEqual(preparedFormData);

    expect(validationResult.isSubmittable()).toBeFalsy();
    expect(validationResult.isValid()).toBeFalsy();
    expect(validationResult.hasIssues()).toBeTruthy();
    expect(validationResult.getIssues()[0].message).toEqual('Validation failed');
});

test('Use deprecated validateSubmission to verify the submission', () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example'
    }

    expect(() => { client.validateSubmission(formData) }).toThrow('Submit or validation token not available.');
});

test('Get statistic by date without range', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let numbersByDate = {
        '2021-04-29': {
            numberOfValidSubmissions: 0,
            numberOfSpamSubmissions: 10
        }
    };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            result: true,
            data: {
                numberOfValidSubmissions: 0,
                numberOfSpamSubmissions: 10,
                numbersByDate: numbersByDate
            }
        })
    });

    let statisticResult = await client.getStatisticByDate();

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(0);
    expect(statisticResult.getNumberOfSpamSubmissions()).toBe(10);
    expect(statisticResult.getNumbersByDate()).toStrictEqual(numbersByDate);
});

test('Get statistic by date with range', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let numbersByDate = {
        '2021-04-29': {
            numberOfValidSubmissions: 2,
            numberOfSpamSubmissions: 5
        }
    };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            result: true,
            data: {
                numberOfValidSubmissions: 2,
                numberOfSpamSubmissions: 5,
                numbersByDate: numbersByDate
            }
        })
    });

    let statisticResult = await client.getStatisticByDate(3600);

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(2);
    expect(statisticResult.getNumberOfSpamSubmissions()).toBe(5);
    expect(statisticResult.getNumbersByDate()).toStrictEqual(numbersByDate);
});

test('Get statistic by date with start date', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let numbersByDate = {
        '2021-04-29': {
            numberOfValidSubmissions: 2,
            numberOfSpamSubmissions: 5
        }
    };

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            result: true,
            data: {
                numberOfValidSubmissions: 2,
                numberOfSpamSubmissions: 5,
                numbersByDate: numbersByDate
            }
        })
    });

    let statisticResult = await client.getStatisticByDate(0, '2024-01-01');

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(2);
    expect(statisticResult.getNumberOfSpamSubmissions()).toBe(5);
    expect(statisticResult.getNumbersByDate()).toStrictEqual(numbersByDate);
});

test('Get statistic receives error from API', async () => {
    let client = new Client(host, publicKey, privateKey, {});

    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            error: true,
            errorMessage: 'Request not valid',
        })
    });

    await expect(client.getStatisticByDate(3600))
        .rejects.toEqual('Request not valid');
});

test('Get statistic ends in connection error', async () => {
    let client = new Client(host, publicKey, privateKey, {});

    fetch.mockRejectedValueOnce(new Error('Network Error'));

    await expect(client.getStatisticByDate(3600))
        .rejects.toThrow('Network Error');
});