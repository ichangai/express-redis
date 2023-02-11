const express = require("express");
const redis = require("redis");
const util = require("util");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
const axios = require("axios");

client.set = util.promisify(client.set);
client.get = util.promisify(client.get);

const app = express();

// middlewares
app.use(express.json());

// routes
app.post("/", async (req, res) => {
  const { key, value } = req.body;
  const response = await client.set(key, value);
  res.json(response);
});

app.get("/", async (req, res) => {
  const { key } = req.body;
  const response = await client.get(key);
  res.status(200).json(response);
});

app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  const cachedPost = await client.get(id);

  if (cachedPost) {
    return res.json(JSON.parse(cachedPost));
  }

  const response = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  client.set(id, JSON.stringify(response.data), "EX", 10);

  return res.status(200).json(response.data);
});

const port = 7000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
