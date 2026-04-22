import dotenv from "dotenv";

dotenv.config();

const { ensureSchema } = await import("./config/db.js");
await ensureSchema();

const { app } = await import("./app.js");
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

