const verRes = require('../src/VerificationResult');

test('Create VerificationResult object', () => {
    let verifiedFields = {
        name: verRes.FIELD_VALID,
        street: verRes.FIELD_INVALID
    }
    let issues = [
        {name: 'street', message: 'Missing in form data, verification not possible'}
    ];

    let verificationResult = new verRes.VerificationResult(
        false,
        true,
        verifiedFields,
        issues
    );

    expect(verificationResult.isSubmittable()).toBeFalsy();
    expect(verificationResult.isValid()).toBeTruthy();
    expect(verificationResult.getVerifiedFields()).toBe(verifiedFields);
    expect(verificationResult.getVerifiedField('name')).toBe(verRes.FIELD_VALID);
    expect(verificationResult.getVerifiedField('street')).toBe(verRes.FIELD_INVALID);
    expect(verificationResult.getVerifiedField('number')).toBe(verRes.FIELD_NOT_VERIFIED);
    expect(verificationResult.hasIssues()).toBeTruthy();
    expect(verificationResult.getIssues()).toBe(issues);
});