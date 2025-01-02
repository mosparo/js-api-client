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
    prepareFormData(formData: any): any;
    /**
     * Cleanup the form data
     *
     * @param {Object} formData
     * @returns {Object}
     */
    cleanupFormData(formData: any): any;
    /**
     * Creates the HMAC hash for the given form data
     *
     * @param {Object} formData
     * @returns {string}
     */
    createFormDataHmacHash(formData: any): string;
    /**
     * Converts the given object into a JSON string
     *
     * @param {Object} inData
     * @returns {string}
     */
    toJson(inData: any): string;
    /**
     * Sorts the given form data by key
     *
     * @param {Object} formData
     * @returns {Object}
     */
    sortFormData(formData: any): any;
}
//# sourceMappingURL=RequestHelper.d.ts.map