const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xyxb77f.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log(uri);
async function run() {
  try {
    const categoryCollection = client.db("jossCar").collection("categories");
    const carsCollection = client.db("jossCar").collection("allCars");
    const usersCollection = client.db("jossCar").collection("users");
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoryCollection.find(query).toArray();
      res.send(categories);
    });
    app.get("/allcars", async (req, res) => {
      let query = {};
      if (req.query.categoryID) {
        query = {
          categoryID: req.query.categoryID,
        };
      }
      const allcars = await carsCollection.find(query).toArray();
      res.send(allcars);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);
app.get("/", (req, res) => {
  res.send("Joss Car Server Running");
});

app.listen(port, () => {
  console.log("node running");
});
