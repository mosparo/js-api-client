const RequestHelper = require('../src/RequestHelper').RequestHelper;

const publicKey = 'publicKey';
const privateKey = 'privateKey';

test('Create HMAC hash', () => {
    const requestHelper = new RequestHelper(publicKey, privateKey);

    let data = 'testData';

    expect(requestHelper.createHmacHash(data)).toBe('0646b5f2e09db205a8b3eb0e7429645561a1b9fdff1fcdb1fed9cd585108d850');
});

test('Prepare form data', () => {
    const requestHelper = new RequestHelper(publicKey, privateKey);

    let data = {
        name: 'Test Tester',
        address: {
            street: 'Teststreet',
            number: 123
        },
        'email[]': [
            'test@example.com'
        ],
    };
    let expectedData = {
        address: {
            street: 'cc0bdb0377d3ba87046028784e8a4319972a7c9df31c645e80e14e8dd8735b6b',
            number: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
        },
        name: '153590093b8c278bb7e1fef026d8a59b9ba02701d1e0a66beac0938476f2a812',
        email: [
            '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
        ],
    }

    expect(requestHelper.prepareFormData(data)).toStrictEqual(expectedData);
});

test('Cleanup form data', () => {
    const requestHelper = new RequestHelper(publicKey, privateKey);

    let data = {
        _mosparo_submitToken: 'submitToken',
        _mosparo_validationToken: 'validationToken',
        name: 'Test Tester',
        address: {
            street: 'Teststreet\r\nTest\r\nStreet',
            number: 123
        },
        valid: false,
        'email[]': [
            'test@example.com'
        ]
    };
    let expectedData = {
        address: {
            number: 123,
            street: 'Teststreet\nTest\nStreet'
        },
        email: [
            'test@example.com'
        ],
        name: 'Test Tester',
        valid: false
    };

    expect(requestHelper.cleanupFormData(data)).toStrictEqual(expectedData);
});

test('Convert to json', () => {
    const requestHelper = new RequestHelper(publicKey, privateKey);

    let data = {
        name: 'Test Tester',
        address: {
            street: 'Teststreet',
            number: 123
        },
        valid: false,
        data: []
    };
    let expectedJson = '{"name":"Test Tester","address":{"street":"Teststreet","number":123},"valid":false,"data":{}}';

    expect(requestHelper.toJson(data)).toBe(expectedJson);
});

test('Create form data HMAC hash', () => {
    const requestHelper = new RequestHelper(publicKey, privateKey);

    let data = {
        name: 'Test Tester',
        address: {
            street: 'Teststreet',
            number: 123
        },
        valid: false,
        data: []
    };

    expect(requestHelper.createFormDataHmacHash(data)).toBe('408f7cfd222dcf2369c8c1655df2f8de489858e23d9e100233a5b09e748fd360');
});