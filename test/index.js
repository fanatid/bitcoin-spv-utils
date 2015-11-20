var expect = require('chai').expect
var createHash = require('crypto').createHash
var BN = require('bn.js')

var spvUtils = require('../src')

var fixtures = require('./fixtures')

var MAX_TARGET_BITS = 0x1d00ffff

fixtures.withReset.headers = fixtures.withReset.headers.map(function (h) { return new Buffer(h, 'hex') })
fixtures.withoutReset.headers = fixtures.withoutReset.headers.map(function (h) { return new Buffer(h, 'hex') })
fixtures.previousNull.headers = fixtures.previousNull.headers.map(function (h) { return new Buffer(h, 'hex') })

/**
 * @param {Buffer} buffer
 * @return {Buffer}
 */
function sha256x2 (buffer) {
  buffer = createHash('sha256').update(buffer).digest()
  return createHash('sha256').update(buffer).digest()
}

/**
 * @param {number} bits
 * @return {Buffer}
 */
function bits2buf (bits) {
  var bitsN = (bits >> 24) & 0xff
  expect(bitsN).to.be.within(0x03, 0x1d)
  var bitsBase = bits & 0x00ffffff
  expect(bitsBase).to.be.within(0x8000, 0x7fffff)

  return new Buffer(new BN(bitsBase).iushln(8 * (bitsN - 3)).toArray(null, 32))
}

/**
 * @param {number} bits
 * @return {TargetObject}
 */
function bits2targetObj (bits) {
  return {bits: bits, buf: bits2buf(bits)}
}

describe('bitcoin-spv-utils', function () {
  describe('bits2buf', function () {
    fixtures.bits2buf.forEach(function (fixture) {
      it(fixture.description, function () {
        if (fixture.error) {
          return expect(function () {
            spvUtils.bits2buf(fixture.bits)
          }).to.throw(Error, new RegExp(fixture.error))
        }

        var buf = spvUtils.bits2buf(fixture.bits)
        expect(buf.toString('hex')).to.equal(fixture.hex)
      })
    })
  })

  describe('buf2bits', function () {
    fixtures.buf2bits.forEach(function (fixture) {
      it(fixture.description, function () {
        if (fixture.error) {
          return expect(function () {
            spvUtils.buf2bits(new Buffer(fixture.hex, 'hex'))
          }).to.throw(Error, new RegExp(fixture.error))
        }

        var bits = spvUtils.buf2bits(new Buffer(fixture.hex, 'hex'))
        expect(bits).to.equal(fixture.bits)
      })
    })
  })

  it('getMaxTarget', function () {
    expect(spvUtils.getMaxTarget()).to.deep.equal({
      bits: MAX_TARGET_BITS,
      buf: bits2buf(MAX_TARGET_BITS)
    })
  })

  describe('getTarget', function () {
    fixtures.chunks.forEach(function (fixture) {
      it(fixture.description, function () {
        var first = new Buffer(fixture.first, 'hex')
        var last = new Buffer(fixture.last, 'hex')
        if (fixture.error) {
          return expect(function () {
            spvUtils.getTarget(first, last)
          }).to.throw(Error, new RegExp(fixture.error))
        }

        var result = spvUtils.getTarget(first, last)
        expect(result).to.deep.equal(bits2targetObj(fixture.bits))
      })
    })
  })

  describe('verifyHeader', function () {
    it('previous header hash in current header not equal to previous header', function () {
      var current = fixtures.withoutReset.headers[1]
      var previous = new Buffer(80)
      var target = bits2targetObj(fixtures.withoutReset.bits)
      var result = spvUtils.verifyHeader(current, previous, target, true)
      expect(result).to.be.false
    })

    it('bits in current header to not equal target bits', function () {
      var current = new Buffer(fixtures.withoutReset.headers[1])
      var previous = fixtures.withoutReset.headers[0]
      var target = bits2targetObj(fixtures.withoutReset.bits)
      current.writeUInt32LE(target.bits - 1, 72)
      var result = spvUtils.verifyHeader(current, previous, target, true)
      expect(result).to.be.false
    })

    it('current hash is more than target', function () {
      var current = new Buffer(fixtures.withoutReset.headers[1])
      var previous = fixtures.withoutReset.headers[0]
      var target = bits2targetObj(fixtures.withoutReset.bits)
      // use target.buf = new Buffer(new Array(32).fill(0)) when 0.12 will drop
      target.buf = new Buffer(32)
      target.buf.fill(0)
      var result = spvUtils.verifyHeader(current, previous, target, true)
      expect(result).to.be.false
    })

    it('current hash is equal to target', function () {
      var current = new Buffer(fixtures.withoutReset.headers[1])
      var previous = fixtures.withoutReset.headers[0]
      var target = bits2targetObj(fixtures.withoutReset.bits)
      target.buf = Array.prototype.reverse.call(sha256x2(current))
      var result = spvUtils.verifyHeader(current, previous, target, true)
      expect(result).to.be.false
    })

    it('previous is null', function () {
      var current = fixtures.previousNull.headers[0]
      var target = bits2targetObj(fixtures.previousNull.bits)
      var result = spvUtils.verifyHeader(current, null, target, true)
      expect(result).to.be.true
    })
  })

  describe('verifyHeaders', function () {
    it('with difficulty reset and testnet is true', function () {
      var headers = fixtures.withReset.headers.slice(1)
      var previous = fixtures.withReset.headers[0]
      var target = bits2targetObj(fixtures.withReset.bits)
      var result = spvUtils.verifyHeaders(headers, previous, target, true)
      expect(result).to.be.true
    })

    it('with difficulty reset and testnet is false', function () {
      var headers = fixtures.withReset.headers.slice(1)
      var previous = fixtures.withReset.headers[0]
      var target = bits2targetObj(fixtures.withReset.bits)
      var result = spvUtils.verifyHeaders(headers, previous, target, false)
      expect(result).to.be.false
    })

    it('previous is null', function () {
      var headers = fixtures.previousNull.headers
      var target = bits2targetObj(fixtures.previousNull.bits)
      var result = spvUtils.verifyHeaders(headers, null, target, true)
      expect(result).to.be.true
    })
  })
})
