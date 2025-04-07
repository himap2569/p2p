# Peerbit Multiclient Boilerplate Project

This project demonstrates how to use Peerbit with multiple clients that can replicate, insert, fetch, update, and delete documents. It includes an interactive CLI for running basic CRUD operations and a script to launch multiple client windows.

## Contents

- **Interactive CLI:**  
  A persistent client that remains open and accepts commands via an interactive prompt. Each client uses its own persistent directory (e.g. `./cli-data-1`, `./cli-data-2`, etc.) but shares the same fixed database ID so that they agree on the data space.

- **Multiclient Networking:**  
  Clients can connect to each other using the `dial <multiaddr>` command. Once connected, documents inserted on one client will automatically be replicated to the other.

- **Test Script:**  
  A sample shell script (`test_2_clients_v1.sh`) opens two persistent client windows, letting you simulate a distributed network on your single laptop.

## Installation

```sh
yarn install
```

## Build

```sh
yarn build
```

## Running the Interactive CLI

### Launching a Client

The interactive CLI is defined in [`src/cli-interactive.ts`](./src/cli-interactive.ts). You can launch a client with a specific identifier (e.g. client1, client2, etc.) by providing a command-line flag. For example:

- **Client 1:**

  ```sh
  yarn run cli-interactive --client1
  ```

- **Client 2:**

  ```sh
  yarn run cli-interactive --client2
  ```

Each client will open a persistent session using its own data directory (e.g. `./cli-data-1` and `./cli-data-2`) and print its multiaddresses. Use these addresses to connect the clients with the dial command as described below.

### Available Commands

Once the interactive CLI starts, you will see a prompt (`> `). The following commands are available:

- **dial \<multiaddr\>**  
  Connects the current client to another peer. For example, if Client 1 displays a multiaddr `/ip4/127.0.0.1/tcp/4002/p2p/<peerid>`, type this on Client 2’s prompt:
  ```
  dial /ip4/127.0.0.1/tcp/4002/p2p/<peerid>
  ```
  
- **insert \<text\>**  
  Inserts a new text document into the database. Example:
  ```
  insert Hello from Client1
  ```

- **fetch**  
  Retrieves and displays all documents currently stored in the database.

- **update \<index\> \<new text\>**  
  (Currently commented out in the interactive CLI; you can enable it if desired.)  
  This would update the document at the given index with the new text.

- **delete \<index\>**  
  (Currently commented out in the interactive CLI; you can enable it if desired.)  
  This would delete the document at the specified index.

- **exit**  
  Closes the client and stops the process.

### Clearing the Database

If you need to remove all data from a client’s persistent storage, simply delete that client's persistent directory. For example, to clear Client 1's data:

```sh
rm -rf ./cli-data-1
```

You could also add a custom command to your CLI to perform this operation.

## Simulating a Multiclient Network on a Single Laptop

You can simulate a network with multiple clients on one laptop. A sample shell script, [`test_2_clients_v1.sh`](./test_2_clients_v1.sh), launches two separate terminal windows—one for Client 1 and one for Client 2.

### To Use the Test Script

1. Make the script executable:

   ```sh
   chmod +x test_2_clients_v1.sh
   ```

2. Run the script:

   ```sh
   ./test_2_clients_v1.sh
   ```

The script does the following:
- Opens two terminals running the interactive CLI in persistent `start` mode (you can use `cli-interactive`).
- Waits for the clients to start up and print their multiaddresses.
- Prompts you for Client 1’s multiaddress.
- Executes a dial command to connect Client 2 to Client 1.

Once connected, you can use separate terminals (or the same interactive sessions) to run `insert` and `fetch` commands to see the replication in action.

## Additional Information

For further details on Peerbit functionality and API documentation, visit [peerbit.org](https://peerbit.org).

Happy coding!