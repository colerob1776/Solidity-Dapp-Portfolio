import React, {Component} from 'react';
import clsx from 'clsx';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import PeopleIcon from '@material-ui/icons/People';
import BarChartIcon from '@material-ui/icons/BarChart';
import Drawer from '@material-ui/core/Drawer';
import LayersIcon from '@material-ui/icons/Layers';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import AssignmentIcon from '@material-ui/icons/Assignment';

const BN = require('bn.js');


export class CoinFactory extends Component {
  constructor(props){
    super(props);
    this.state = {mmbalance:null,ethBalance:null,coinSymbols:null,coins:null,
                  newMint:[], store:null};
    this.handleMintModal=this.handleMintModal.bind(this);

  }

  handleMintModal(id){
    this.props.setMintModal(!this.props.mintModalOpen);
    this.props.setMintAddress(this.state.owned[id]);
  }
  
  componentDidMount = async () => {
    const accounts = await this.props.drizzle.web3.eth.getAccounts();
    console.log(accounts);
    const minter = this.props.drizzle.contracts.Minter;
    const masterCoin = this.props.drizzle.contracts.Coin;

    const metamaskBalance = new BN(this.props.drizzleState.accountBalances[this.props.drizzleState.accounts[0]]);
    const ethBalance = this.props.drizzle.web3.utils.fromWei(metamaskBalance);
    const coinAddr = await minter.methods.getCoinAddresses().call();
    const ownedCoins = await minter.methods.sendersCoins().call();
    var coinList = [];
    var listItem=null;

    var coinBalance = null;
    for(var i=0; i < ownedCoins.length;i++) {
      var index = i;
      var coin = await new this.props.drizzle.web3.eth.Contract(masterCoin.abi, ownedCoins[i]);
        coinBalance = await coin.methods.balanceOf(accounts[0]).call();
        console.log(coinBalance);
        var symbol = await coin.methods.symbol().call();
        coinBalance = parseFloat(this.props.drizzle.web3.utils.fromWei(coinBalance)).toFixed(3);
        listItem = <ListItem id={i} key={i} button onClick={() => this.handleMintModal(index)}>
                        <ListItemIcon>
                          <LayersIcon />
                        </ListItemIcon>
                        <ListItemText primary={coinBalance} secondary={symbol} />
                    </ListItem>;

        coinList.push(listItem)
      
    }

    const mintCoinButton = 
                      <ListItem key="btn" button onClick={() => this.props.setCreateCoinModal(!this.props.createCoinModalOpen)}>
                        <ListItemIcon>
                          <LayersIcon />
                        </ListItemIcon>
                        <ListItemText primary="Mint Coin" />
                      </ListItem>;
    coinList.push(mintCoinButton);
    //const coinBalance = await contract.methods.balanceOf(coinAddr[0],accounts[0]).call();


    this.setState({mmBalance:metamaskBalance,
                  ethBalance: ethBalance,
                  coinList: coinList,
                  owned: ownedCoins,
              });
  };


  render(){
    
  return (
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(this.props.classes.drawerPaper, !this.props.open && this.props.classes.drawerPaperClose),
        }}
        open={this.props.open}
      >
        <div className={this.props.classes.toolbarIcon}>
          <h1>
            Coin Factory
          </h1>
          <IconButton onClick={this.props.handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />

          {/* COIN FACTORY COMPONENT*/}
          
          <List>
            {this.state.coinList}
          </List>


        <Divider />
        <List></List>
      </Drawer> 
  );
  }
}

