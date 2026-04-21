export class RequestHelper {
    /**
     * Constructs the RequestHelper
     *
     * @param {string} publicKey
     * @param {string} privateKey
     */
    constructor(publicKey: string, privateKey: string);
    publicKey: string;
    privateKey: string;
    /**
     * Creates the HMAC hash for the given data
     *
     * @param {string} data
     * @returns {string}
     */
    createHmacHash(data: string): string;
    /**
     * Prepares the form data
     *
     * @param {Object} formData
     * @returns {Object}
     */
    prepareFormData(formData: Object): Object;
    /**
     * Cleanup the form data
     *
     * @param {Object} formData
     * @returns {Object}
     */
    cleanupFormData(formData: Object): Object;
    /**
     * Creates the HMAC hash for the given form data
     *
     * @param {Object} formData
     * @returns {string}
     */
    createFormDataHmacHash(formData: Object): string;
    /**
     * Converts the given object into a JSON string
     *
     * @param {Object} inData
     * @returns {string}
     */
    toJson(inData: Object): string;
    /**
     * Sorts the given form data by key
     *
     * @param {Object} formData
     * @returns {Object}
     */
    sortFormData(formData: Object): Object;
}
//# sourceMappingURL=RequestHelper.d.ts.map