const readline = require("readline");
var fs = require("fs");
require("dotenv").config();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const { MongoClient, Decimal128 } = require("mongodb");
// Connection URI
const uri = process.env.MONGODB_HOST;
// Create a new MongoClient
const client = new MongoClient(uri);
async function run() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_HOST);

    const database = client.db("harmony");
    const channels = database.collection("channels");
    const messages = database.collection("messages");

    rl.question("Server ID to import?", function (id) {
      var files = fs.readdirSync("./import/");
      files.forEach(async (file) => {
        if (file.endsWith(".json")) {
          let rawdata = fs.readFileSync(`./import/${file}`);
          let channel = JSON.parse(rawdata);
          console.log(`Importing channel ${channel.channel.name}...`);
          let channelId = parseInt(channel.channel.id);
          try {
            await channels.insertOne({
              _id: parseInt(channel.channel.id),
              name: channel.channel.name,
              server: parseInt(id),
            });
          } catch { }
          let messagesFormated = [];
          channel.messages.forEach((message, index) => {
            let id = (((BigInt(message.id) >> BigInt(22))+BigInt(1420070400000)-BigInt(1577836800000)) << BigInt(22));
            id = id ^ (BigInt(message.id) & BigInt(Math.pow(2, 22)));
            id = id | BigInt(index);
            messagesFormated.push({
              _id: Decimal128.fromString(id.toString()),
              channel: channelId,
              fromDiscord: true,
              createdAt: message.timestamp,
              updatedAt: message.timestampEdited,
              owner: parseInt(message.author.id),
              author: `${message.author.name}#${message.author.discriminator}`,
              attachments: message.attachments,
              content: message.content,
            });
          });
          try {
            await messages.insertMany(messagesFormated);
          } catch(e) { console.error(e); }
          console.log(`Imported channel ${channel.channel.name}`);
        }
      });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
