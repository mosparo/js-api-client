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

// ============================================================================
// clientOptions: timeout tests
// ============================================================================

test('Request times out when timeout is exceeded', async () => {
    let client = new Client(host, publicKey, privateKey, { timeout: 50 });

    // Mock fetch to simulate a slow response that respects abort signal
    fetch.mockImplementationOnce((url, options) => {
        return new Promise((resolve, reject) => {
            const onAbort = () => {
                const error = new Error('The operation was aborted.');
                error.name = 'AbortError';
                reject(error);
            };
            if (options.signal.aborted) {
                onAbort();
                return;
            }
            options.signal.addEventListener('abort', onAbort);
        });
    });

    await expect(client.getStatisticByDate(3600))
        .rejects.toThrow('Request timeout after 50ms');
});

test('Successful request clears timeout', async () => {
    let client = new Client(host, publicKey, privateKey, { timeout: 5000 });

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                result: true,
                data: {
                    numberOfValidSubmissions: 1,
                    numberOfSpamSubmissions: 2,
                    numbersByDate: {}
                }
            })
        });
    });

    let statisticResult = await client.getStatisticByDate();

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(1);
    // Verify signal was passed to fetch
    expect(lastFetchCall.options.signal).toBeInstanceOf(AbortSignal);
});

test('Invalid timeout value is ignored (negative)', () => {
    let client = new Client(host, publicKey, privateKey, { timeout: -100 });

    expect(client.clientOptions.timeout).toBeUndefined();
});

test('Invalid timeout value is ignored (zero)', () => {
    let client = new Client(host, publicKey, privateKey, { timeout: 0 });

    expect(client.clientOptions.timeout).toBeUndefined();
});

test('Invalid timeout value is ignored (non-number)', () => {
    let client = new Client(host, publicKey, privateKey, { timeout: 'not-a-number' });

    expect(client.clientOptions.timeout).toBeUndefined();
});

// ============================================================================
// clientOptions: signal tests
// ============================================================================

test('Request is aborted when external signal is aborted', async () => {
    const controller = new AbortController();
    let client = new Client(host, publicKey, privateKey, { signal: controller.signal });

    // Mock fetch to simulate a slow response that respects abort signal
    fetch.mockImplementationOnce((url, options) => {
        return new Promise((resolve, reject) => {
            const onAbort = () => {
                const error = new Error('The operation was aborted.');
                error.name = 'AbortError';
                reject(error);
            };
            if (options.signal.aborted) {
                onAbort();
                return;
            }
            options.signal.addEventListener('abort', onAbort);
        });
    });

    // Abort after a short delay
    setTimeout(() => controller.abort(), 10);

    await expect(client.getStatisticByDate(3600))
        .rejects.toThrow('The operation was aborted.');
});

test('Request is aborted immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    let client = new Client(host, publicKey, privateKey, { signal: controller.signal });

    fetch.mockImplementationOnce((url, options) => {
        return new Promise((resolve, reject) => {
            if (options.signal.aborted) {
                const error = new Error('The operation was aborted.');
                error.name = 'AbortError';
                reject(error);
                return;
            }
            // Should not reach here
            resolve({ ok: true, json: async () => ({ valid: true }) });
        });
    });

    await expect(client.getStatisticByDate(3600))
        .rejects.toThrow('The operation was aborted.');
});

test('Invalid signal throws error', () => {
    expect(() => {
        new Client(host, publicKey, privateKey, { signal: 'not-a-signal' });
    }).toThrow('clientOptions.signal must be an instance of AbortSignal.');
});

test('Invalid signal object throws error', () => {
    expect(() => {
        new Client(host, publicKey, privateKey, { signal: { aborted: false } });
    }).toThrow('clientOptions.signal must be an instance of AbortSignal.');
});

// ============================================================================
// clientOptions: headers tests
// ============================================================================

