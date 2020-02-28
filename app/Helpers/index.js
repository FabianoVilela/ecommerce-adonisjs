'use stric';

const crypto = use('crypto');
const Helpers = use('Helpers');

/**
 * Generate random string
 * @param { int } length string length
 * @return { string } random string generated
 */

const str_random = async (length = 40) => {
  let randomString = '';
  let len = randomString.length;

  if (len < length) {
    let size = length - len;
    let bytes = await crypto.randomBytes(size);
    let buffer = new Buffer(bytes);

    randomString += buffer
      .toString('base64')
      .replace(/[^a-zA-Z-0-9]/g, '')
      .substr(0, size);
  }

  return randomString;
};

module.exports = {str_random};
