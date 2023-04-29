const FIELD_NOT_VERIFIED = 'not-verified';
const FIELD_VALID = 'valid';
const FIELD_INVALID = 'invalid';

class VerificationResult
{
    /**
     * Constructs the VerificationResult object
     *
     * @param {boolean} submittable
     * @param {boolean} valid
     * @param {Array} verifiedFields
     * @param {Array} issues
     */
    constructor (submittable, valid, verifiedFields, issues)
    {
        this.submittable = submittable;
        this.valid = valid;
        this.verifiedFields = verifiedFields;
        this.issues = issues;
    }

    /**
     * Returns true if the submission is submittable
     *
     * @returns {boolean}
     */
    isSubmittable()
    {
        return (this.submittable);
    }

    /**
     * Returns true if the submission is valid
     *
     * @returns {boolean}
     */
    isValid()
    {
        return (this.valid);
    }

    /**
     * Returns an array with the verified fields
     *
     * @returns {Array}
     */
    getVerifiedFields()
    {
        return this.verifiedFields;
    }

    /**
     * Returns the verification result of the given field
     *
     * @param {string} key
     * @returns {string}
     */
    getVerifiedField(key)
    {
        if (!(key in this.verifiedFields)) {
            return FIELD_NOT_VERIFIED;
        }

        return this.verifiedFields[key];
    }

    /**
     * Returns true if the submission has any issues
     *
     * @returns {boolean}
     */
    hasIssues()
    {
        return (this.issues.length > 0);
    }

    /**
     * Returns an array with the issues
     *
     * @returns {Array}
     */
    getIssues()
    {
        return this.issues;
    }
}

module.exports = { VerificationResult, FIELD_NOT_VERIFIED, FIELD_VALID, FIELD_INVALID };
