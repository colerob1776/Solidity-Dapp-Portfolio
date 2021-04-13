import React from 'react';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export default function SendReceiveModal(props) {
const [sendReceive, setSendReceive] = React.useState([true, false]);
const [toAddress, setToAddress] = React.useState('');
const [sendAmount, setSendAmount] = React.useState('');
const[contractState, setState] = React.useState(null);

async function transferCoins(toAddress, amount){
    const masterCoin = props.drizzle.contracts.Coin;
    const coin = await new props.drizzle.web3.eth.Contract(masterCoin.abi, props.coinInstance);
    const contract_addr = coin._address;
    const wallet_addr = props.drizzleState.accounts[0];
    amount = props.drizzle.web3.utils.toWei(String(amount));
    const transactionData = coin.methods.transfer(toAddress, amount).encodeABI();
        
    var gasPrice = await props.drizzle.web3.eth.estimateGas({
      from: wallet_addr,
        to: contract_addr,
        data: transactionData
      })
      const transfer = await coin.methods.transfer(toAddress, amount).send({ from: wallet_addr,gasPrice:gasPrice, gas: gasPrice, to:contract_addr});
};

function handleSendReceive(index){
  if(index===0 && sendReceive[0] === false){
    setSendReceive([true, false]);
  } else if(index === 1 && sendReceive[1] === false){
    setSendReceive([false, true]);
  } else {
    return;
  }
  return;
}

var title = <DialogTitle id="form-dialog-title">Transfer
              <ButtonGroup style={{float: 'right'}} color="primary" variant='outlined' >
                <Button variant={sendReceive[0] ? 'contained':'text'} onClick={() => handleSendReceive(0)}>Send</Button>
                <Button variant={sendReceive[1] ? 'contained':'text'} onClick={() => handleSendReceive(1)}>Receive</Button>
              </ButtonGroup>
            </DialogTitle>

if(sendReceive[0]===true){
  return (
    <div>
      <Dialog open={true} onClose={() => props.setSendReceiveModal(!props.sendReceiveModalOpen)} aria-labelledby="form-dialog-title">
        {title}
        <DialogContent>
          <DialogContentText>
              Send coins to another wallet
          </DialogContentText>
            <TextField onChange={(e)=>setToAddress(e.target.value)}  autoFocus margin="dense" id="address" label='Address' type="text" value={toAddress} fullWidth >
                {toAddress}
            </TextField>
            <TextField onChange={(e)=>setSendAmount(parseInt(e.target.value))} autoFocus margin="dense" id="address" label='Amount' type="number" step=".01" value={sendAmount} fullWidth >
                {sendAmount}
            </TextField>
          
        </DialogContent>
        <DialogActions>
          <Button onClick={() => props.setSendReceiveModal(!props.sendReceiveModalOpen)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => transferCoins(toAddress, sendAmount)} color="primary">
            Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  } else {
    return (
      <div>
        <Dialog open={true} onClose={() => props.setSendReceiveModal(!props.sendReceiveModalOpen)} aria-labelledby="form-dialog-title">
          {title}
          <DialogContent>
            <DialogContentText>
                Copy Address to Clipboard
            </DialogContentText>
              <Button onClick={() => {navigator.clipboard.writeText(props.drizzleState.accounts[0])}}>
                {props.drizzleState.accounts[0]}
                <FileCopyIcon style={{paddingLeft: '5px'}}>
                  copy
                </FileCopyIcon>
              </Button>
            
          </DialogContent>
          <DialogActions>
            <Button onClick={() => props.setSendReceiveModal(!props.sendReceiveModalOpen)} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );

  }
}