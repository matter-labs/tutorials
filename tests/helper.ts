let result: any;

export class Helper {
  /**
   * Checks the validity of an Ethereum address (wallet/contract).
   * @param {string} value - The input string to validate.
   * @returns {boolean} - Returns `true` if the input matches the expected Ethereum value format, and `false` otherwise.
   */
  async isValidEthFormat(value: any) {
    if (typeof value !== "string" || !value.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
      result = false;
    } else {
      result = true;
    }
    return result;
  }
}
