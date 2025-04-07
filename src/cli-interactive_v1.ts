import { Peerbit } from "peerbit";
import { MyDatabase, TextDocument } from "./index.js";
import { SearchRequest } from "@peerbit/document";
import { waitFor } from "@peerbit/time";
import readline from "readline";

// Use a command-line flag to choose a persistent directory for each client.
let persistDir = "./cli-data";
if (process.argv.includes("--client1")) {
	persistDir = "./cli-data-1";
} else if (process.argv.includes("--client2")) {
	persistDir = "./cli-data-2";
}

// Using a fixed ID ensures both clients load the same database address.
const FIXED_ID = new Uint8Array(32).fill(1); // Fixed ID (all ones)

async function interactive(client: Peerbit, db: MyDatabase) {
	console.log(`Client started using directory: ${persistDir}`);
	console.log("Multiaddrs:", client.libp2p.getMultiaddrs().map((m) => m.toString()));
	console.log("Type one of the following commands:");
	console.log("  dial <multiaddr>           -- Connect to a peer");
	console.log("  insert <text>              -- Insert a document");
	console.log("  fetch                      -- Fetch all documents");
	console.log("  exit                       -- Exit and stop the client");

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "> "
	});

	rl.prompt();

	for await (const line of rl) {
		const [cmd, ...args] = line.split(" ");
		try {
			if (cmd === "dial") {
				const multiaddr = args.join(" ");
				if (!multiaddr) {
					console.log("Usage: dial <peer-multiaddr>");
				} else {
					await client.dial(multiaddr);
					console.log("Dialed peer:", multiaddr);
				}
			} else if (cmd === "insert") {
				const text = args.join(" ") || "Default document text";
				await db.documents.put(new TextDocument(text));
				console.log("Inserted document with text:", text);
			} else if (cmd === "fetch") {
				await waitFor(async () => (await db.documents.index.getSize()) > 0, { timeout: 5000 });
				const results = await db.documents.index.search(
					new SearchRequest({ query: [] }),
					{ local: true, remote: false }
				);
				console.log("Retrieved documents:");
				results.forEach((doc, index) => {
					console.log(index + 1, (doc as TextDocument).text);
				});
			} else if (cmd === "exit") {
				rl.close();
				break;
			} else {
				console.log("Unknown command.");
			}
		} catch (error) {
			console.error(error);
		}
		rl.prompt();
	}

	await client.stop();
	console.log("Client stopped. Exiting.");
}

async function run() {
	const client = await Peerbit.create({ directory: persistDir });
	const db = await client.open(new MyDatabase({ id: FIXED_ID }));
	await interactive(client, db);
}

run().catch(console.error);