test('Custom headers are included in requests', async () => {
    let client = new Client(host, publicKey, privateKey, {
        headers: {
            'X-Custom-Header': 'custom-value',
            'X-API-Version': '2.0'
        }
    });

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                result: true,
                data: {
                    numberOfValidSubmissions: 0,
                    numberOfSpamSubmissions: 0,
                    numbersByDate: {}
                }
            })
        });
    });

    await client.getStatisticByDate();

    expect(lastFetchCall.options.headers['X-Custom-Header']).toBe('custom-value');
    expect(lastFetchCall.options.headers['X-API-Version']).toBe('2.0');
    // Standard headers should still be present
    expect(lastFetchCall.options.headers['Accept']).toBe('application/json');
});

test('Custom headers merge with method headers', async () => {
    let client = new Client(host, publicKey, privateKey, {
        headers: {
            'X-Custom-Header': 'custom-value'
        }
    });

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({ valid: true, verificationSignature: 'sig', verifiedFields: {}, issues: {} })
        });
    });

    await client.verifySubmission({ name: 'Test' }, 'submitToken', 'validationToken');

    expect(lastFetchCall.options.headers['X-Custom-Header']).toBe('custom-value');
    expect(lastFetchCall.options.headers['Accept']).toBe('application/json');
    expect(lastFetchCall.options.headers['Content-Type']).toBe('application/json');
});

test('Authorization header cannot be overridden by custom headers', async () => {
    let client = new Client(host, publicKey, privateKey, {
        headers: {
            'Authorization': 'Bearer malicious-token'
        }
    });

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                result: true,
                data: {
                    numberOfValidSubmissions: 0,
                    numberOfSpamSubmissions: 0,
                    numbersByDate: {}
                }
            })
        });
    });

    await client.getStatisticByDate();

    // Authorization should be set by the client, not overridden
    expect(lastFetchCall.options.headers['Authorization']).toMatch(/^Basic /);
    expect(lastFetchCall.options.headers['Authorization']).not.toBe('Bearer malicious-token');
});

test('Invalid headers (non-object) are logged and ignored', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let client = new Client(host, publicKey, privateKey, { headers: 'not-an-object' });

    expect(client.clientOptions.headers).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith(
        'clientOptions.headers must be a plain object. Ignoring invalid value.'
    );

    consoleWarnSpy.mockRestore();
});

test('Invalid headers (array) are logged and ignored', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let client = new Client(host, publicKey, privateKey, { headers: ['header1', 'header2'] });

    expect(client.clientOptions.headers).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith(
        'clientOptions.headers must be a plain object. Ignoring invalid value.'
    );

    consoleWarnSpy.mockRestore();
});

test('Invalid headers (null) are logged and ignored', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    let client = new Client(host, publicKey, privateKey, { headers: null });

    expect(client.clientOptions.headers).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith(
        'clientOptions.headers must be a plain object. Ignoring invalid value.'
    );

    consoleWarnSpy.mockRestore();
});

// ============================================================================
// clientOptions: general tests
// ============================================================================

test('Client works without clientOptions argument', () => {
    let client = new Client(host, publicKey, privateKey);

    expect(client.clientOptions.timeout).toBeUndefined();
    expect(client.clientOptions.signal).toBeUndefined();
    expect(client.clientOptions.headers).toEqual({});
});

test('Client works with null clientOptions', () => {
    let client = new Client(host, publicKey, privateKey, null);

    expect(client.clientOptions.timeout).toBeUndefined();
    expect(client.clientOptions.signal).toBeUndefined();
    expect(client.clientOptions.headers).toEqual({});
});

test('Client works with all clientOptions combined', async () => {
    const controller = new AbortController();
    let client = new Client(host, publicKey, privateKey, {
        timeout: 5000,
        signal: controller.signal,
        headers: { 'X-Custom': 'value' }
    });

    fetch.mockImplementationOnce((url, options) => {
        lastFetchCall = { url, options };
        return Promise.resolve({
            ok: true,
            json: async () => ({
                result: true,
                data: {
                    numberOfValidSubmissions: 5,
                    numberOfSpamSubmissions: 3,
                    numbersByDate: {}
                }
            })
        });
    });

    let statisticResult = await client.getStatisticByDate();

    expect(statisticResult.getNumberOfValidSubmissions()).toBe(5);
    expect(lastFetchCall.options.headers['X-Custom']).toBe('value');
    expect(lastFetchCall.options.signal).toBeInstanceOf(AbortSignal);
});