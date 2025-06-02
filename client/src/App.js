import React, { Component } from "react";
import Web3 from "web3";
import ItemManager from "./contracts/ItemManager.json";

class App extends Component {
  state = {
    loaded: false,
    cost: 0,
    itemName: "",
    itemManager: null,
    accounts: [],
    lastItemName: "",       // <-- New
    lastTransactionHash: "" // <-- New
  };

  componentDidMount = async () => {
    try {
      let web3;

      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
      }

      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ItemManager.networks[networkId];

      if (!deployedNetwork) {
        console.error("ItemManager not deployed to detected network.");
        return;
      }

      const itemManager = new web3.eth.Contract(
        ItemManager.abi,
        deployedNetwork.address
      );

      console.log("Contract Address:", deployedNetwork.address);
      this.setState({ loaded: true, itemManager, accounts });
    } catch (error) {
      alert("Failed to load web3 or contracts.");
      console.error(error);
    }
  };

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.name === "cost" ? parseInt(target.value) : target.value;
    this.setState({
      [target.name]: value
    });
  };

  handleSubmit = async () => {
    const { itemManager, accounts, itemName, cost } = this.state;
    try {
      const result = await itemManager.methods
        .createItem(itemName, cost)
        .send({ from: accounts[0] });

      const txHash = result.transactionHash;

      // Update state with last transaction info
      this.setState({
        lastItemName: itemName,
        lastTransactionHash: txHash
      });

      alert(`Item "${itemName}" created successfully.\nTransaction Hash: ${txHash}`);
    } catch (err) {
      console.error(err);
      alert("Transaction failed.");
    }
  };

  render() {
    const { loaded, itemName, cost, lastItemName, lastTransactionHash } = this.state;

    if (!loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div style={{ padding: "20px" }}>
        <h1>Supply Chain Blockchain App</h1>

        <h2>Create New Item</h2>
        <label>Item Name:</label>
        <input
          type="text"
          name="itemName"
          value={itemName}
          onChange={this.handleInputChange}
        />
        <br />

        <label>Cost (in Wei):</label>
        <input
          type="number"
          name="cost"
          value={cost}
          onChange={this.handleInputChange}
        />
        <br />

        <button onClick={this.handleSubmit}>Create Item</button>

        {lastItemName && lastTransactionHash && (
          <div style={{ marginTop: "20px", background: "#f5f5f5", padding: "10px" }}>
            <h3>✅ Last Transaction</h3>
            <p><strong>Item:</strong> {lastItemName}</p>
            <p><strong>Transaction Hash:</strong> <code>{lastTransactionHash}</code></p>
          </div>
        )}
      </div>
    );
  }
}

export default App;
