const BlockClass = require('../src/block.js');
const SHA256 = require('crypto-js/sha256');

let block = new BlockClass.Block({ data: 'Genesis Block' });

beforeEach(() => {

    block.time = new Date().getTime().toString().slice(0, -3);
    block.height = 0;
    block.hash = SHA256(JSON.stringify(block)).toString();
});

test('test get data rejection', () => {
  return expect(block.getBData()).rejects.toThrow('Can not return data for Genesis Block');
});

test('test get data with decoded body', () => {
    block.height = 1;
    return expect(block.getBData()).resolves.toBe('Genesis Block');
  });