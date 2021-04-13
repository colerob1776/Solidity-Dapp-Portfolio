// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

contract SimpleStorage {
  uint storedData;

  event StorageSet(address indexed _from, uint _x);

  function set(uint x) public {
    storedData = x;
    emit StorageSet(msg.sender, storedData);
  }

  function get() public view returns (uint) {
    return storedData;
  }
}
