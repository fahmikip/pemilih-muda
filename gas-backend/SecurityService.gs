function generateSalt() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }

function hashPassword(password, salt) {
  ValidationService.validateRequired(password, 'Password');
  ValidationService.validateRequired(salt, 'Salt');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + ':' + String(password), Utilities.Charset.UTF_8);
  for (var i = 1; i < APP_CONFIG.PASSWORD_HASH_ITERATIONS; i++) digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest);
  return digest.map(function (byte) { var value = byte < 0 ? byte + 256 : byte; return ('0' + value.toString(16)).slice(-2); }).join('');
}

function verifyPassword(password, salt, expectedHash) {
  var actual = hashPassword(password, salt);
  var expected = String(expectedHash || '');
  if (actual.length !== expected.length) return false;
  var difference = 0;
  for (var i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
