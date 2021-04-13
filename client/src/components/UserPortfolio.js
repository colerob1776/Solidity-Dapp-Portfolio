import React, {Component} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableFooter from '@material-ui/core/TableFooter';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import ImportExportSharpIcon from '@material-ui/icons/ImportExportSharp';

const BN = require('bn.js');

const useStyles = makeStyles({
    table: {
      minWidth: 650,
      minHeight: 650,
    },
  });

export class UserPortfolio extends Component {
    constructor(props){
        super(props);
        this.state = {mmbalance:null, ethBalance:null, coinAddr:[], coinNames:[], coinSymbols:[], coinSupplies:[], userBalances:[]};
    
    }

    componentDidMount = async () => {
        const accounts = await this.props.drizzle.web3.eth.getAccounts();
        const minter = this.props.drizzle.contracts.Minter;
        const masterCoin = this.props.drizzle.contracts.Coin;
    
        const metamaskBalance = new BN(this.props.drizzleState.accountBalances[this.props.drizzleState.accounts[0]]);
        const ethBalance = this.props.drizzle.web3.utils.fromWei(metamaskBalance);
        const coinAddr = await minter.methods.getCoinAddresses().call();
        const coinSymbols = await minter.methods.getSymbols().call();
        const coinNames = await minter.methods.getNames().call();

        var coinBalance = null;
        var userBalances = [];
        var names=[];
        var symbols=[];
        for(var i = 0; i<coinAddr.length; i++){
            var coin = await new this.props.drizzle.web3.eth.Contract(masterCoin.abi, coinAddr[i]);
            coinBalance = await coin.methods.balanceOf(accounts[0]).call();
            console.log(coinBalance)
            coinBalance = parseFloat(this.props.drizzle.web3.utils.fromWei(coinBalance)).toFixed(3);
            if(coinBalance>0){
                userBalances.push(coinBalance);
                names.push(coinNames[i]);
                symbols.push(coinSymbols[i]);
            }
        }
    
        this.setState({mmBalance:metamaskBalance,
                      ethBalance: ethBalance,
                      coinSymbols:symbols,
                      coinAddr: coinAddr,
                      coinNames: names,
                      userBalances: userBalances
                  });
      };



    handleSendReceive(coinIndex){
        this.props.setSendReceiveModal(true);
        this.props.setCoinInstance(this.state.coinAddr[coinIndex]);
    }

    createRowObject(symbol, balance){
       return {symbol, balance}
    };


    render(){
        var rows = [];
        for(var i = 0; i < this.state.coinNames.length; i++){
            rows.push(this.createRowObject(this.state.coinSymbols[i], this.state.userBalances[i]));
        }


        return(
            <TableContainer>
                <Table className={useStyles.table} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell align="left">Name</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell align="right">USD Value</TableCell>
                            <TableCell align="right">Transfer</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell align="left">ETH</TableCell>
                            <TableCell align="right">{parseFloat(this.state.ethBalance).toFixed(3)}</TableCell>
                            <TableCell align="right">$</TableCell>
                            <TableCell align="right">
                                <Button onClick={() => this.props.setSendReceiveModal(true)}>
                                    <ImportExportSharpIcon color='primary' fontSize='large'/>
                                </Button>
                            </TableCell>
                        </TableRow>
                        {rows.map((row,id) => (
                            <TableRow key={row.name}>
                            <TableCell component="th" scope="row">
                                {id + 2}
                            </TableCell>
                            <TableCell align="left">{row.symbol}</TableCell>
                            <TableCell align="right">{row.balance}</TableCell>
                            <TableCell align="right">$</TableCell>
                            <TableCell align="right">
                                <Button onClick={() => this.handleSendReceive(id)}>
                                    <ImportExportSharpIcon color='primary' fontSize='large' />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            </TableContainer>
        )
    }


}
