import express from 'express';
import dotenv from 'dotenv';
import conn from './db.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit'; 
import pageRoute from "./routes/pageRoute.js";
import ticketRoute from "./routes/ticketRoute.js";
import customerRoute from "./routes/customerRoute.js";
import adminRoute from "./routes/adminRoute.js";
import apiRoute from "./routes/apiRoute.js";
import { checkCustomer, checkAdmin, authenticateAdminToken } from "./middlewares/authMiddleware.js";


dotenv.config();

// connection to the db
conn();

const app = express();
const port = process.env.PORT;

// 1. Temel Güvenlik Header'ları
app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "trusted.cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "cdn.example.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }));

app.use(helmet.xssFilter());
app.use(helmet.noSniff());

// 2. Rate Limiter (Brute-force koruma)
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 dk
  max: 100 // Her IP için 15 dakikada maksimum 100 istek
});

app.use('/user-login', limiter);
app.use('/admin-login', limiter);

// ejs template engine
app.set("view engine", "ejs");

// static files middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global middleware
app.use(checkAdmin);
app.use(checkCustomer);

// routes
app.use("/", pageRoute);
app.use("/admin", adminRoute); // Yeni eklenen

// Admin korumalı rotalar
app.use("/tickets", ticketRoute);
app.use("/customers", customerRoute);

app.use("/api", apiRoute);

app.listen(port, ()=> {
    console.log(`Application running in port: ${port}`);
});
