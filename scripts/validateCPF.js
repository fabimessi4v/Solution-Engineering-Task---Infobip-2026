/**
 * ============================================================================
 * INFOBIP SOLUTIONS ENGINEERING - BANCO IB DIGITAL TRANSFORMATION
 * Component: Brazilian CPF Document Validation (Modulo 11 + Regex)
 * File: scripts/validateCPF.js
 * ============================================================================
 * 
 * This module implements the document validation logic required for Banco IB's
 * virtual assistant running on the Infobip Answers conversational platform.
 * 
 * Validation Rules:
 * 1. Syntax/Format: Validates standard mask (000.000.000-00) or plain numeric string (11 digits).
 * 2. Uniform Sequences: Rejects numbers with 11 identical digits (e.g. 111.111.111-11).
 * 3. Modulo 11 Algorithm:
 *    - Calculation and verification of the 1st check digit (DV1).
 *    - Calculation and verification of the 2nd check digit (DV2).
 */

/**
 * Validates a CPF document number applying Regex and the official Modulo 11 algorithm.
 * 
 * @param {string|number} rawCpf - Input CPF string or number with or without formatting.
 * @returns {object} Detailed validation result:
 *   - isValid: boolean indicating whether the CPF is strictly valid.
 *   - clean: string containing the 11 normalized numeric digits.
 *   - formatted: string formatted as 000.000.000-00 (if valid).
 *   - dv1: calculated first check digit.
 *   - dv2: calculated second check digit.
 *   - error: string error description if invalid.
 */
function validateCPF(rawCpf) {
  if (rawCpf === null || rawCpf === undefined || (typeof rawCpf !== 'string' && typeof rawCpf !== 'number')) {
    return {
      isValid: false,
      error: 'Invalid input: CPF must be a non-empty string or number.'
    };
  }

  const strCpf = String(rawCpf).trim();

  // 1. Syntax check via Regular Expression (with or without mask)
  const regexFormat = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
  if (!regexFormat.test(strCpf)) {
    return {
      isValid: false,
      clean: strCpf.replace(/\D/g, ''),
      error: 'Invalid format: Must contain exactly 11 digits or follow the 000.000.000-00 mask.'
    };
  }

  // 2. Normalization: Extract pure numeric characters
  const clean = strCpf.replace(/\D/g, '');

  if (clean.length !== 11) {
    return {
      isValid: false,
      clean: clean,
      error: 'Invalid length: Normalized CPF must have exactly 11 digits.'
    };
  }

  // 3. Repeated sequences check (known invalid patterns)
  if (/^(\d)\1{10}$/.test(clean)) {
    return {
      isValid: false,
      clean: clean,
      error: 'Invalid repeated sequence: CPF cannot consist of 11 identical digits.'
    };
  }

  // 4. Modulo 11 Algorithm - 1st Check Digit (DV1)
  // Decreasing weights from 10 down to 2 across the first 9 digits
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  const rest1 = sum1 % 11;
  const dv1 = rest1 < 2 ? 0 : 11 - rest1;

  if (parseInt(clean.charAt(9), 10) !== dv1) {
    return {
      isValid: false,
      clean: clean,
      dv1: dv1,
      error: `Invalid first check digit: Expected ${dv1}, received ${clean.charAt(9)}.`
    };
  }

  // 5. Modulo 11 Algorithm - 2nd Check Digit (DV2)
  // Decreasing weights from 11 down to 2 across the first 10 digits
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  const rest2 = sum2 % 11;
  const dv2 = rest2 < 2 ? 0 : 11 - rest2;

  if (parseInt(clean.charAt(10), 10) !== dv2) {
    return {
      isValid: false,
      clean: clean,
      dv1: dv1,
      dv2: dv2,
      error: `Invalid second check digit: Expected ${dv2}, received ${clean.charAt(10)}.`
    };
  }

  // Official mask formatting
  const formatted = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return {
    isValid: true,
    clean: clean,
    formatted: formatted,
    dv1: dv1,
    dv2: dv2,
    error: null
  };
}

// Backward-compatibility alias
const validarCPF = validateCPF;

function isCPFValid(cpf) {
  return validateCPF(cpf).isValid;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateCPF, validarCPF, isCPFValid };
}

// ============================================================================
// CLI TEST EXECUTION SUITE
// ============================================================================
if (require.main === module) {
  console.log('\n=============================================================');
  console.log(' INFOBIP SOLUTIONS ENGINEERING - BANCO IB: CPF TEST SUITE');
  console.log('=============================================================\n');

  const testCases = [
    // 1. Valid CPFs
    { input: '52998224725', expected: true, desc: 'Valid CPF without mask (official demo case)' },
    { input: '529.982.247-25', expected: true, desc: 'Valid CPF with standard mask' },
    { input: '03838616324', expected: true, desc: 'Additional valid CPF without mask' },
    { input: '038.386.163-24', expected: true, desc: 'Additional valid CPF with mask' },
    { input: '706.159.026-26', expected: true, desc: 'Valid CPF with mask' },

    // 2. Invalid by repeated sequence
    { input: '000.000.000-00', expected: false, desc: 'Repeated zeroes with mask' },
    { input: '111.111.111-11', expected: false, desc: 'Repeated ones with mask' },
    { input: '11111111111', expected: false, desc: 'Repeated ones without mask' },
    { input: '222.222.222-22', expected: false, desc: 'Repeated twos with mask' },
    { input: '99999999999', expected: false, desc: 'Repeated nines without mask' },

    // 3. Invalid by wrong check digits
    { input: '52998224720', expected: false, desc: 'Digit 2 altered (expected 5, received 0)' },
    { input: '52998224715', expected: false, desc: 'Digit 1 altered (expected 2, received 1)' },
    { input: '529.982.247-26', expected: false, desc: 'Last digit incremented by 1' },
    { input: '12345678900', expected: false, desc: 'Wrong check digit in sequential number' },

    // 4. Invalid by format or length
    { input: '123.456.789', expected: false, desc: 'Insufficient length (9 digits)' },
    { input: '123.456.789-012', expected: false, desc: 'Excessive length (12 digits)' },
    { input: '529-982-247.25', expected: false, desc: 'Inverted mask separators' },
    { input: '5299822472A', expected: false, desc: 'Alphanumeric character present' },
    { input: '', expected: false, desc: 'Empty string' },
    { input: null, expected: false, desc: 'Null input value' }
  ];

  let passedCount = 0;
  let failedCount = 0;

  testCases.forEach((tc, idx) => {
    const result = validateCPF(tc.input);
    const passed = result.isValid === tc.expected;

    if (passed) {
      passedCount++;
      console.log(`\x1b[32m✔ [PASS]\x1b[0m Case ${String(idx + 1).padStart(2, '0')}: ${tc.desc}`);
      console.log(`   Input: ${JSON.stringify(tc.input)} => Valid: ${result.isValid} ${result.formatted ? `(${result.formatted})` : ''}`);
    } else {
      failedCount++;
      console.log(`\x1b[31m✖ [FAIL]\x1b[0m Case ${String(idx + 1).padStart(2, '0')}: ${tc.desc}`);
      console.log(`   Input: ${JSON.stringify(tc.input)} => Expected: ${tc.expected}, Received: ${result.isValid}`);
      if (result.error) console.log(`   Reason: ${result.error}`);
    }
  });

  console.log('\n-------------------------------------------------------------');
  console.log(` Execution Summary: ${passedCount} passed, ${failedCount} failed.`);
  console.log('-------------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}
