const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  const msg = req.body.message?.text || "";
  const phone = req.body.from;

  // Logic for reply
  let reply = "Welcome to the Design Bot!";
  if (msg.toLowerCase().includes("logo")) {
    reply = "Check out our latest logos: https://yourwebsite.com/gallery/logos";
  }

  console.log(`Incoming from ${phone}: ${msg}`);
  // Normally here you’d send back through WhatsApp API (see below)

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Bot is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot live on port ${PORT}`));
