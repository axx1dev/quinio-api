const MongoClient = require("mongodb").MongoClient;

let cachedDb = null;
const MONGODB_URI = process.env.MONGODBURI;

async function connectToDB() {
    if (cachedDb && cachedDb.serverConfig.isConnected()) {
      return Promise.resolve(cachedDb);
    }
  
    const client = await MongoClient.connect(MONGODB_URI);
  
    cachedDb = await client.db("quinio");
  
    //cachedDb = db;
    return cachedDb;
}

module.exports = connectToDB()