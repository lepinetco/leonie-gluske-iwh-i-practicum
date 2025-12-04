require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");
const { title } = require("process");
const app = express();

const PORT = process.env.port || 3000;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE_ID = process.env.CUSTOM_OBJECT_TYPE_ID;

app.set("view engine", "pug");
app.use(express.static(__dirname + "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const hs = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
});

app.get("/", async (req, res) => {
  try {
    const properties = ["book_title", "book_description", "book_author"];
    const limit = 20;

    const { data } = await hs.post(`/crm/v3/objects/${OBJECT_TYPE_ID}/search`, {
      properties,
      limit,
      sorts: [{ propertyName: "hs_createmate", direction: "DESCENDING" }],
    });

    const rows = (data.results || []).map((r) => ({
      id: r.id,
      ...r.properties,
    }));
    res.render("homepage", { title: "Team", rows, properties });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to load records");
  }
});

app.get("/update-team", (req, res) => {
  res.render("update", {
    title: "Update Team Information",
  });
});

app.post("/update-team", async (req, res) => {
  try {
    const { member_id, member_name, member_designation, member_details } = req.body;

    await hs.post(`crm/v3/objects/${OBJECT_TYPE_ID}`, {
      properties: {
        member_id,
        member_name,
        member_designation,
        member_details,
      },
    });
    res.render("/");
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to Create Record");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
