// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0 ;
pragma experimental ABIEncoderV2;


import "../client/node_modules/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../client/node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../client/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../client/node_modules/@openzeppelin/contracts/proxy/Proxy.sol";
import "./OwnableUpgradeable2.sol";



contract Coin is ERC20Upgradeable, OwnableUpgradeable2, ReentrancyGuard, Proxy {
    address payable public implementation;

    function initialize(address _creator, string memory _name, string memory _symbol, uint256 _initialSupply, address payable _logic) public virtual initializer {
        require(_logic != address(0), "Logic Contract cannot be a zero address");
        __ERC20_init(_name, _symbol);
        __Ownable_init(_creator);
        implementation=_logic;
        _mint(_creator, _initialSupply);
    }


    function mint(address account, uint amount) public payable onlyOwner nonReentrant {
        _mint(account, amount);
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

    //ERC20 FUNCTIONS
    /*
    function balanceOf(address user) external view returns(uint256){
        Coin _coin = Coin(coinInstance);
        return _coin.balanceOf(user);
    }

    function transfer(address recipient, uint256 amount) external payable nonReentrant returns(bool){
        Coin _coin = Coin(coinInstance);

        return _coin.transferFrom(msg.sender,recipient, amount);
    }

    

    function owner() external view returns (address minter){
        Coin _coin = Coin(coinInstance);
        minter = _coin.owner();
        return minter;
    }
    */
}