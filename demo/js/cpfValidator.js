/**
 * ============================================================================
 * INFOBIP SOLUTIONS ENGINEERING - BANCO IB
 * File: demo/js/cpfValidator.js
 * Module: Brazilian CPF Validator (Regex Syntax + Modulo 11 Algorithm)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CPFValidator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Validates a Brazilian CPF number using Regex and the official Modulo 11 formula.
   * 
   * @param {string|number} rawCpf - Input CPF string or number with or without formatting.
   * @returns {object} Detailed validation result:
   *   - isValid: boolean
   *   - clean: string with 11 normalized digits
   *   - formatted: string formatted as 000.000.000-00 (if valid)
   *   - dv1: 1st calculated check digit
   *   - dv2: 2nd calculated check digit
   *   - error: error explanation if invalid
   */
  function validateCPF(rawCpf) {
    if (rawCpf === null || rawCpf === undefined || (typeof rawCpf !== 'string' && typeof rawCpf !== 'number')) {
      return { isValid: false, error: 'Empty or invalid input.' };
    }

    const strCpf = String(rawCpf).trim();

    // 1. Syntax check via Regular Expression
    const regexFormat = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
    if (!regexFormat.test(strCpf)) {
      return {
        isValid: false,
        error: 'Invalid format. Must contain 11 digits or follow the 000.000.000-00 mask.'
      };
    }

    // 2. Normalization: Extract pure digits
    const clean = strCpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      return { isValid: false, clean, error: 'Invalid length. CPF must have exactly 11 digits.' };
    }

    // 3. Repeated sequences check (e.g. 111.111.111-11)
    if (/^(\d)\1{10}$/.test(clean)) {
      return { isValid: false, clean, error: 'Uniform repeated sequence not allowed by banking regulation.' };
    }

    // 4. Modulo 11 Algorithm - 1st Check Digit (DV1)
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    const rest1 = sum1 % 11;
    const dv1 = rest1 < 2 ? 0 : 11 - rest1;

    if (parseInt(clean.charAt(9), 10) !== dv1) {
      return {
        isValid: false,
        clean,
        dv1,
        error: `Invalid 1st check digit. Expected: ${dv1}, received: ${clean.charAt(9)}.`
      };
    }

    // 5. Modulo 11 Algorithm - 2nd Check Digit (DV2)
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    const rest2 = sum2 % 11;
    const dv2 = rest2 < 2 ? 0 : 11 - rest2;

    if (parseInt(clean.charAt(10), 10) !== dv2) {
      return {
        isValid: false,
        clean,
        dv1,
        dv2,
        error: `Invalid 2nd check digit. Expected: ${dv2}, received: ${clean.charAt(10)}.`
      };
    }

    // Standard official mask
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

  return {
    validateCPF: validateCPF,
    validarCPF: validateCPF // Backward-compatibility alias
  };
});
