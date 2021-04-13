// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0 ;
pragma experimental ABIEncoderV2;


import "../client/node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../client/node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../client/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../client/node_modules/@openzeppelin/contracts/proxy/Proxy.sol";
import "./OwnableUpgradeable2.sol";
import "./Coin.sol";
import "./BNum.sol";
import "./ABDKMath64x64.sol";

contract LPool is OwnableUpgradeable2, ReentrancyGuard, Proxy, BNum{
/*ERC20 Liquidity Pool Contract
The value of these pools equals the number of ether staked times the total number of coins staked(all coins in pool will be weighted equally), Which means the value of each pool is based on the
pool's supply of ether. The only time a pool's value changes is if a liquidity provider deposits or withdraws value. A pool's value remains constant during 
token exchanges. To create a pool only ether must be staked, but a pool with only ether would not be utilized because it would not support trade with
any other coins. Any token can be staked to a pool already containing ether. The frontend application will determine which pool will create the most optimal trade 
for the user, so the application will autobalance coin prices, and a higher number of pools will result in more stable coin pricing between pools.
  */
address implementation; //logic contract
uint8 public hasEth; //determines if the pool has ether
uint8 public baseFee = 20;  //exchange fee of pool in percent*10
uint120 public accumulatedFees; 
uint120 public poolValue;
mapping(address => uint256) public userValue; //users deposited value based on token index 0
uint256[] public tokenData; //bitwise data of tokens (uint160 = tokenAddress, uint96 = definedWeights) 
  



    function initialize(address _logic, address _creator) public virtual payable initializer {
        require(_logic != address(0), "Logic Contract cannot be a zero address");
        __Ownable_init(_creator);
        
    }

    /*tokens should be sent in units of wei (10^18)
    @param => _tokens = list of ERC20 addresses of the tokens initialized in the pool
    @param => _tokenAmounts = list of amounts of each corresponding indexed token in _tokens
    @param => _definedWeights = list of weights each corresponding indexed token in _tokens (weights are 0-1000 and sum of all elements must equal 1000)
    @param => _definedWeights (if ether is sent with the call, the weight of ether must be the last element in _definedWeights)
    @calcs => _poolValue is calculated by equating the product of all tokens raised by the its corresponding weight (balancer whitepaper eq.1)
    @calcs => the fund initializer receives the full _poolValue since he/she is the only contributer to the pool thus far
    */
    function initializeFunds(address[] memory _tokens, uint256[] memory _tokenAmounts, uint256[] memory _definedWeights) public virtual payable onlyOwner {
        require(_definedWeights.length > 1, "pool must be initialized with at least 2 coins");
        uint256 _tokenData;
        uint256 _poolValue = uint256(BONE);
        uint8 _total = uint8(_tokens.length);

        if(msg.value > 0){
            hasEth=1;
            require(address(this).balance>0,"Contract does not have an ETH balance");
            _tokenData = uint256(uint160(address(this)));
            _tokenData |= (_definedWeights[_total]<<160); //weights are defined as percentages out of 1000
            tokenData.push(_tokenData);
            _poolValue = fractPow(msg.value, _definedWeights[_total]);
        }

        for(uint8 i = 0; i < _total; i++){
            Coin _coin = Coin(payable(_tokens[i]));
            bool transferSuccess = _coin.transferFrom(msg.sender, payable(this), _tokenAmounts[i]);
            require(transferSuccess, "transfer denied");
            //coins have already been fronted from the Factory Contract
            //store token address
            _tokenData = uint256(uint160(_tokens[i]));
            //store weight
            _tokenData |= (_definedWeights[i]<<160); //weights are defined as percentages out of 1000
            tokenData.push(_tokenData);

            //calc pool value
            _poolValue = bmul(_poolValue, fractPow(_tokenAmounts[i], _definedWeights[i]));

        }
        
        poolValue = uint120(_poolValue);
        userValue[msg.sender] = uint256(_poolValue);
    }



    //single asset deposit
    function singleAssetDeposit(address _token, uint256 _tokenAmount) external payable{
        require(tokenData.length>0, "Funds can not be deposited before the owner initializes the pool");
        Coin _coin = Coin(payable(_token));
        uint256 _issuedValue;

        //calc new pool value and added user value
        uint8 tokenIndex = getTokenIndex(_token); //get index of target token

        uint256 weight = uint256(tokenData[tokenIndex]>>160); //get weight of token and convert to decimal
        uint256 balance = _coin.balanceOf(address(this));
        uint256 balanceGain = badd(bdiv(_tokenAmount,balance),BONE);
        uint256 multiplier = bsub(fractPow(balanceGain, weight), BONE);
        _issuedValue = bmul(poolValue, multiplier);

        bool transferSuccess = _coin.transferFrom(msg.sender, payable(this), _tokenAmount);
        require(transferSuccess ==true, "Transfer failed");
        poolValue += uint120(_issuedValue);
        userValue[msg.sender] += _issuedValue;
    }

    /*Balancer whitepaper eq.26 rearranged to solve for Predeemed instead of amount. 
    Predeemed = -Psupply * (-(((At/Bt) - 1)^wt) - 1)
    @param _amount(At) - the amount of coins (in wei) requested to be withdrawn
    @param _coinIndex - the tokenData index of the coin
    @equation = Psupply is the total pool value (poolValue)
    @equation = Bt is the total balance of the requested token in the pool
    @equation = wt is the owner definded weight of the token (stored in the last 96 bits of tokenData)
    */
    function withdrawSingleCoin(uint8 _coinIndex, uint256 _amount) external payable{
        require(tokenData.length>0, "Funds can not be withdrawn before the owner initializes the pool");
        //check amount
        uint256 max = maxWithdrawSingleCoin(_coinIndex);
        require(_amount <= max, "Amount exceeds users equity");

        //init variables
        int128 _poolValue = convertTo64x64(uint256(poolValue));
        Coin _coin = Coin(payable(address(uint160(tokenData[_coinIndex]))));
        int128 weight = Math.divu(uint256(tokenData[_coinIndex]>>160), uint256(1000));
        int128 balanceToken = convertTo64x64(_coin.balanceOf(address(this)));

        //subtract user's value
        int128 negPercentChange = Math.neg(Math.sub(Math.div(Math.fromUInt(_amount/BONE) , balanceToken), Math.fromUInt(uint256(1)))); //-((At/Bt) - 1)
        int128 power = ifractPow(negPercentChange, weight);//negPercentChange^weight
        int128 multiplier = Math.sub(power, Math.fromUInt(uint256(1)));//power - 1
        int128 result = Math.mul(Math.neg(_poolValue), multiplier);//-Bt * multiplier
        userValue[msg.sender] -= convertFrom64x64(result);

        //transfer coins
        _coin.transfer(msg.sender, _amount);
    }

    function maxWithdrawSingleCoin(uint8 _coinIndex) public view returns (uint256){
        int128 _userValue = convertTo64x64(userValue[msg.sender]);
        int128 _poolValue = convertTo64x64(uint256(poolValue));
        Coin _coin = Coin(payable(address(uint160(tokenData[_coinIndex]))));
        int128 weight = Math.divu(uint256(tokenData[_coinIndex]>>160), uint256(1000));
        int128 balanceToken = convertTo64x64(_coin.balanceOf(address(this)));

        int128 percentChange = Math.sub(Math.fromUInt(uint256(1)), Math.div(_userValue, _poolValue));
        if(convertFrom64x64(percentChange) == 0){
            return convertFrom64x64(balanceToken);
        }
        int128 ratio =  ifractPow(percentChange, Math.div(Math.fromUInt(uint256(1)), weight));
        int128 multiplier = Math.sub(Math.fromUInt(uint256(1)), ifractPow(percentChange, Math.div(Math.fromUInt(uint256(1)), weight)));
        int128 result = Math.mul(balanceToken, multiplier);
        
        return convertFrom64x64(ratio);

    }



    /*return result of equation from balancer whitepaper Trading Formulas eq.15:
    @param _indexIn - index of token address to be traded
    @param _indexOut - index of token address to be received
    @param _amountIn - amount of coins in wei to be sent  */
    function tradeOutGivenIn(uint8 _indexIn, uint8 _indexOut, uint256 _amountIn) public view returns(uint256){
        Coin _coinIn = Coin(payable(address(uint160(tokenData[_indexIn]))));
        Coin _coinOut = Coin(payable(address(uint160(tokenData[_indexOut]))));
        int128 balanceIn = convertTo64x64(_coinIn.balanceOf(address(this)));
        int128 weightIn = Math.divu(uint256(tokenData[_indexIn]>>160), uint256(1000));
        int128 balanceOut = convertTo64x64(_coinOut.balanceOf(address(this)));
        int128 weightOut = Math.divu(uint256(tokenData[_indexOut]>>160), uint256(1000));

        //balancer (eq.15): Out-Given-In 
        int128 compareBalance = Math.div(balanceIn, Math.add(balanceIn, convertTo64x64(_amountIn)));
        int128 multiplier = Math.sub(Math.fromUInt(uint256(1)), ifractPow(compareBalance, Math.div(weightIn, weightOut)));
        int128 result = Math.mul(balanceOut, multiplier);
        return convertFrom64x64(result);

    }

    /* facilitates trade specified by user
    @param _indexIn - index of token address to be traded
    @param _indexOut - index of token address to be received
    @param _amountIn - amount of coins in wei to be sent
    @dev uses "tradeOutGivenIn" function to calculate the amount of tokens the user will receive.
    */
    function trade(uint8 _indexIn, uint8 _indexOut, uint256 _amountIn) external payable{
        Coin _coinIn = Coin(payable(address(uint160(tokenData[_indexIn]))));
        Coin _coinOut = Coin(payable(address(uint160(tokenData[_indexOut]))));
        require(_coinIn.balanceOf(msg.sender) > _amountIn, "Insufficient funds for trade");
        uint256 amountOut = tradeOutGivenIn(_indexIn, _indexOut, _amountIn);
        require(amountOut < _coinOut.balanceOf(address(this)), "trade exceeds funds of pool");
        _coinIn.transferFrom(msg.sender, payable(this), _amountIn);
        _coinOut.transfer(msg.sender, amountOut);
    }
    
    function payout() external payable{
        //pay users accumulated fees
    }





    function getPoolValue(uint8 _index) external view returns(uint256 value){
        uint256[] memory _tokenData = tokenData;
        uint256 balance;
        uint256 weight;
        //loop token data (pull address and weights)
            Coin _coin = Coin(payable(address(uint160(_tokenData[_index]))));
            balance = _coin.balanceOf(address(this));
            weight = uint256(_tokenData[_index]>>160);
            value = (balance/weight)*1000;

        return value;
    }

    function getUserValue() public view returns(uint256){
        return userValue[msg.sender];
    }

    //returns token value in terms of ETH if the pool contains ETH.
    // if the pool does not contain ETH, the value is returned in terms of the 0 index coin.
    function getTokenValue(uint8 _index)public view returns(uint){
        if(hasEth == 0){
            Coin _coin = Coin(payable(address(uint160(tokenData[0]))));
            uint256 primaryBalance = _coin.balanceOf(address(this));
            return bmul(primaryBalance, bdiv(uint256(tokenData[_index]>>160),uint256(tokenData[0]>>160)));
        } else {
            return bmul(address(this).balance,  bdiv(uint256(tokenData[_index]>>160),uint256(tokenData[0]>>160)));
        }
        
    }

    function getTokenAddress(uint8 _index) public view returns(address){
        return address(uint160(tokenData[_index]));
    }

    function getTokenWeight(uint8 _index) public view returns(uint256){
        return uint256(tokenData[_index]>>160);
    }

    function getTokenIndex(address _token) public view returns(uint8){
        uint256[] memory _tokenData = tokenData;
        for(uint8 i = 0; i < _tokenData.length; i++){
            if(uint160(_tokenData[i]) == uint160(_token)){
                return i;
            }
        }
    }



    /*returns spot price of a pair of tokens i.e. the equivalent number of input tokens that would equal one output token (balancer eq.2)
    @param _indexIn - index of input token
    @param _indexOut - index of output token*/
    function spotPrice(uint8 _indexIn, uint8 _indexOut) public view returns (uint256){
        Coin _coinIn = Coin(payable(address(uint160(tokenData[_indexIn]))));
        Coin _coinOut = Coin(payable(address(uint160(tokenData[_indexOut]))));
        int128 weightIn = Math.divu(uint256(tokenData[_indexIn]>>160), uint256(1000));
        int128 balanceIn = convertTo64x64(_coinIn.balanceOf(address(this)));
        int128 weightOut = Math.divu(uint256(tokenData[_indexOut]>>160), uint256(1000));
        int128 balanceOut = convertTo64x64(_coinOut.balanceOf(address(this)));

        int128 result = Math.div(Math.div(balanceIn, weightIn), Math.div(balanceOut, weightOut));
        return convertFrom64x64(result);

    }

    function placeValue(uint num) internal pure returns(uint){
        for(uint i = 1; i <= 10**18; i *= 10){
            if(bdiv(num,i)/BONE < 10){
                return i;
            }
        }
    }

    /*
    function uses the equation (root = exp(weight**ln(_base))) to calculate a number (_base)
    raised to a power (_weight)
    @param _weight - rational number between 0 and 1
    @dev - returns _base**_weight to 10^-18 precision
    */
    function fractPow(uint256 _base, uint256 _weight) public pure returns(uint256){
        //convert _base and _weight to int128
        int128 i = convertTo64x64(_base);   //convert _base to fixed point Q64.64
        int128 n = Math.divu(uint256(_weight),uint256(1000)); //convert weight to Q64.64
        int128 exp = Math.mul(n, Math.ln(i));   
        int128 result = Math.exp(exp);
        return convertFrom64x64(result);
    }
    /*
    @param _base - base of power function given in Q64.64 fixed point decimal
    @param _weight - exponent given in Q64.64 fixed point decimal
    returns Q64.64 fixed point decimal answer*/
    function ifractPow(int128 _base, int128 _weight) public pure returns(int128){
        int128 exp = Math.mul(_weight, Math.ln(_base));   
        int128 result = Math.exp(exp);
        return result;
    }

    //converts base^18 (wei) uint256 num to 64x64 fixed point int128:
    function convertTo64x64(uint256 _num) internal pure returns (int128){
        uint256 whole = _num/BONE; //get integer portion of number (>10^18)
        int128 dec = Math.div(Math.fromUInt(bsub(_num, whole*BONE)), Math.fromUInt(BONE)); //get decimal portion of number (<10^18)

        int128 result = Math.add(Math.fromUInt(whole),dec); //add whole and dec to get 64x64 representation of _num
        return result;
    }

    function convertFrom64x64(int128 _num) internal pure returns(uint256){
        int256 num2 = Math.to128x128(_num);
        int256 scaled = Math.muli(Math.fromUInt(uint256(BONE)), num2); //multiplier to account for 18 decimal places and 20 whole number places
        return uint256(scaled >> 128);//convert to uint
    }

    

    function _implementation() public view override returns(address){
        return implementation;
    }

    function _msgSender() internal view override returns (address) {
        return msg.sender;
    }

    function _msgData() internal view override returns (bytes calldata) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }



}