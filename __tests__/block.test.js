const BlockClass = require('../src/block.js');
const SHA256 = require('crypto-js/sha256');

let block = new BlockClass.Block({ data: 'Genesis Block' });

beforeEach(() => {

    block.time = new Date().getTime().toString().slice(0, -3);
    block.height = 0;
    block.hash = SHA256(JSON.stringify(block)).toString();
});

test('test get data', () => {
    console.log(block.getBData());
});