var assert = require('assert')
var createHash = require('crypto').createHash
var BN = require('bn.js')

var ZERO_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

var MAX_TARGET_BITS = 0x1d00ffff
var MAX_TARGET_HEX = '00000000ffff0000000000000000000000000000000000000000000000000000'
var MAX_TARGET_BUFFER = new Buffer(MAX_TARGET_HEX, 'hex')
var MAX_TARGET_BN = new BN(MAX_TARGET_BUFFER)

/**
 * @typedef {Object} TargetObject
 * @property {number} bits
 * @property {Buffer} buf
 */

/**
 * @param {number} bits
 * @return {Buffer}
 */
function bits2buf (bits) {
  var bitsN = (bits >> 24) & 0xff
  assert(bitsN >= 0x03 && bitsN <= 0x1d, 'First part of bits should be in [0x03, 0x1d]')

  var bitsBase = bits & 0xffffff
  assert(bitsBase >= 0x8000 && bitsBase <= 0x7fffff, 'Second part of bits should be in [0x8000, 0x7fffff]')

  return new Buffer(new BN(bitsBase).iushln(8 * (bitsN - 3)).toArray(null, 32))
}

/**
 * @param {(Array|Buffer)} buf
 * @return {number}
 */
function buf2bits (buf) {
  var index = 0
  for (var max = buf.length - 3; buf[index] === 0 && index < max; ++index);
  if (buf[index] > 0x7f) {
    index -= 1
  }

  var bitsN = 32 - index
  assert(bitsN >= 0x03 && bitsN <= 0x1d, 'First part of bits should be in [0x03, 0x1d]')

  var bitsBase = buf[index] << 16 | buf[index + 1] << 8 | buf[index + 2]
  assert(bitsBase >= 0x8000 && bitsBase <= 0x7fffff, 'Second part of bits should be in [0x8000, 0x7fffff]')

  return (bitsN << 24) + bitsBase
}

/**
 * @return {TargetObject}
 */
function getMaxTarget () {
  return {bits: MAX_TARGET_BITS, buf: new Buffer(MAX_TARGET_BUFFER)}
}

/**
 * @param {Buffer} first
 * @param {Buffer} last
 * @return {TargetObject}
 */
function getTarget (first, last) {
  var nTargetTimestamp = 14 * 24 * 60 * 60
  var nActualTimestamp = last.readUInt32LE(68) - first.readUInt32LE(68)
  nActualTimestamp = Math.max(nActualTimestamp, nTargetTimestamp / 4)
  nActualTimestamp = Math.min(nActualTimestamp, nTargetTimestamp * 4)

  var bits = last.readUInt32LE(72)
  var newTarget = BN.min(
    new BN(bits2buf(bits)).muln(nActualTimestamp).divn(nTargetTimestamp),
    MAX_TARGET_BN)

  bits = buf2bits(newTarget.toArray(null, 32))
  return {bits: bits, buf: bits2buf(bits)}
}

/**
 * @param {Buffer} buffer
 * @return {Buffer}
 */
function _sha256x2 (buffer) {
  buffer = createHash('sha256').update(buffer).digest()
  return createHash('sha256').update(buffer).digest()
}

/**
 * @param {number} bits
 * @param {Buffer} hash
 * @param {TargetObject}
 * @return {boolean}
 */
function _verifyHeaderTarget (bits, hash, target) {
  if (bits !== target.bits) {
    return false
  }

  // Use Buffer.compare when 0.10 will be drop (~ april 2016)
  for (var i = 0; i < hash.length; ++i) {
    if (hash[i] !== target.buf[i]) {
      return hash[i] <= target.buf[i]
    }
  }

  return true
}

/**
 * Testnet is special:
 *   If no block has been found in 20 minutes, the difficulty automatically
 *    resets back to the minimum for a single block, after which it returns
 *    to its previous value.
 *
 * @param {Buffer} header
 * @param {?Buffer} previous
 * @param {TargetObject} target
 * @param {boolean} [isTestnet=false]
 * @return {boolean}
 */
function verifyHeader (header, previous, target, isTestnet) {
  // Use Buffer.compare when 0.10 will be drop (~ april 2016)
  var previousHash = previous === null
                       ? ZERO_HASH
                       : _sha256x2(previous).toString('hex')
  if (header.slice(4, 36).toString('hex') !== previousHash) {
    return false
  }

  var hash = Array.prototype.reverse.call(_sha256x2(header))
  var bits = header.readUInt32LE(72)

  return _verifyHeaderTarget(bits, hash, target) ||
         (!!isTestnet && header.readUInt32LE(68) - previous.readUInt32LE(68) > 20 * 60 &&
           _verifyHeaderTarget(bits, hash, getMaxTarget()))
}

/**
 * @param {Buffer[]} headers
 * @param {?Buffer} previous
 * @param {TargetObject} target
 * @param {boolean} isTestnet
 * @return {boolean}
 */
function verifyHeaders (headers, previous, target, isTestnet) {
  for (var i = 0; i < headers.length; previous = headers[i++]) {
    if (!verifyHeader(headers[i], previous, target, isTestnet)) {
      return false
    }
  }

  return true
}

module.exports = {
  bits2buf: bits2buf,
  buf2bits: buf2bits,
  getMaxTarget: getMaxTarget,
  getTarget: getTarget,
  verifyHeader: verifyHeader,
  verifyHeaders: verifyHeaders
}
