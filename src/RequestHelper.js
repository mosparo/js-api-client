const sha256 = require('crypto-js/sha256');
const hmacSHA256 = require('crypto-js/hmac-sha256');

class RequestHelper
{
    constructor (publicKey, privateKey)
    {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    createHmacHash(data)
    {
        return hmacSHA256(data, this.privateKey).toString();
    }

    prepareFormData(formData)
    {
        let isArray = false;
        if (Array.isArray(formData)) {
            isArray = true;
        }

        formData = this.cleanupFormData(formData);

        for (let key in formData) {
            if (isArray) {
                key = parseInt(key);
            }

            let val = formData[key];

            if (typeof val === 'object') {
                formData[key] = this.prepareFormData(val);
            } else {
                if (typeof val === 'number') {
                    val = val.toString();
                }

                formData[key] = sha256(val).toString();
            }
        }

        if (!isArray) {
            formData = this.sortFormData(formData);
        }

        return formData;
    }

    cleanupFormData(formData)
    {
        if ('_mosparo_submitToken' in formData) {
            delete formData._mosparo_submitToken;
        }

        if ('_mosparo_validationToken' in formData) {
            delete formData._mosparo_validationToken;
        }

        let isArray = false;
        if (Array.isArray(formData)) {
            isArray = true;
        }

        for (let key in formData) {
            if (isArray) {
                key = parseInt(key);
            }

            let val = formData[key];

            if (typeof key === 'string' && key.indexOf('[]') > 0) {
                delete formData[key];
                key = key.substring(0, key.indexOf('[]'));
            }

            if (typeof val === 'object') {
                formData[key] = this.cleanupFormData(val);
            } else if (typeof val === 'string') {
                formData[key] = val.replace(/\r\n/g, '\n');
            }
        }

        if (!isArray) {
            formData = this.sortFormData(formData);
        }

        return formData;
    }

    createFormDataHmacHash(formData)
    {
        return this.createHmacHash(this.toJson(formData));
    }

    toJson(inData)
    {
        let jsonString = JSON.stringify(inData);

        return jsonString.replace(/\[]/g, '{}');
    }

    sortFormData(formData)
    {
        return Object.keys(formData).sort().reduce(
            (sortedFormData, key) => {
                sortedFormData[key] = formData[key];
                return sortedFormData;
            },
            {}
        );
    }
}

module.exports = { RequestHelper };