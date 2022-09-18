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
npm install --save mosparo-js-api-client
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
@TODO
```
4. After the form was submitted, verify the data before processing it
```js
<?php

const mosparo = require('mosparo-js-api-client');

let client = new mosparo.Client(host, publicKey, privateKey, {});

mosparoSubmitToken = formData._mosparo_submitToken;
mosparoValidationToken = formData._mosparo_validationToken;

client.validateSubmission(formData, mosparoSubmitToken, mosparoValidationToken).then((verificationResult) => {
    if (verificationResult.isSubmittable()) {
        // Send the email or process the data
    } else {
        // Show error message
    }
})
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
To verify the form data, call ```validateSubmission``` with the form data in an array and the submit and validation token, which mosparo generated on the form initialization and the form data validation. The method will return a Promise object.
```js
/**
 * @param array formData Array with the form values. All not-processed fields by mosparo (hidden, checkbox, 
 *                       radio and so on) have to be removed from this array
 * @param string mosparoSubmitToken Submit token which mosparo returned on the form initialization
 * @param string mosparoValidationToken Validation token which mosparo returned after the form was validated
 * @return Promise Returns a Promise object
 */
client.validateSubmission(formData, mosparoSubmitToken, mosparoValidationToken).then((validationResult) => {
    if (verificationResult.isSubmittable()) {
        // Do your stuff, e.g. sending emails...
    }
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