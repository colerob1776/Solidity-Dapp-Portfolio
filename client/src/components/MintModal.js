import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function MintModal(props) {
const[coinName, setCoinName] = React.useState("");
const[coinSymbol, setCoinSymbol] = React.useState("");
const[coinSupply, setCoinSupply] = React.useState(0);
const[contractState, setState] = React.useState(null);



function mintMoreCoins(supply){
    var state = props.drizzle.store.getState()
    const account = props.drizzle.web3.eth.getAccounts();

    const getContractData = async() => {
      const masterCoin = props.drizzle.contracts.Coin;
      const coin = new props.drizzle.web3.eth.Contract(masterCoin.abi, props.mintAddress);
      const contract_addr = coin._address;
      const wallet_addr = props.drizzleState.accounts[0];
      supply = props.drizzle.web3.utils.toWei(supply);
      const transactionData = coin.methods.mint(wallet_addr, supply).encodeABI();
      console.log(transactionData)
        var gasPrice = await props.drizzle.web3.eth.estimateGas({
          from: wallet_addr,
            to: contract_addr,
            data: transactionData
         })
         console.log(gasPrice)
         const mint = await coin.methods.mint(wallet_addr, supply).send({ from: wallet_addr,gasPrice:gasPrice, gas: gasPrice, to:contract_addr});

        
         return
    }
    const gasPrice = getContractData();
    
    setState(state);
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
      <Dialog open={true} onClose={() => props.setMintModal(!props.mintModalOpen)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Mint More</DialogTitle>
        <DialogContent>
          <DialogContentText>
              Mint more coins to use just like the government
          </DialogContentText>
            <TextField onChange={(e)=>setCoinSupply(e.target.value)}  autoFocus margin="dense" id="supply" label="Coin Supply" type="number" fullWidth >
                {coinSupply}
            </TextField>
          
        </DialogContent>
        <DialogActions>
          <Button onClick={() => props.setMintModal(!props.mintModalOpen)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => mintMoreCoins(coinSupply)} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}