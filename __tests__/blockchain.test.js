const BlockChain = require('../src/blockchain.js');
const BlockClass = require('../src/block.js');
const SHA256 = require('crypto-js/sha256');

const blockChainObj = new BlockChain.Blockchain();

beforeEach(() => {
});

test('add block successfully', () => {
    let block = new BlockClass.Block({ data: 'First Block' });
    return expect(blockChainObj._addBlock(block)).resolves.toBe(block);
});

test('Add object of non Block type', () => {
    let block = "Non Block object";
    return expect(blockChainObj._addBlock(block)).rejects.toThrow('Can add only objects of type Block');
});

/*test('Sign with the wallet address', () => {
  return expect(blockChainObj.requestMessageOwnershipVerification('5646gdfadgfh53537')).stringMatching(/^5646gdfadgfh53537/);
});*/
test('difference in mins', () => {
    let time1 = 1612847403;
    let time2 = new Date().getTime().toString().slice(0, -3);
    return expect((((time2 - time1)/60) > 5)).toBe(true);
});