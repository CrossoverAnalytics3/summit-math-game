import "./env.js";
import { app } from "./app.js";
import { today } from "./db.js";
import { pickAdapter } from "./ai/adapter.js";

const port = Number(process.env.PORT ?? 3001);
app.listen(port, process.env.SUMMIT_HOST ?? "127.0.0.1", () => console.log(`summit api on :${port}  ai=${pickAdapter().name}  today=${today()}`));
