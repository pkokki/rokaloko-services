import { MongoClient, Db } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'rokaloko';

async function execute(func: (db: Db) => Promise<any>) {
    const client = new MongoClient(url);

    try {
        await client.connect();

        const db = client.db(dbName);

        const result = await func(db);

        return result;
    } catch (err) {
        console.log(err.stack);
    }

    // Close connection
    client.close();
}

export const database = {
    execute: execute
};