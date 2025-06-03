import React, { Component } from "react";
import Web3 from "web3";
import ItemManager from "./contracts/ItemManager.json";

class App extends Component {
  state = {
    loaded: false,
    itemManager: null,
    accounts: [],
    cost: 0,
    itemName: "",
    items: [],
    index: "",
    activeTab: "all",
    search: "",
    sortKey: "index",
    sortOrder: "asc",
  };

  componentDidMount = async () => {
    try {
      let web3;
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } else {
        web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
      }

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ItemManager.networks[networkId];
      const itemManager = new web3.eth.Contract(
        ItemManager.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();

      this.setState({ web3, itemManager, accounts, loaded: true }, this.loadItems);
    } catch (error) {
      alert("Web3 or contract failed to load.");
      console.error(error);
    }
  };

  loadItems = async () => {
    const { itemManager } = this.state;
    const count = await itemManager.methods.getIndex().call();
    let items = [];

    for (let i = 0; i < count; i++) {
      const item = await itemManager.methods.getItem(i).call();
      items.push({
        index: i,
        name: item[0],
        price: item[1],
        step: item[2],
        address: item[3],
      });
    }

    this.setState({ items });
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = async () => {
    const { itemManager, accounts, itemName, cost } = this.state;
    try {
      await itemManager.methods
        .createItem(itemName, parseInt(cost))
        .send({ from: accounts[0] });
      alert("✅ Item created successfully");
      this.setState({ itemName: "", cost: 0 });
      this.loadItems();
    } catch (err) {
      console.error("❌ Error in item creation:", err);
      alert("❌ Creation failed");
    }
  };

  handlePay = async (index, itemAddress, price) => {
    const { accounts, web3 } = this.state;
    try {
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: itemAddress,
        value: price,
      });
      alert("✅ Payment successful!");
      this.loadItems();
    } catch (err) {
      console.error("❌ Payment failed:", err);
      alert("❌ Payment failed");
    }
  };

  handleDeliver = async () => {
    const { index, itemManager, accounts } = this.state;
    try {
      await itemManager.methods.triggerDelivery(index).send({ from: accounts[0] });
      alert("✅ Marked as Delivered");
      this.setState({ index: "" });
      this.loadItems();
    } catch (err) {
      console.error("❌ Delivery failed:", err);
      alert("❌ Delivery failed");
    }
  };

  handleSort = (key) => {
    this.setState((prev) => ({
      sortKey: key,
      sortOrder: prev.sortKey === key && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  getStatusBadge = (step) => {
    const status = ["Created", "Paid", "Delivered"][parseInt(step)];
    const colors = ["orange", "blue", "green"];
    return (
      <span
        style={{
          color: "#fff",
          background: colors[step],
          padding: "2px 6px",
          borderRadius: "5px",
        }}
      >
        {status}
      </span>
    );
  };

  render() {
    const {
      loaded,
      itemName,
      cost,
      items,
      index,
      activeTab,
      search,
      sortKey,
      sortOrder,
    } = this.state;

    if (!loaded) return <div>Loading Web3...</div>;

    const filteredItems = items
      .filter((item) => {
        if (activeTab === "delivered") return item.step === "2";
        if (activeTab === "pending") return item.step === "0";
        return true;
      })
      .filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = sortKey === "price" ? parseInt(a[sortKey]) : a[sortKey];
        const bVal = sortKey === "price" ? parseInt(b[sortKey]) : b[sortKey];
        return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

    return (
      <div style={{ padding: "20px" }}>
        <h1>🔗 Supply Chain DApp</h1>

        <h2>Create Item</h2>
        <input
          type="text"
          name="itemName"
          placeholder="Item Name"
          value={itemName}
          onChange={this.handleInputChange}
        />
        <input
          type="number"
          name="cost"
          placeholder="Cost in Wei"
          value={cost}
          onChange={this.handleInputChange}
        />
        <button onClick={this.handleSubmit}>Create</button>

        <div style={{ marginTop: "30px", marginBottom: "10px" }}>
          <button onClick={() => this.setState({ activeTab: "all" })}>All</button>{" "}
          <button onClick={() => this.setState({ activeTab: "delivered" })}>Delivered</button>{" "}
          <button onClick={() => this.setState({ activeTab: "pending" })}>Pending</button>{" "}
          <input
            type="text"
            placeholder="🔍 Search by name"
            name="search"
            value={search}
            onChange={this.handleInputChange}
            style={{ marginLeft: "10px" }}
          />
        </div>

        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th onClick={() => this.handleSort("index")}>#</th>
              <th onClick={() => this.handleSort("name")}>Name</th>
              <th onClick={() => this.handleSort("price")}>Price (Wei)</th>
              <th>Status</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6">No items found</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.index}>
                  <td>{item.index}</td>
                  <td>{item.name}</td>
                  <td>{item.price}</td>
                  <td>{this.getStatusBadge(item.step)}</td>
                  <td>
                    <code>{item.address}</code>
                  </td>
                  <td>
                    {item.step === "0" && (
                      <button
                        onClick={() =>
                          this.handlePay(item.index, item.address, item.price)
                        }
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 style={{ marginTop: "30px" }}>Mark Item as Delivered</h2>
        <input
          type="number"
          name="index"
          placeholder="Enter Item Index"
          value={index}
          onChange={this.handleInputChange}
        />
        <button onClick={this.handleDeliver}>Deliver</button>
      </div>
    );
  }
}

export default App;
