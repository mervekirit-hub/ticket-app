import express from 'express';
import * as ticketController from "../controllers/ticketController.js";
import Ticket from "../models/ticketModel.js";

const router = express.Router();

router.route("/")

.post(ticketController.createTicket)
.get(ticketController.getAllTickets);

router.patch("/:id/status", ticketController.updateTicketStatus);

router.get('/stats', ticketController.getTicketStats);

router.get('/filter', ticketController.getFilteredTickets);

// Dosyanın sonuna ekleyin
router.get("/json", async (req, res) => {
    try {
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(
            JSON.stringify(
                {
                    succeeded: true,
                    tickets
                },
                null,
                2 // <--- bu kısım çıktıyı güzelleştiriyor
            )
        );
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error: error.message
        });
    }
});


export default router;