const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bookingsCollection = client.db("jossCar").collection("bookings");
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
    app.get("/advertised", async (req, res) => {
      let query = {};
      if (req.query.isAdvertised) {
        query = {
          isAdvertised: req.query.isAdvertised,
          isAvailable: req.query.isAvailable,
        };
      }
      const advertisedCars = await carsCollection.find(query).toArray();
      res.send(advertisedCars);
    });
    app.post("/allcars", async (req, res) => {
      const carInfo = req.body;

      const result = await carsCollection.insertOne(carInfo);
      res.send(result);
    });
    app.get("/sellerproducts", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const sellerProducts = await carsCollection.find(query).toArray();
      res.send(sellerProducts);
    });
    app.get("/allsellers", async (req, res) => {
      let query = {};
      if (req.query.role) {
        query = {
          role: req.query.role,
        };
      }
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    });
    app.put("/allcars/advertise/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          isAdvertised: "yes",
        },
      };
      const result = await carsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.put("/allcars/report/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          isReported: "yes",
        },
      };
      const result = await carsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.put("/users/verify/:id", async (req, res) => {
      // const decodedEmail = req.decoded.email;
      // const query = { email: decodedEmail };
      // const user = await usersCollection.findOne(query);

      // if (user?.role !== "admin") {
      //   return res.status(403).send({ message: "forbidden access" });
      // }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          isVerified: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.delete("/users/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/allcars/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });
    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);
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
