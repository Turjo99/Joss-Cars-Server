const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
app.use(cors());
app.use(express.json());
require("dotenv").config();
const stripe = require("stripe")(`${process.env.STRIPE_KEY}`);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xyxb77f.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log(uri);
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    const categoryCollection = client.db("jossCar").collection("categories");
    const carsCollection = client.db("jossCar").collection("allCars");
    const usersCollection = client.db("jossCar").collection("users");
    const bookingsCollection = client.db("jossCar").collection("bookings");
    const paymentCollection = client.db("jossCar").collection("payment");
    // JWT Codes
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "30d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
    //  Get Operations Starts
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
    app.get("/users", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    });
    app.get("/allsellers/reportedproduct", async (req, res) => {
      let query = {};
      if (req.query.isReported) {
        query = {
          isReported: req.query.isReported,
          isAvailable: req.query.isAvailable,
        };
      }
      const seller = await carsCollection.find(query).toArray();
      res.send(seller);
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
    app.get("/allsellers", verifyJWT, async (req, res) => {
      let query = {};
      if (req.query.role) {
        query = {
          role: req.query.role,
        };
      }
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    });
    app.get("/booking", verifyJWT, async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const mybookings = await bookingsCollection.find(query).toArray();
      res.send(mybookings);
    });
    app.get("/booking/payment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const booking = await bookingsCollection.find(query).toArray();
      res.send(booking);
    });

    //All Get Operations Ends

    //  All Post Operation Starts
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.put("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      // const id = payment.bookingId;
      const productID = payment.productID;
      const option = { upsert: true };
      const email = payment.email;
      const filter2 = { productID: productID };
      const filter1 = { _id: ObjectId(productID) };
      console.log(productID);

      const updatedDoc = {
        $set: {
          isAvailable: "no",
          transactionId: payment.transactionId,
        },
      };
      const updatedDoc2 = {
        $set: {
          isAvailable: "no",
          soldTo: email,
        },
      };

      const updatedResult = await carsCollection.updateOne(
        filter1,
        updatedDoc,
        option
      );
      const updatedResult2 = await bookingsCollection.updateMany(
        filter2,
        updatedDoc2,
        option
      );

      res.send(result);
    });
    app.post("/allcars", async (req, res) => {
      const carInfo = req.body;

      const result = await carsCollection.insertOne(carInfo);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      const query = { email: email };
      const filter = await usersCollection.findOne(query);
      if (filter) {
        return;
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
    //  All Post Operation Ends

    // All Update Operation Starts
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
    // All Update Operation Ends

    // All Delete Operation Starts
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
    app.delete("/report/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });
    // All Delete Operation Ends
  } finally {
  }
}
run().catch(console.log);
app.get("/", (req, res) => {
  res.send("Joss Car Server Running");
});
console.log(process.env.ACCESS_TOKEN);
app.listen(port, () => {
  console.log("node running");
});
