// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0 ;
pragma experimental ABIEncoderV2;


import "../client/node_modules/@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "../client/node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../client/node_modules/@openzeppelin/contracts-upgradeable/utils/Create2Upgradeable.sol";
import "../client/node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../client/node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../client/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../client/node_modules/@openzeppelin/contracts/proxy/Proxy.sol";
import "./Coin.sol";
import "./LPool.sol";

contract Minter is ReentrancyGuard{
    /*By tracking the details of each coin in lists in storage the contract is sacrificing
    deployment cost for frontend speed for lists. If I planned to run this on the EVM I would 
    give let users subscribe to the coins that they wanted to track and call the original ERC20 contracts
    individually to save deployment costs. Assuming cost optimization, the only necessary variables would be the ERC20 contract instances "coins"
    and the "creators" list (to keep track of the user who created the coin since the Minter contract address is always the true creator).
    All other variable are used for quick frontend development */
    uint counter;
    uint poolCounter;
    address[] public coinAddresses;
    address[] public poolAddresses;
    address[] public creators;
    mapping(address => address[]) minters; //stores list of coins created by address
    Coin[] public coins;
    string[] public names;
    string[] public symbols;
    uint[] public supplies;

    event CoinCreated(address coinAddress, uint id);
    event PoolCreated(address poolAddress);
    event CoinMinted(address minterAddress, uint supply);

    function computeAddress(uint256 _salt, address _implementation) public view returns(address){
        return Create2Upgradeable.computeAddress(keccak256(abi.encodePacked(_salt)),
                                                keccak256(getContractCreationCode(_implementation)),
                                                address(this));
    }

    function getContractCreationCode(address _logic) internal pure returns(bytes memory){
        bytes10 creation = 0x3d602d80600a3d3981f3;
        bytes10 prefix = 0x363d3d373d3d3d363d73;
        bytes20 targetBytes = bytes20(_logic);
        bytes15 suffix = 0x5af43d82803e903d91602b57fd5bf3;
        return abi.encodePacked(creation, prefix, targetBytes, suffix);

    }

    function createCoin(uint256 _salt, address _implementation, string memory _name, string memory _symbol,uint _initialSupply) external payable nonReentrant {
        //transfer msg.value to factory contract so that factory contract can fund proxy contract
        address coinProxy = Create2Upgradeable.deploy(
            0,
            keccak256(abi.encodePacked(_salt)),
            getContractCreationCode(_implementation)
        );
        emit CoinCreated(coinProxy, counter);
        Coin _coin = Coin(payable(coinProxy));
        // bytes memory _payload = abi.encodeWithSignature("initialize(address, string, string, uint, address)",address(this), _name, _symbol, _initialSupply, _implementation);
        // (bool success, bytes memory returnData) = coinProxy.call{value:msg.value, gas:msg.value}(_payload);
        // require(success==true, "Initialization of coin failed");
        _coin.initialize(msg.sender, _name, _symbol, _initialSupply, payable(_implementation));
        counter++;
        minters[msg.sender].push(coinProxy);
        creators.push(msg.sender);
        coinAddresses.push(coinProxy);

        names.push(_name);
        symbols.push(_symbol);
        supplies.push(_initialSupply);

    }

    function createPool(uint256 _salt, address _implementation, address[] memory _tokens, uint256[] memory _tokenSupplies, uint16[] memory _definedWeights) external payable nonReentrant {
        //transfer msg.value to factory contract so that factory contract can fund proxy contract
        address poolProxy = Create2Upgradeable.deploy(
            0,
            keccak256(abi.encodePacked(_salt)),
            getContractCreationCode(_implementation)
        );
        emit PoolCreated(address(poolProxy));
        LPool _pool = LPool(payable(poolProxy));

        //transfer all coins fronted by the user to the pool
        // for(uint i = 0; i < _tokens.length; i++){
        //     Coin _coin = Coin(payable(_tokens[i]));
        //     bool success = _coin.transfer(payable(poolProxy), _tokenSupplies[i]);
        //     if(success != true){
        //         revert("Unsuccessful transaction of ERC20");
        //     }
        // }

        // //front ethereum if sent with call
        // if(msg.value>0){
        //     //payable(poolProxy).transfer(msg.value);
        //     }

        _pool.initialize(payable(_implementation), msg.sender);
       // _pool.initializeFunds(_tokens, _tokenSupplies, _definedWeights);
        poolCounter++;
        poolAddresses.push(address(_pool));
    }

    function getPoolAddresses() external view returns (address[] memory){
        return poolAddresses;
    }


    
    function getNames() external view returns (string[] memory) {
        return names;
    }

    function getSymbols() external view returns (string[] memory) {
        return symbols;
    }

    function getSupplies() external view returns (uint[] memory){
        return supplies;
    }

    function getCoinAddresses() external view returns (address[] memory ){
        return coinAddresses;
    }


    function sendersCoins() external view returns (address[] memory){
        return minters[msg.sender];   
    }

    function getSender() external view returns(address){
        return msg.sender;
    }

    


}

