/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also every time you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backend to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({star: 'Genesis Block',owner:null});
            block.height = 0;
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
         if(block instanceof BlockClass.Block){
            block.time = new Date().getTime().toString().slice(0, -3);
            if (self.chain.length > 0) {
                block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                block.height = self.chain.length;
            }
            block.time = new Date().getTime().toString().slice(0, -3);
            block.hash = SHA256(JSON.stringify(block)).toString();
            let blockIndex = self.chain.push(block);
            if (blockIndex) {
                let errorLog  = await self.validateChain();
                if(errorLog.length > 0){
                    reject(new Error('Blockchain validation failed '));
                }else{
                    resolve(self.chain[blockIndex-1]);
                }
            } else {
                reject(new Error('Exception while adding block to the chain'));
            }
        }else {
            reject(new Error('Can add only objects of type Block'));
        }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(address+':'+`${new Date().getTime().toString().slice(0, -3) }:starRegistry`);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let messageTime = parseInt(message.split(':')[1]);
                let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
                if (((currentTime - messageTime) / 60) > 5) {
                    return reject(new Error('More than 5 mins elapsed since the signing of the message'));
                }
                //check with the ! operator if message is verified
                if (!bitcoinMessage.verify(message, address, signature)) {
                   return reject(new Error('Not able to verify the message'));
                }
                let block = new BlockClass.Block({ star: star, owner:address });
                block.owner = address;
                resolve(this._addBlock(block));
            } catch (error) {
                return reject(new Error('Error while adding the block to chain'));
            }         
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
    
        return new Promise((resolve, reject) => {
            let blocks = self.chain.filter(p => p.owner === address);
            let ownedBlocks = [];
            for (let block of blocks) {
                ownedBlocks.push(hex2ascii(block.body));
            }
            if (ownedBlocks.length > 0) {
                resolve(ownedBlocks);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            for (var i = 0; i < self.chain.length - 1; i++) {
                // validate block
                let valid = await self.chain[i].validate()
                if (!valid) {
                    errorLog.push(i);
                }
                // compare blocks hash link
                let blockHash = self.chain[i].hash;
                let previousHash = self.chain[i + 1].previousBlockHash;
                if (blockHash !== previousHash) {
                    errorLog.push(i);
                }
            }
            if (errorLog.length > 0) {
                console.log('Block errors = ' + errorLog.length);
            } else {
                console.log('No errors detected');
            }
            resolve(errorLog);
        });
    }
  
    validateChainOld() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            for (var i = 0; i < self.chain.length - 1; i++) {
                // validate block
                if (!self.validateBlock(i)) {
                    errorLog.push(i);
                }
                // compare blocks hash link
                let blockHash = self.chain[i].hash;
                let previousHash = self.chain[i + 1].previousBlockHash;
                if (blockHash !== previousHash) {
                    errorLog.push(i);
                }
            }
            if (errorLog.length > 0) {
                console.log('Block errors = ' + errorLog.length);
            } else {
                console.log('No errors detected');
            }
            resolve(errorLog);
        });
    }
    // validate block
    async validateBlock(blockHeight) {
        let self = this;
        let block = await self.getBlockByHeight(blockHeight);
        const blockHash = block.hash;
        block.hash = null;
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        block.hash = blockHash;
        if (block.hash === validBlockHash) {
            return true;
        } else {
            console.log('Block #' + blockHeight + ' invalid hash:\n' + block.hash + '<>' + validBlockHash);
            return false;
        }
    }

}

module.exports.Blockchain = Blockchain;   