var ERC20Token = artifacts.require("./ERC20Token.sol");
var Staking = artifacts.require("./Staking.sol");


module.exports = async(deployer, _network, accounts) => {
  deployer.deploy(Staking);
  
};