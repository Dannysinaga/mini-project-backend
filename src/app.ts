import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes"; 
import eventRoutes from "./routes/event.routes";
import transactionRoutes from "./routes/transaction.routes";       
import pointsRoutes from "./routes/points.routes";
import dashboardRoutes from "./routes/dashboard.routes";    

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);  
app.use("/events", eventRoutes);
app.use("/transactions", transactionRoutes);                      
app.use("/points", pointsRoutes);
app.use("/dashboard", dashboardRoutes);                   

export default app;