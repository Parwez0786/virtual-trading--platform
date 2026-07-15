const CryptoJS = require("crypto-js");
const { AuthSecrets } = require("../constants/enums");

const crypt = {
  secret: AuthSecrets.CRYPTO,

  encrypt: (clear) => {
    const cipher = CryptoJS.AES.encrypt(clear, crypt.secret);
    return cipher.toString();
  },

  decrypt: (cipher) => {
    const decipher = CryptoJS.AES.decrypt(cipher, crypt.secret);
    return decipher.toString(CryptoJS.enc.Utf8);
  },
};

module.exports = crypt;
