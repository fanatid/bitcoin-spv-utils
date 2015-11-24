# bitcoin-spv-utils

[![NPM Package](https://img.shields.io/npm/v/bitcoin-spv-utils.svg?style=flat-square)](https://www.npmjs.org/package/bitcoin-spv-utils)
[![Build Status](https://img.shields.io/travis/fanatid/bitcoin-spv-utils.svg?branch=master&style=flat-square)](https://travis-ci.org/fanatid/bitcoin-spv-utils)
[![Coverage Status](https://img.shields.io/coveralls/fanatid/bitcoin-spv-utils.svg?style=flat-square)](https://coveralls.io/r/fanatid/bitcoin-spv-utils)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![Dependency status](https://img.shields.io/david/fanatid/bitcoin-spv-utils.svg?style=flat-square)](https://david-dm.org/fanatid/bitcoin-spv-utils#info=dependencies)

## API

  - [`bits2buf(Number bits)`](#bits2bufnumber-bits---buffer)
  - [`buf2bits(Buffer buf)`](#buf2bitsbuffer-buf---number)
  - [`getMaxTarget()`](#getmaxtarget---bits-number-buf-buffer)
  - [`getTarget(Buffer first, Buffer last)`](#gettargetbuffer-first-buffer-last---bits-number-buf-buffer)
  - [`verifyHeader(Buffer header, Buffer previous, Object target [, Boolean isTestnet = false])`](#verifyheaderbuffer-header-buffer-previous-object-target--boolean-istestnet--false---boolean)
  - [`verifyHeaders(Buffer[] headers, Buffer previous, Object target [, Boolean isTestnet = false]`](#verifyheadersbuffer-headers-buffer-previous-object-target--boolean-istestnet--false---boolean)

#####`bits2buf(Number bits)` -> `Buffer`

Unpack bits.

#####`buf2bits(Buffer buf)` -> `Number`

Pack bits.

#####`getMaxTarget()` -> `{bits: Number, buf: Buffer}`

Return max target. (bits -- 0x1d00ffff, hex -- 00000000ffff0000000000000000000000000000000000000000000000000000)

#####`getTarget(Buffer first, Buffer last)` -> `{bits: Number, buf: Buffer}`

Calculate target of next chunk.

#####`verifyHeader(Buffer header, ?Buffer previous, Object target [, Boolean isTestnet = false])` -> `Boolean`

Verify given header.

#####`verifyHeaders(Buffer[] headers, ?Buffer previous, Object target [, Boolean isTestnet = false]` -> `Boolean`

Verify given headers.

## License

This software is licensed under the MIT License.
