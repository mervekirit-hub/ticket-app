import express from 'express';
import * as apiController from "../controllers/apiController.js";
import { authenticateAnyTokenAPI } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tüm verileri getiren endpoint
router.get("/all", authenticateAnyTokenAPI, apiController.getAllData);

// Sadece ticketları getiren endpoint
router.get("/tickets", authenticateAnyTokenAPI, apiController.getTicketsData);

// Sadece müşterileri getiren endpoint
router.get("/customers", authenticateAnyTokenAPI, apiController.getCustomersData);

// Yeni: Ticket oluşturma
router.post("/tickets", authenticateAnyTokenAPI, apiController.createTicket);

router.delete("/tickets/:id", authenticateAnyTokenAPI, apiController.deleteTicketById);

export default router;