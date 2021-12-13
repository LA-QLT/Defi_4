import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
// import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
// import Table from 'react-bootstrap/Table';
import Staking from "./contracts/Staking.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    contract: null, 
    value:null,
    TVL:null,
    PriceBtc:null,
    PriceEth: null,
    NbReward:null
    };

  componentWillMount = async () => {
    try {
      // Récupérer le provider web3
      const web3 = await getWeb3();
  
      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas) 
      const accounts = await web3.eth.getAccounts();

      // Récupérer l’instance du smart contract “Whitelist” avec web3 et les informations du déploiement du fichier (client/src/contracts/Whitelist.json)
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Staking.networks[networkId];
  
      const instance = new web3.eth.Contract(
        Staking.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runInit);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`,
      );
      console.error(error);
    }
  };

  runInit = async() => {
    const {accounts, contract } = this.state;
    const Stake = await contract.methods.balances(accounts[0]).call();  
    const tvl= await contract.methods.tvl().call();
    const priceBtc= await contract.methods.VoirPrix("0x2431452A0010a43878bF198e170F6319Af6d27F4").call();
    const priceUsdEth= await contract.methods.VoirPrix("0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf").call();
    const reward= await contract.methods.RewardUnpaid(accounts[0]).call();



    
    this.setState({ value: Stake, tvl: tvl,PriceBtc:priceBtc*0.00000001,PriceEth:priceUsdEth*0.000000000000000001,NbReward:reward});
   

    window.ethereum.on('accountsChanged', () => this.CompteMetamaskModifier());

    contract.events.Depot({},(err,event)=>{
    
    });
    contract.events.Depot({},(err,event)=>{
      this.InitValueStake(event);
    });
    contract.events.Whithdraw({},(err,event)=>{
      this.InitValueStake(event);
    });

    contract.events.AmountReward({},(err,event)=>{
      this.ReloadReward(event);
    });
  }; 

  CompteMetamaskModifier = async() => {
    const { web3,contract,accounts } = this.state;
    const reloadedAccounts = await web3.eth.getAccounts();
    const Value = await contract.methods.balances(reloadedAccounts[0]).call();  
    const Reward= await contract.methods.TotalReward(accounts[0]).call();
    this.setState({ accounts: reloadedAccounts, value: Value,NbReward:Reward});
  }

  
  InitValueStake = async (event) => {
    const {accounts, contract } = this.state;
    const Stake = await contract.methods.balances(accounts[0]).call();  
    const tvl= await contract.methods.tvl().call();
    this.setState({ value: Stake, tvl: tvl});

  }
  Claim = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.ClaimAllReward().send({from: accounts[0]});
  
  }
  Deposer = async () => {
    const { accounts, contract } = this.state;
    const valeur = this.valeur.value;
    await contract.methods.stake("0x87d5253e8f499ac1a957264acbd36a3109b9d26d",valeur).send({from: accounts[0]});
    
  }

  Retirer = async () => {
    const { accounts, contract } = this.state;
    const valeur = this.valeur.value;
    await contract.methods.withdrawPayments("0x87d5253e8f499ac1a957264acbd36a3109b9d26d",valeur).send({from: accounts[0]});
  }

  Reload = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.reward(accounts[0]).send({from: accounts[0]});
    const RewardTotal= await contract.methods.RewardUnpaid(accounts[0]).call();
    this.setState({NbReward:RewardTotal});
  }
  ReloadReward = async () => {
    const { accounts, contract } = this.state;
    const RewardTotal= await contract.methods.RewardUnpaid(accounts[0]).call();
    this.setState({NbReward:RewardTotal});
  }


 

  render() {
    const {value,tvl ,PriceEth,NbReward} = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div className="App">
        <div>
            <h2 className="text-center">Staking RENDEMENT</h2>
            <hr></hr>
            <br></br>
        </div>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Staking UST</strong></Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                    <tbody>
                    <tr>TVL:
                      <td><p>{tvl} UST</p></td>
                    </tr>
                    <tr>Stake:
                      <td><p>{value} UST</p></td>
                      <td><p>{value*PriceEth} ETH</p></td>
                    </tr>
                    <tr>Profit:
                      <td><p>{NbReward} PureToken</p></td>
                      <td> <button onClick={this.Claim}  variant="dark">  Claim  </button>   </td>
                      <td> <button onClick={this.Reload} variant="dark">  Reload  </button>   </td>
                    </tr>
                    <tr>  
                    <td>  
                      <Form.Control type="text" id="valeur"
                      ref={(input) => { this.valeur = input }}
                      />   
                    </td>   
                      <td>
                        <button onClick={this.Deposer}  variant="dark">STAKE </button>     
                      </td>
                      <td>
                        <button onClick={this.Retirer}  variant="dark">UNSTAKE </button>     
                      </td>
                    </tr>
                    </tbody>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
            <Card.Footer>
                  
            </Card.Footer >  
          </Card>
        </div>
        <br></br>
        
      </div>
    );
  }
}

export default App;