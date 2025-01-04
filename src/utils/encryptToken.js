import CryptoJS from "crypto-js";

// 使用用户输入的密码加密 Token
export function encryptToken(token, password) {
  const encrypted = CryptoJS.AES.encrypt(token, password).toString();
  return encrypted;
}

// 使用已知 Token 和用户输入的密码解密
export function decryptToken(encryptedToken, password) {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, password);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}
