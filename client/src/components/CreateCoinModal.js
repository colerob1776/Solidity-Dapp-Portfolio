import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function CreateCoinModal(props) {
const[coinName, setCoinName] = React.useState("");
const[coinSymbol, setCoinSymbol] = React.useState("");
const[coinSupply, setCoinSupply] = React.useState(0);
const[contractState, setState] = React.useState(null);

function createCoin(name, symbol, supply){
    const minter = props.drizzle.contracts.Minter;
    const coinMaster = props.drizzle.contracts.Coin;
    const contract_addr = minter.address;
    const wallet_addr = props.drizzleState.accounts[0];
    supply = props.drizzle.web3.utils.toWei(supply);
    const salt = Math.floor(Math.random() * 100000001);
    

    const getContractData = async() => {
         const transactionData = minter.methods.createCoin(salt,coinMaster.address, name, symbol, supply).encodeABI();
        
        var gasPrice = await props.drizzle.web3.eth.estimateGas({
            to: contract_addr,
            data: transactionData
         });
        
        
        try{


          // constminter.methods.createCoin(salt,coinMaster.address, name, symbol, supply).send({ from: wallet_addr,gasPrice:gasPrice, gas: gasPrice, to:contract_addr}));
          // batch.add(newCoin.methods.initialize(wallet_addr, name, symbol, supply, coinMaster.address).send({from: wallet_addr,gasPrice:initPrice, gas: initPrice, to:contract_addr}));
          // batch.execute();


          const creator = await minter.methods.createCoin(salt,coinMaster.address, name, symbol, supply).send({ from: wallet_addr,gasPrice:gasPrice, gas: gasPrice, to:contract_addr});
          if(!creator.ok){
            throw new Error(`EVM error! status: ${creator.status}`)
          }

         } catch(e) {
          console.log(e);
         }
         
        
         return
    }
    const gasPrice = getContractData();
    
    // if (state.drizzleStatus.initialized) {
    //     // Declare this call to be cached and synchronized. We'll receive the store key for recall.
    //     const dataKey = props.drizzle.contracts.Minter.methods.storedData.cacheCall()

    //     const test = props.drizzle.contracts.Minter.methods.createCoin(name, symbol, supply).call().then(
    //         data => console.log(data)
    //     );
    //     // Use the dataKey to display data from the store.
    //     return console.log(state.contracts.Minter.storedData[dataKey].value)
    // }
    // const test = contract.methods.createCoin(name, symbol, supply).send({ from: wallet_addr,gasPrice:gasPrice, gas: 21000, to:contract_addr})
    // console.log(test);
        
    //props.setMintModal(false);

}
  return (
    <div>
      <Dialog open={true} onClose={() => props.setCreateCoinModal(!props.createCoinModalOpen)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Create a Coin</DialogTitle>
        <DialogContent>
          <DialogContentText>
              Become the creator of your own local network ERC20 cryptocurrency. Choose the name, symbol, and supply.
          </DialogContentText>
            <TextField onChange={(e)=>setCoinName(e.target.value)} autoFocus margin="dense" id="name" label="Coin Name" type="text" fullWidth >
                {coinName}
            </TextField>
            <TextField onChange={(e)=>setCoinSymbol(e.target.value)}  autoFocus margin="dense" id="symbol" label="Coin Symbol (COIN)" type="text" fullWidth >
                {coinSymbol}
            </TextField>
            <TextField onChange={(e)=>setCoinSupply(e.target.value)}  autoFocus margin="dense" id="supply" label="Coin Supply" type="number" fullWidth >
                {coinSupply}
            </TextField>
          
        </DialogContent>
        <DialogActions>
          <Button onClick={() => props.setCreateCoinModal(!props.createCoinModalOpen)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => createCoin(coinName, coinSymbol, coinSupply)} color="primary">
            Create
          </Button>
          
        </DialogActions>
      </Dialog>
    </div>
  );
}