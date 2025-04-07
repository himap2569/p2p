#!/bin/bash
# filepath: ./run_clients.sh

# Launch client1 in a new terminal window.
gnome-terminal -- bash -c "echo 'Starting Client1 (Persistent)'; yarn run cli start --client1; exec bash"

# Launch client2 in a new terminal window.
gnome-terminal -- bash -c "echo 'Starting Client2 (Persistent)'; yarn run cli start --client2; exec bash"

# Wait a few seconds for clients to start up and print their multiaddrs.
sleep 10

# Prompt for the multiaddr of Client1.
echo "Copy the multiaddr displayed in the Client1 window (something like /ip4/127.0.0.1/tcp/4002/p2p/<peerid>)"
read -p "Enter Client1's multiaddr: " multiaddr

# Dial from Client2 to Client1.
echo "Dialing from Client2 using multiaddr: $multiaddr"
yarn run cli dial "$multiaddr" --client2

echo "Dial command complete."
echo "Now, use separate terminals to run insert and fetch commands."
echo "For example:"
echo "  yarn run cli insert \"Hello from Client1\" --client1"
echo "  yarn run cli fetch --client2"