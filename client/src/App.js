import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { CoinFactory } from './components/CoinFactory';
import MintModal from './components/MintModal';
import CreateCoinModal from './components/CreateCoinModal';
import SendReceiveModal from './components/SendReceiveModal';
import { CoinTable } from './components/CoinTable';
import { UserPortfolio } from './components/UserPortfolio';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 2,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(0)
  },
  paper: {
    padding: theme.spacing(3),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  fixedTable: {
    minHeight: 650
  }
}));





export default function Dashboard(props) {
  const [Nav, setNav] = React.useState(0);

  const handleNav = (event, newValue) => {
    setNav(newValue);
  }
  const [mintAddress, setMintAddress] = React.useState('');
  const [coinInstance, setCoinInstance] = React.useState('');


  const classes = useStyles();
  const [open, setOpen] = React.useState(true);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const [createCoinModalOpen, setCreateCoinModal] = React.useState(false);
  const [mintModalOpen, setMintModal] = React.useState(false);
  const [sendReceiveModalOpen, setSendReceiveModal] = React.useState(false);

  var createCoinModal = null;
  var mintModal = null;
  var sendReceiveModal=null;
  if(createCoinModalOpen){
    createCoinModal = <CreateCoinModal drizzle={props.drizzle} drizzleState={props.drizzleState} createCoinModalOpen={createCoinModalOpen} setCreateCoinModal={setCreateCoinModal} />
  } else if (mintModalOpen){
    mintModal = <MintModal drizzle={props.drizzle} drizzleState={props.drizzleState} mintAddress={mintAddress} mintModalOpen={mintModalOpen} setMintModal={setMintModal} />
  } else if (sendReceiveModalOpen){
    sendReceiveModal = <SendReceiveModal drizzle={props.drizzle} drizzleState={props.drizzleState} coinInstance={coinInstance} sendReceiveModalOpen={sendReceiveModalOpen} setSendReceiveModal={setSendReceiveModal} />
  }

  //const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  var page = null;
  var sideBarIcon = null;
  var sideBar = null;
  if(Nav===0){
    page = <Paper className={classes.fixedTable}>
            {createCoinModal}
            {mintModal}
            {sendReceiveModal}
            <CoinTable drizzle={props.drizzle} drizzleState={props.drizzleState} setCoinInstance={setCoinInstance}
                      sendReceiveModalOpen={sendReceiveModalOpen} setSendReceiveModal={setSendReceiveModal} />
          </Paper>;
    sideBarIcon = <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
              >
                <AccountBalanceIcon />
              </IconButton>;
    sideBar = <CoinFactory drizzle={props.drizzle} drizzleState={props.drizzleState} classes={classes} open={open} handleDrawerClose={handleDrawerClose}
                            createCoinModalOpen={createCoinModalOpen} setCreateCoinModal={setCreateCoinModal}
                            mintModalOpen={mintModalOpen} setMintModal={setMintModal}
                            mintAddress={mintAddress} setMintAddress={setMintAddress}
                            />
  } else if(Nav===1){
    page = <Paper className={classes.fixedTable}>
                <UserPortfolio drizzle={props.drizzle} drizzleState={props.drizzleState} setCoinInstance={setCoinInstance}
                          sendReceiveModalOpen={sendReceiveModalOpen} setSendReceiveModal={setSendReceiveModal} />
            </Paper>;
  } else{
    page = null;
  }
  
  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="absolute" className={clsx(classes.appBar, open && classes.appBarShift)}>
        <Toolbar className={classes.toolbar}>
          {sideBarIcon}
          <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
            <Tabs style={{float:'right', paddingRight:'40%'}}
              value={Nav}
              onChange={handleNav}
              indicatorColor="secondary"
              textColor="white"
              centered>
              <Tab label="My Coins" />
              <Tab label="Market" />
              <Tab label="Lending" />
            </Tabs>
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

          {/* COIN FACTORY COMPONENT*/}
          {sideBar}

      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>


          {/*MAIN CONTENT */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8} lg={12}>
              {page}
            </Grid>


          
            {/* Recent Deposits 
            <Grid item xs={12} md={4} lg={3}>
              <Paper className={fixedHeightPaper}>
              </Paper>
            </Grid>
            */}


            {/* Recent Orders 
            <Grid item xs={12}>
              <Paper className={classes.paper}>
              </Paper>
            </Grid>
            */}
          </Grid>
          <Box pt={4}>
            <Copyright />
          </Box>
        </Container>
      </main>
    </div>
  );
}
