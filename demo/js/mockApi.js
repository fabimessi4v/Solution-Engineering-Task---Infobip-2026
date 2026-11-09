/**
 * ============================================================================
 * INFOBIP SOLUTIONS ENGINEERING - BANCO IB
 * File: demo/js/mockApi.js
 * Module: Core Banking Mock API Client (Beeceptor)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BancoIBMockAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ENDPOINT_URL = 'https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf';

  /**
   * Performs an HTTP POST call to the Beeceptor Mock API to validate the CPF.
   * 
   * @param {string} cleanCpf - 11-digit pure numeric CPF string.
   * @returns {Promise<object>} Response object with payload and status details.
   */
  async function validateCPFInCore(cleanCpf) {
    const requestPayload = {
      cpf: cleanCpf,
      channel: 'WHATSAPP'
    };

    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json();

    return {
      endpoint: ENDPOINT_URL,
      httpStatus: response.status,
      requestPayload: requestPayload,
      data: data
    };
  }

  return {
    validateCPFInCore: validateCPFInCore,
    validarCPFEnCore: validateCPFInCore, // Backward-compatibility alias
    ENDPOINT_URL: ENDPOINT_URL
  };
});
