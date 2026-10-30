require("dotenv").config();
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const express = require("express");
const cors = require("cors");
const hemlet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const app = express();

app.use(hemlet());
app.use(cors());
app.use(express.json({limit: "100kb"}));
app.use(morgan("dev"));


app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: "draft-8",
        legacyHeaders: false,
    })
);
app.get("/api/health",(req,res)=>{
    res.status(200).json({
        success:true,
        message: "E-comerce API is running",
    });
});
//routes for login, register
app.use("/api/auth",authRoutes);
//user-routes
app.use("/api/users",userRoutes);
app.use("/api/categories",categoryRoutes);
//product manager
app.use("/api/products",productRoutes);
//order routes
app.use("/api/orders",orderRoutes);
app.use(errorHandler);
const startServer = async ()=>{
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT,()=>{
        console.log(`Server running at http://localhost:${PORT}`);
    });
};

startServer();