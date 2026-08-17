"use client";

var ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" };
var AES_PARAMS = { name: "AES-GCM", length: 256 };
var HKDF_PARAMS = { name: "HKDF", hash: "SHA-256" };

export async function generateKeyPair(): Promise<{publicKey: CryptoKey; privateKey: CryptoKey}> {
  return crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);
}

export async function exportPublicKeyPem(keyPair: CryptoKeyPair) {
  var spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  return spkiToPem(spki);
}

export async function exportPrivateKeyPem(keyPair: CryptoKeyPair) {
  var pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return pkcs8ToPem(pkcs8);
}

function spkiToPem(spki: ArrayBuffer) {
  var b64 = arrayBufferToBase64(spki);
  return "-----BEGIN PUBLIC KEY-----\n" + b64 + "\n-----END PUBLIC KEY-----";
}

function pkcs8ToPem(pkcs8: ArrayBuffer) {
  var b64 = arrayBufferToBase64(pkcs8);
  var lns = b64.match(/.{1,64}/g) || [b64];
  return "-----BEGIN PRIVATE KEY-----\n" + lns.join("\n") + "\n-----END PRIVATE KEY-----";
}

function pemToBuffer(pem: string) {
  var pat1 = /-----BEGIN [\\w ]+-----/g;
  var pat2 = /-----END [\\w ]+-----/g;
  var b64 = pem.replace(pat1, "").replace(pat2, "").replace(/\\s/g, "");
  return base64ToBuffer(b64);
}

export async function importPrivateKeyPem(pem: string) {
  var pkcs8 = pemToBuffer(pem);
  return crypto.subtle.importKey("pkcs8", pkcs8, ECDH_PARAMS, false, ["deriveKey", "deriveBits"]);
}

export async function importPublicKeyPem(pem: string) {
  var spki = pemToBuffer(pem);
  return crypto.subtle.importKey("spki", spki, ECDH_PARAMS, false, []);
}

export async function deriveSharedSecret(privateKey: CryptoKey, peerPublicKeyPem: string) {
  var peerPublicKey = await importPublicKeyPem(peerPublicKeyPem);
  return crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, privateKey, 256);
}

export async function deriveAesKey(sharedSecret: ArrayBuffer, salt: string, info: string) {
  var saltB = new TextEncoder().encode(salt);
  var infoB = new TextEncoder().encode(info);
  var hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, HKDF_PARAMS, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: saltB, info: infoB },
    hkdfKey, AES_PARAMS, false, ["encrypt", "decrypt"]);
}

export async function encryptMessage(aesKey: CryptoKey, plaintext: string) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  var enc = Buffer.from(plaintext, "utf-8");
  var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, aesKey, new Uint8Array(enc).buffer as ArrayBuffer);
  return { ciphertext: bufferToBase64(ct), iv: bufferToBase64(iv) };
}

export async function decryptMessage(aesKey: CryptoKey, ciphertext: string, iv: string) {
  var ctB = base64ToBuffer(ciphertext);
  var ivB = base64ToBuffer(iv);
  var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivB }, aesKey, ctB);
  return new TextDecoder().decode(pt);
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  var b = new Uint8Array(buf);
  var s = "";
  for (var i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array) { return arrayBufferToBase64(buf instanceof Uint8Array ? buf.buffer as ArrayBuffer : buf); }

function base64ToBuffer(s: string) {
  var raw = atob(s);
  var b = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i);
  return new Uint8Array(b).buffer as ArrayBuffer;
}