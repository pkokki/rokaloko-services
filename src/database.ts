import { MongoClient, Db } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'rokaloko';

const client = new MongoClient(url, { useNewUrlParser: true });

async function connect() : Promise<void> {
    await client.connect();

    dbClient.db = client.db(dbName);
}

export const dbClient = {
    connect: connect,
    db: null
};