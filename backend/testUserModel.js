const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb+srv://bilal:Ej5xO4n3Qs2br854@wearables.oipbtdh.mongodb.net/?retryWrites=true&w=majority&appName=Wearables", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ Connected to DB");

    const user = await User.findOne();
    console.log("🧪 Sample user:", user);

    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection error:", err);
    process.exit(1);
  });
