import { Peerbit } from "peerbit";
import { MyDatabase, TextDocument } from "./index.js";
import { SearchRequest } from "@peerbit/document";
import { waitFor } from "@peerbit/time";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

// Generalize the persistent directory using a flag like --client<n>
let persistDir = "./cli-data";
const clientFlag = process.argv.find(arg => arg.startsWith("--client"));
if (clientFlag) {
	persistDir = `./cli-data-${clientFlag.replace("--client", "")}`;
}

// Using a fixed ID ensures all clients load the same database address.
const FIXED_ID = new Uint8Array(32).fill(1); // Fixed ID (all ones)

async function interactive(client: Peerbit, db: MyDatabase) {
	console.log(`Client started using directory: ${persistDir}`);
	console.log("Multiaddrs:", client.libp2p.getMultiaddrs().map((m) => m.toString()));
	console.log("Available commands:");
	console.log("  dial <multiaddr>           -- Connect to a peer");
	console.log("  insert <text>              -- Create a document");
	console.log("  fetch                      -- Read all documents");
	//console.log("  update <index> <new text>  -- Update a document at index");
	//console.log("  delete <index>             -- Delete a document by index");
	console.log("  exit                       -- Exit and stop the client");

	// Use the new promises API for readline.
	const rl = createInterface({ input, output, prompt: "> " });
	rl.prompt();

	// Helper to fetch documents.
	async function fetchDocs() {
		await waitFor(async () => (await db.documents.index.getSize()) > 0, { timeout: 5000 });
		return db.documents.index.search(new SearchRequest({ query: [] }), { local: true, remote: false });
	}

	try {
		for await (const line of rl) {
			const [cmd, ...args] = line.trim().split(" ");
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
					const results = await fetchDocs();
					if (results.length === 0) {
						console.log("No documents found.");
					} else {
						console.log("Retrieved documents:");
						results.forEach((doc, index) => {
							console.log(index + 1, (doc as TextDocument).text);
						});
					}
				} else if (cmd === "update") {
					// Usage: update <index> <new text>
					const index = parseInt(args[0]);
					if (isNaN(index)) {
						console.log("Usage: update <document-index> <new text>");
					} else {
						const results = await fetchDocs();
						if (index < 1 || index > results.length) {
							console.log("Invalid index.");
						} else {
							const newText = args.slice(1).join(" ");
							const oldDoc = results[index - 1];
							// Extract the key from the document.
							const key = (oldDoc as any).key || (oldDoc as any).__key;
							if (!key) {
								console.log("Could not determine document key.");
							} else {
								await db.documents.del(key);
								await db.documents.put(new TextDocument(newText));
								console.log(`Updated document at index ${index} with text: ${newText}`);
							}
						}
					}
				} else if (cmd === "delete") {
					// Usage: delete <index>
					const index = parseInt(args[0]);
					if (isNaN(index)) {
						console.log("Usage: delete <document-index>");
					} else {
						const results = await fetchDocs();
						if (index < 1 || index > results.length) {
							console.log("Invalid index.");
						} else {
							const doc = results[index - 1];
							const key = (doc as any).key || (doc as any).__key;
							if (!key) {
								console.log("Could not determine document key.");
							} else {
								await db.documents.del(key);
								console.log(`Deleted document at index ${index}.`);
							}
						}
					}
				} else if (cmd === "exit") {
					break;
				} else if (cmd.trim() === "") {
					// Do nothing for blank lines.
				} else {
					console.log("Unknown command.");
				}
			} catch (error) {
				console.error(error);
			}
			rl.prompt();
		}
	} finally {
		rl.close();
		await client.stop();
		console.log("Client stopped. Exiting.");
	}
}

async function run() {
	const client = await Peerbit.create({ directory: persistDir });
	const db = await client.open(new MyDatabase({ id: FIXED_ID }));
	await interactive(client, db);
}

run().catch(console.error);