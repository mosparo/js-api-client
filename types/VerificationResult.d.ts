export class VerificationResult {
    /**
     * Constructs the VerificationResult object
     *
     * @param {boolean} submittable
     * @param {boolean} valid
     * @param {Array} verifiedFields
     * @param {Array} issues
     */
    constructor(submittable: boolean, valid: boolean, verifiedFields: any[], issues: any[]);
    submittable: boolean;
    valid: boolean;
    verifiedFields: any[];
    issues: any[];
    /**
     * Returns true if the submission is submittable
     *
     * @returns {boolean}
     */
    isSubmittable(): boolean;
    /**
     * Returns true if the submission is valid
     *
     * @returns {boolean}
     */
    isValid(): boolean;
    /**
     * Returns an array with the verified fields
     *
     * @returns {Array}
     */
    getVerifiedFields(): any[];
    /**
     * Returns the verification result of the given field
     *
     * @param {string} key
     * @returns {string}
     */
    getVerifiedField(key: string): string;
    /**
     * Returns true if the submission has any issues
     *
     * @returns {boolean}
     */
    hasIssues(): boolean;
    /**
     * Returns an array with the issues
     *
     * @returns {Array}
     */
    getIssues(): any[];
}
export const FIELD_NOT_VERIFIED: "not-verified";
export const FIELD_VALID: "valid";
export const FIELD_INVALID: "invalid";
//# sourceMappingURL=VerificationResult.d.ts.map