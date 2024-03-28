require('dotenv').config();
const { Client } = require("pg");
const express = require("express");

// Using DATABASE_URL from environment so that I wouldn't have to implement a separate config file for the database connection
const connectionString = process.env.DATABASE_URL || "postgres://localhost/flavors_db";
const client = new Client({
  connectionString: connectionString
});

const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/flavors", async (req, res, next) => {
  try {
    const response = await client.query('SELECT * FROM flavors;');
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const response = await client.query('SELECT * FROM flavors WHERE id = $1;', [req.params.id]);
    res.json(response.rows[0] || { error: "Flavor not found" });
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    const response = await client.query('INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *;', [req.body.name, req.body.is_favorite]);
    res.status(201).json(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    await client.query('DELETE FROM flavors WHERE id = $1;', [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const response = await client.query('UPDATE flavors SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *;', [req.body.name, req.body.is_favorite, req.params.id]);
    res.json(response.rows[0] || { error: "Flavor not found" });
  } catch (ex) {
    next(ex);
  }
});

async function initialize() {
  await client.connect();
  console.log("connected to database");

  await client.query("DROP TABLE IF EXISTS flavors");
  await client.query(`
    CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("tables created");

  await client.query(`
    INSERT INTO flavors (name, is_favorite) VALUES
      ('Vanilla', true),
      ('Chocolate', false),
      ('Strawberry', true)
  `);
  console.log("seeded data");

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

initialize();
