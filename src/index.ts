import "dotenv/config";
import app from "./app";
import { startExpiredPointsCron } from "./services/cron.service";  

const PORT = Number(process.env.PORT) || 8000;

// cron job untuk expired points
startExpiredPointsCron(); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});