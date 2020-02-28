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
    let buffer = Buffer.from(bytes);

    randomString += buffer
      .toString('base64')
      .replace(/[^a-zA-Z-0-9]/g, '')
      .substr(0, size);
  }

  return randomString;
};

/**
 * Move file to specific path. If no path is defined mot to 'public/uploads'
 * @param { FileJar } file
 * @param { string } path
 * @return { Object<FileJar> }
 */
const manage_single_upload = async (file, path = null) => {
  path = path ? path : Helpers.publicPath('uploads');

  const random_name = await str_random(30);
  let filename = `${new Date().getTime()}-${random_name}.${file.subtype}`;

  await file.move(path, {
    name: filename,
  });

  return file;
};

/**
 * Move files to specific path. If no path is defined mot to 'public/uploads'
 * @param { FileJar } fileJar
 * @param { string } path
 * @return { Object }
 */
const manage_multiple_uploads = async (fileJar, path = null) => {
  path = path ? path : Helpers.publicPath('uploads');
  let successes = [],
    errors = [];

  await Promise.all(
    fileJar.files.map(async file => {
      let random_name = await str_random(30);
      let filename = `${new Date().getTime()}-${random_name}.${file.subtype}`;

      await file.move(path, {
        name: filename,
      });

      if (file.moved()) successes.push(file);
      else errors.push(file.error());
    }),
  );

  return {successes, errors};
};

module.exports = {
  str_random,
  manage_single_upload,
  manage_multiple_uploads,
};
