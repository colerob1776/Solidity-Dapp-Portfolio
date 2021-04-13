const { assert } = require("../client/node_modules/chai");
const BN = require('../client/node_modules/bn.js');

const Minter = artifacts.require('./Minter.sol');
const Coin = artifacts.require('./Coin.sol');
const LPool = artifacts.require('./LPool.sol');

const ONE = new BN('1000000000000000000');
const BASE_TEN = new BN('10000000000');


contract('Minter', (accounts) => {
    before(async () => {
        this.Minter = await Minter.deployed();
        this.Coin = await Coin.deployed();
        this.LPool = await LPool.deployed()
    })


    //smart contract address tests
    it('deploys successfully', async () => {
        const mintAddress = await this.Minter.address
        const coinAddress = await this.Coin.address
        const poolAddress = await this.LPool.address
        assert.notEqual(mintAddress, 0x0);
        assert.notEqual(mintAddress,'');
        assert.notEqual(mintAddress,null);
        assert.notEqual(mintAddress,undefined);
        assert.notEqual(coinAddress, 0x0);
        assert.notEqual(coinAddress,'');
        assert.notEqual(coinAddress,null);
        assert.notEqual(coinAddress,undefined);
        assert.notEqual(poolAddress, 0x0);
        assert.notEqual(poolAddress,'');
        assert.notEqual(poolAddress,null);
        assert.notEqual(poolAddress,undefined);

    })

    //smart contract query tests
    it('create coin', async () => {
        const salt1 = 42;
        const salt2 = 13
        const testAmount=new BN("5000");
        const secondAmount = new BN("5000");
        const coinAddress = await this.Coin.address;
        const myAddress = await this.Minter.getSender();
        const createCoin = await this.Minter.createCoin(salt1,coinAddress, "test","TST",testAmount.mul(ONE));
        const createCoin2 = await this.Minter.createCoin(salt2,coinAddress, "second","SCND",secondAmount.mul(ONE));
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);
        const myBalance =await proxyCoin.balanceOf(myAddress);
        console.log(myBalance)
        const name = await proxyCoin.name();
        const symbol = await proxyCoin.symbol();
        const totalSupply = await proxyCoin.totalSupply();
        const proxyCoinNames = await this.Minter.getNames();
        const proxyCoinSymbols = await this.Minter.getSymbols();
        const proxyCoinSupplies = await this.Minter.getSupplies();
        console.log(name);
        console.log(proxyCoinSupplies[0].div(ONE))
        console.log(totalSupply.div(ONE));

        assert.equal(proxyCoinNames[0], name);
        assert.equal(proxyCoinSymbols[0], symbol);
        assert.equal(proxyCoinSupplies[0].div(ONE).words[0], totalSupply.div(ONE).words[0]);
    })

    it('mint coin', async () => {
        const minterAddress = this.Minter.address;
        const testMintAmount = new BN("3000");
        const secondMintAmount = new BN("3000");
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);
        const proxyCoin2 = await Coin.at(proxyCoinAddresses[1]);
        const mint = await proxyCoin.mint(minterAddress, testMintAmount.mul(ONE));
        const mint2 = await proxyCoin2.mint(minterAddress, secondMintAmount.mul(ONE));
        const totalSupply = await proxyCoin.totalSupply();
        const minterBalance = await proxyCoin.balanceOf(minterAddress);
        const minterBalance2 = await proxyCoin2.balanceOf(minterAddress);
        console.log(minterBalance);
        assert(minterBalance.div(ONE).words[0], 3000);
        assert(totalSupply.div(ONE),8000);
        
    })

    it('create pool', async () => {
        const myAddress = await this.Minter.getSender();
        
        const salt = 60;
        const testTokenAmount = new BN("1000");
        const secondTokenAmount = new BN("1000");

        const minterAddress = await this.Minter.address;
        const coinAddress = await this.Coin.address;
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);
        const proxyCoin2 = await Coin.at(proxyCoinAddresses[1]);

        const tokenAmounts = [testTokenAmount.mul(ONE), secondTokenAmount.mul(ONE)];
        const tokenWeights = [750, 250]; //base 1000 ratio
        const poolAddress = await this.LPool.address;
        const createPool = await this.Minter.createPool(salt, poolAddress, proxyCoinAddresses, tokenAmounts, tokenWeights);
        const proxyPoolAddresses = await this.Minter.getPoolAddresses();
        const proxyPool = await LPool.at(proxyPoolAddresses[0]);
        
        const proxyPoolAddress = await proxyPool.address;
        const allow = proxyCoin.increaseAllowance(proxyPoolAddress,tokenAmounts[0].mul(ONE)); 
        const allow2 = proxyCoin2.increaseAllowance(proxyPoolAddress,tokenAmounts[1].mul(ONE)); 
 
        const fund = await proxyPool.initializeFunds(proxyCoinAddresses, tokenAmounts, tokenWeights);
        const storedTokenAddress = await proxyPool.getTokenAddress(0);
        const storedTokenWeight = await proxyPool.getTokenWeight(0);
        const balance = await proxyCoin.balanceOf(proxyPoolAddress);
        console.log(balance.div(ONE).words[0])

        const userValue = await proxyPool.getUserValue();
        const poolValue = await proxyPool.poolValue();

        assert.equal(userValue.div(BASE_TEN).toNumber(), poolValue.div(BASE_TEN).toNumber(), "#1"); //assert 8 decimal precision
        assert.equal(storedTokenAddress, proxyCoinAddresses[0], "#2");  //assert Minter stored pool address
        assert.equal(storedTokenWeight.words[0],tokenWeights[0], "#3");
        assert.equal(balance.div(ONE).words[0], tokenAmounts[0].div(ONE).words[0], "#4")
    })



    //deposit 50 TST into the pool
    it('deposit coin', async() => {
        const myAddress = await this.Minter.getSender();
        const depositAmount = new BN("50");
        const testTokenAmount = new BN("1000");

        const minterAddress = await this.Minter.address;
        const coinAddress = await this.Coin.address;
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);

        const proxyPoolAddresses = await this.Minter.getPoolAddresses()
        const proxyPool = await LPool.at(proxyPoolAddresses[0]);
        const index = await proxyPool.getTokenIndex(proxyCoinAddresses[0]);
        const proxyPoolAddress = await proxyPool.address;
        var poolValues = await proxyPool.getPoolValue(0);

        const balancePreDeposit = await proxyCoin.balanceOf(myAddress);
        const valuePreDeposit = await proxyPool.getUserValue();

        const allow = await proxyCoin.increaseAllowance(proxyPoolAddress, depositAmount.mul(ONE)); 
        const deposit = await proxyPool.singleAssetDeposit(proxyCoinAddresses[0], depositAmount.mul(ONE));

        const balancePostDeposit = await proxyCoin.balanceOf(myAddress);
        const valuePostDeposit = await proxyPool.getUserValue();


        //assert user's balance is decreases 50 TST after deposit
        //assert user's equity in the pool is increased 37.27037479 => pre calculated number
        assert.equal(balancePreDeposit.div(ONE).toNumber() - balancePostDeposit.div(ONE).toNumber(), 50, "user balance did not decrease by 50 TST");
        assert((valuePostDeposit.div(ONE).toNumber() - valuePreDeposit.div(ONE).toNumber()) - 3727037479 <= 1, "Precision less than 8 decimal places");




        const test = await proxyPool.spotPrice(0,1);
        console.log(test.toString())
        const trade = await proxyPool.tradeOutGivenIn(0,1, depositAmount.mul(ONE));
        console.log(trade.toString())
    })

    //withdraw 50 TST from user's wallet
    it('withdraw coin', async() => {
        const myAddress = await this.Minter.getSender();
        const depositAmount = new BN("50");

        const minterAddress = await this.Minter.address;
        const coinAddress = await this.Coin.address;
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);

        const proxyPoolAddresses = await this.Minter.getPoolAddresses()
        const proxyPool = await LPool.at(proxyPoolAddresses[0]);
        const proxyPoolAddress = await proxyPool.address;

        const balancePreWithdraw = await proxyCoin.balanceOf(myAddress);
        console.log(balancePreWithdraw.toString())
        const valuePreWithdraw = await proxyPool.getUserValue();
        console.log(valuePreWithdraw.toString());

        const withdraw = await proxyPool.withdrawSingleCoin(0, depositAmount.mul(ONE));

        const balancePostWithdraw = await proxyCoin.balanceOf(myAddress);
        console.log(balancePostWithdraw.toString());
        const valuePostWithdraw = await proxyPool.getUserValue();
        console.log(valuePostWithdraw.div(BASE_TEN).toNumber());

        //assert precision of 8 decimal places in change of pool value (user gained 37.27037479 in value when depositing 50 TST, user should be paid the equivalent when withdrawing 50 TST )
        //assert user balance of TST is 50 more than pre withdraw
        assert(Math.abs((valuePreWithdraw.div(BASE_TEN).toNumber() - valuePostWithdraw.div(BASE_TEN).toNumber()) - 3727037479) <= 1 , "Precision less than 8 decimal places");
        assert.equal(balancePostWithdraw.div(ONE).toNumber() - balancePreWithdraw.div(ONE).toNumber(), 50);

    })

    it('trade coin', async() => {
        const myAddress = await this.Minter.getSender();
        const tradeAmount = new BN("50");

        const minterAddress = await this.Minter.address;
        const coinAddress = await this.Coin.address;
        const proxyCoinAddresses = await this.Minter.getCoinAddresses();
        const proxyCoin = await Coin.at(proxyCoinAddresses[0]);
        const proxyCoin2 = await Coin.at(proxyCoinAddresses[1]);

        const proxyPoolAddresses = await this.Minter.getPoolAddresses()
        const proxyPool = await LPool.at(proxyPoolAddresses[0]);
        const proxyPoolAddress = await proxyPool.address;

        const outGivenIn = await proxyPool.tradeOutGivenIn(0, 1, tradeAmount.mul(ONE))
        console.log(outGivenIn.div(BASE_TEN).toNumber())
        const userTSTPre = await proxyCoin.balanceOf(myAddress);
        const userSCNDPre = await proxyCoin2.balanceOf(myAddress);
        const poolTSTPre = await proxyCoin.balanceOf(proxyPoolAddress);
        const poolSCNDPre = await proxyCoin2.balanceOf(proxyPoolAddress);

        const allow = await proxyCoin.increaseAllowance(proxyPoolAddress, tradeAmount.mul(ONE));
        const trade = await proxyPool.trade(0, 1, tradeAmount.mul(ONE));

        const userTSTPost = await proxyCoin.balanceOf(myAddress);
        const userSCNDPost = await proxyCoin2.balanceOf(myAddress);
        const poolTSTPost = await proxyCoin.balanceOf(proxyPoolAddress);
        const poolSCNDPost = await proxyCoin2.balanceOf(proxyPoolAddress);

        assert.equal((userTSTPre.div(ONE).toNumber() - userTSTPost.div(ONE).toNumber()), tradeAmount.toNumber());
        assert.equal((poolTSTPost.div(ONE).toNumber() - poolTSTPre.div(ONE).toNumber()), tradeAmount.toNumber());
        assert(Math.abs((userSCNDPost.div(BASE_TEN).toNumber() - userSCNDPre.div(BASE_TEN).toNumber()) - outGivenIn.div(BASE_TEN).toNumber()) <= 1);
        assert(Math.abs((poolSCNDPre.div(BASE_TEN).toNumber() - poolSCNDPost.div(BASE_TEN).toNumber()) - outGivenIn.div(BASE_TEN).toNumber()) <= 1);
    })

    //Event tests
    // it('creates tasks', async () => {
    // const result =await this.todoList.createTask('a new task')
    // const taskCount = await this.todoList.taskCount()
    // assert.equal(taskCount, 2)
    // console.log(result)
    // const event = result.logs[0].args
    // assert.equal(event.id.toNumber(), 2)
    // assert.equal(event.content, 'a new task')
    // assert.equal(event.completed, false)
    // })

})

