const Client = require('../src/Client').Client;
const RequestHelper = require("../src/RequestHelper").RequestHelper;
const FIELD_VALID = require("../src/VerificationResult").FIELD_VALID;

const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

const host = 'https://test.local';
const publicKey = 'publicKey';
const privateKey = 'privateKey';

var mock = new MockAdapter(axios);

afterEach(() => {
    mock.reset();
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

    mock.onPost(host + '/api/v1/verification/verify').reply(200, {});

    await expect(client.verifySubmission(formData)).rejects.toEqual('Response from the API is invalid.');
});

test('Get empty response from the API with tokens as argument', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
    };

    mock.onPost(host + '/api/v1/verification/verify').reply(200, {});

    await expect(client.verifySubmission(formData, 'submitToken', 'validationToken'))
        .rejects.toEqual('Response from the API is invalid.');
});

test('Handle connection error', async () => {
    let client = new Client(host, publicKey, privateKey, {});
    let formData = {
        name: 'John Example',
    };

    mock.onPost(host + '/api/v1/verification/verify').networkError();

    await expect(client.verifySubmission(formData, 'submitToken', 'validationToken'))
        .rejects.toEqual('Network Error');
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

    mock.onPost(host + '/api/v1/verification/verify').reply(200, {
        valid: true,
        verificationSignature: verificationSignature,
        verifiedFields: { 'name': FIELD_VALID },
        issues: {}
    });

    let validationResult = await client.verifySubmission(formData, submitToken, validationToken);

    let requestString = mock.history.post[0].data;
    let jsonData = JSON.parse(requestString);

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

    mock.onPost(host + '/api/v1/verification/verify').reply(200, {
        error: true,
        errorMessage: 'Validation failed',
    });

    let validationResult = await client.verifySubmission(formData, submitToken, validationToken);

    let requestString = mock.history.post[0].data;
    let jsonData = JSON.parse(requestString);

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

    mock.onGet(host + '/api/v1/statistic/by-date').reply(200, {
        result: true,
        data: {
            numberOfValidSubmissions: 0,
            numberOfSpamSubmissions: 10,
            numbersByDate: numbersByDate
        }
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

    mock.onGet(host + '/api/v1/statistic/by-date').reply(200, {
        result: true,
        data: {
            numberOfValidSubmissions: 2,
            numberOfSpamSubmissions: 5,
            numbersByDate: numbersByDate
        }
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

    mock.onGet(host + '/api/v1/statistic/by-date').reply(200, {
        result: true,
        data: {
            numberOfValidSubmissions: 2,
            numberOfSpamSubmissions: 5,
            numbersByDate: numbersByDate
        }
    });

    let statisticResult = await client.getStatisticByDate(0, '2024-01-01');

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(2);
    expect(statisticResult.getNumberOfSpamSubmissions()).toBe(5);
    expect(statisticResult.getNumbersByDate()).toStrictEqual(numbersByDate);
});

test('Get statistic receives error from API', async () => {
    let client = new Client(host, publicKey, privateKey, {});

    mock.onGet(host + '/api/v1/statistic/by-date').reply(200, {
        error: true,
        errorMessage: 'Request not valid',
    });

    await expect(client.getStatisticByDate(3600))
        .rejects.toEqual('Request not valid');
});

test('Get statistic ends in connection error', async () => {
    let client = new Client(host, publicKey, privateKey, {});

    mock.onGet(host + '/api/v1/statistic/by-date').networkError();

    await expect(client.getStatisticByDate(3600))
        .rejects.toEqual('Network Error');
});