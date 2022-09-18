const FIELD_NOT_VERIFIED = 'not-verified';
const FIELD_VALID = 'valid';
const FIELD_INVALID = 'invalid';

class VerificationResult
{
    constructor (submittable, valid, verifiedFields, issues)
    {
        this.submittable = submittable;
        this.valid = valid;
        this.verifiedFields = verifiedFields;
        this.issues = issues;
    }

    isSubmittable()
    {
        return (this.submittable);
    }

    isValid()
    {
        return (this.valid);
    }

    getVerifiedFields()
    {
        return this.verifiedFields;
    }

    getVerifiedField(key)
    {
        if (!(key in this.verifiedFields)) {
            return FIELD_NOT_VERIFIED;
        }

        return this.verifiedFields[key];
    }

    hasIssues()
    {
        return (this.issues.length > 0);
    }

    getIssues()
    {
        return this.issues;
    }
}

module.exports = { VerificationResult, FIELD_NOT_VERIFIED, FIELD_VALID, FIELD_INVALID };
