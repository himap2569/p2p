import { Peerbit } from "peerbit";
import { MyDatabase, TextDocument } from "./index.js";
import { SearchRequest } from "@peerbit/document";
import { waitFor } from "@peerbit/time";

// Use a command-line flag to choose a persistent directory for each client.
let persistDir = "./cli-data";
if (process.argv.includes("--client1")) {
	persistDir = "./cli-data-1";
} else if (process.argv.includes("--client2")) {
	persistDir = "./cli-data-2";
}

// Using a fixed ID ensures both clients load the same database address.
const FIXED_ID = new Uint8Array(32).fill(1); // Fixed ID (all ones)

async function run() {
	const command = process.argv[2];
	const client = await Peerbit.create({ directory: persistDir });
	const db = await client.open(new MyDatabase({ id: FIXED_ID }));

	if (command === "start") {
		// Start a long-running client that displays its multiaddrs for dialing.
		console.log(`Client started using directory: ${persistDir}`);
		console.log(
			"Multiaddrs:",
			client.libp2p.getMultiaddrs().map((m) => m.toString())
		);
		console.log("Press Ctrl+C to exit.");
		// Keep process running:
		await new Promise(() => { });
	} else if (command === "dial") {
		// Connect to a peer using its multiaddr.
		const multiaddr = process.argv[3];
		if (!multiaddr) {
			console.log("Usage: yarn run cli dial <peer-multiaddr> [--client1|--client2]");
		} else {
			await client.dial(multiaddr);
			console.log("Dialed peer:", multiaddr);
		}
		await client.stop();
	} else if (command === "insert") {
		// Insert a document.
		const text = process.argv.slice(3).join(" ") || "Default document text";
		await db.documents.put(new TextDocument(text));
		console.log("Inserted document with text:", text);
		await client.stop();
	} else if (command === "fetch") {
		// Wait until at least one document is indexed then fetch all.
		await waitFor(async () => (await db.documents.index.getSize()) > 0, { timeout: 5000 });
		const results = await db.documents.index.search(
			new SearchRequest({ query: [] }),
			{ local: true, remote: false }
		);
		console.log("Retrieved documents:");
		results.forEach((doc, index) => {
			console.log(index + 1, (doc as TextDocument).text);
		});
		await client.stop();
	} else {
		console.log("Usage:");
		console.log("  yarn run cli start [--client1|--client2]");
		console.log("  yarn run cli dial <peer-multiaddr> [--client1|--client2]");
		console.log("  yarn run cli insert <text> [--client1|--client2]");
		console.log("  yarn run cli fetch [--client1|--client2]");
		await client.stop();
	}
}

run().catch(console.error);