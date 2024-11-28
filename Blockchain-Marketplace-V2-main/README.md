# Truffle Marketplace V2

The simple marketplace using Truffle.

Our marketplace has a core set of functionality: 
1. Create an item (including selling it)
2. Buying an item (including payment)
3. Delivery (confirmed by buyer)

## ⚠️ This repo is outdated

**Truffle Suite is being sunset**

*Starting on December 20, 2023, Truffle and Ganache codebases will remain available as public archives. This gives developers around 90 days to migrate to **Hardhat** and other solutions.*

## How to run

### Ganache

Create a Ganache workspace and setup http endpoint at http://127.0.0.1:7545

### Truffle

*Open a new terminal and follow the steps below.*

**Step 1:** Change the current working directory to `truffle`

```bash
cd truffle
```

**Step 2:** Installs the Truffle package and any packages that it depends on

```bash
npm i
```

**Step 3:** Compile and deploy smart contracts

```bash
npx truffle migrate --network development
```

### Front-end

*Open a new terminal and follow the steps below.*

**Step 1:** Change the current working directory to `client`

```bash
cd client
```

**Step 2:** Install all packages that it depends on

```bash
npm i
```

**Step 3:** Start client

```bash
npm start
```

**Step 4:** Open web browser at http://localhost:8080

