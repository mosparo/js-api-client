&nbsp;
<p align="center">
    <img src="https://github.com/mosparo/mosparo/blob/master/assets/images/mosparo-logo.svg?raw=true" alt="mosparo logo contains a bird with the name Mo and the mosparo text"/>
</p>

<h1 align="center">
    JS API Client
</h1>
<p align="center">
    This library offers the API client to communicate with mosparo to verify a submission.
</p>

-----

## Description
With this JavaScript library you can connect to a mosparo installation and verify the submitted data.

## Installation
Install this library by using npm:

```text
npm install @mosparo/api-client
```

## Usage
1. Create a project in your mosparo installation
2. Include the mosparo script in your form
```html
<div id="mosparo-box"></div>

<script src="https://[URL]/build/mosparo-frontend.js" defer></script>
<script>
    var m;
    window.onload = function(){
        m = new mosparo('mosparo-box', 'https://[URL]', '[UUID]', '[PUBLIC_KEY]', {loadCssResource: true});
    };
</script>
```
3. Include the library in your project
```text
const mosparo = require('@mosparo/api-client');
```
4. After the form was submitted, verify the data before processing it
```js
let client = new mosparo.Client(host, publicKey, privateKey, {});

mosparoSubmitToken = formData._mosparo_submitToken;
mosparoValidationToken = formData._mosparo_validationToken;

client.verifySubmission(formData, mosparoSubmitToken, mosparoValidationToken).then((verificationResult) => {
    if (verificationResult.isSubmittable()) {
        // Send the email or process the data
    } else {
        // Show error message
    }
});
```

## API Documentation

### Client

#### Client initialization
Create a new client object to use the API client.
```js
/**
 * @param string url URL of the mosparo installation
 * @param string publicKey Public key of the mosparo project
 * @param string privateKey Private key of the mosparo project 
 * @param array args Arguments for the axios request
 */
let client = new Client(url, publicKey, privateKey, args);
```

#### Verify form data
To verify the form data, call `verifySubmission` with the form data in an array and the submit and validation token, which mosparo generated on the form initialization and the form data validation. The method will return a new Promise object that is resolved with the `VerificationResult` object.
```js
/**
 * @param array formData Array with the form values. All not-processed fields by mosparo (hidden, checkbox, 
 *                       radio and so on) have to be removed from this array
 * @param string mosparoSubmitToken Submit token which mosparo returned on the form initialization
 * @param string mosparoValidationToken Validation token which mosparo returned after the form was validated
 * @return Promise Returns a Promise object that is resolved with a VerificationResult object
 */
client.verifySubmission(formData, mosparoSubmitToken, mosparoValidationToken).then((validationResult) => {
    if (verificationResult.isSubmittable()) {
        // Do your stuff, e.g. sending emails...
    }
});
```

#### Request the statistical data
mosparo also has an API method to get the statistical data for a project. You can use the method `getStatisticByDate` to get the statistical data. You can specify the range in seconds or a start date from which mosparo should return the statistical data. This method will return a `StatisticResult` object.
```js
/**
 * @param int range = 0 The range in seconds for which mosparo should return the statistical data (will be rounded up to a full day since mosparo v1.1)
 * @param string startDate = null The Start date from which on mosparo should return the statistical data (requires mosparo v1.1)
 * @return Promise Returns a Promise object that is resolved with a StatisticResult object
 */
client.getStatisticByDate(range, startDate).then((statisticResult) => {
    // Process the statistical data
});
```

### VerificationResult

#### Constants
- FIELD_NOT_VERIFIED: 'not-verified'
- FIELD_VALID: 'valid'
- FIELD_INVALID: 'invalid'

#### isSubmittable(): boolean
Returns true, if the form is submittable. This means that the verification was successful and the
form data are valid.

#### isValid(): boolean
Returns true, if mosparo determined the form as valid. The difference to `isSubmittable()` is, that this
is the raw result from mosparo while `isSubmittable()` also checks if the verification was done correctly.

#### getVerifiedFields(): array (see Constants)
Returns an array with all verified field keys.

#### getVerifiedField(key): string (see Constants)
Returns the verification status of one field.

#### hasIssues(): boolean
Returns true, if there were verification issues.

#### getIssues(): array
Returns an array with all verification issues.

### StatisticResult

#### getNumberOfValidSubmissions(): int
Returns the total number of valid submissions in the requested date range.

#### getNumberOfSpamSubmissions(): int
Returns the total number of spam submissions in the requested date range.

#### getNumbersByDate(): array
Returns an array with all statistical data for the requested time range. The date is the key in the array, while an array is set as a value. The array contains a key `numberOfValidSubmissions` with the number of valid submissions and a key `numberOfSpamSubmissions` with the number of spam submissions.
