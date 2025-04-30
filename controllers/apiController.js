import Ticket from "../models/ticketModel.js";
import Customer from "../models/customerModel.js";

// Tüm ticketları ve customerları JSON formatında getir
const getAllData = async (req, res) => {
    try {
        // Tüm ticketları al
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });
        
        // Tüm müşterileri al
        const customers = await Customer.find({});
        
        // Verileri birleştir ve JSON olarak dön
        res.status(200).json({
            succeeded: true,
            data: {
                tickets,
                customers
            }
        });
    } catch (error) {
        console.error("Veri getirme hatası:", error);
        res.status(500).json({
            succeeded: false,
            error: "Veriler alınırken bir hata oluştu"
        });
    }
};

// Sadece ticketları getir
const getTicketsData = async (req, res) => {
    try {
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });
        
        res.status(200).json({
            succeeded: true,
            tickets
        });
    } catch (error) {
        console.error("Ticket veri getirme hatası:", error);
        res.status(500).json({
            succeeded: false,
            error: "Ticket verileri alınırken bir hata oluştu"
        });
    }
};

// Sadece müşterileri getir
const getCustomersData = async (req, res) => {
    try {
        const customers = await Customer.find({});
        
        res.status(200).json({
            succeeded: true,
            customers
        });
    } catch (error) {
        console.error("Müşteri veri getirme hatası:", error);
        res.status(500).json({
            succeeded: false,
            error: "Müşteri verileri alınırken bir hata oluştu"
        });
    }
};

const createTicket = async (req, res) => {
    try {
        console.log("✅ createTicket fonksiyonu tetiklendi");
        console.log("Request body:", JSON.stringify(req.body));
        console.log("Customer from middleware:", req.customer ? req.customer._id : "Müşteri yok");
        
        // Kullanıcı middleware'den geldiyse
        if (!req.customer) {
            return res.status(404).json({ succeeded: false, error: "Müşteri bulunamadı" });
        }

        // Request body'den direkt değerleri al
        const { title, department, description, priority, category } = req.body;
        
        // Yeni ticket objesi oluştur
        const newTicket = new Ticket({
            user: {
                name: req.customer.user.name,
                email: req.customer.user.email
            },
            ticket: {
                title,
                department,
                description,
                priority,
                category
            },
            customers: [req.customer._id]
        });
        
        const savedTicket = await newTicket.save();
        
        res.status(201).json({ 
            succeeded: true, 
            message: "Ticket başarıyla oluşturuldu",
            ticketId: savedTicket._id
        });

    } catch (error) {
        console.error("Ticket oluşturma hatası:", error);
        res.status(500).json({ 
            succeeded: false, 
            error: "Ticket oluşturulurken bir hata oluştu",
            details: error.message 
        });
    }
};

// Ticket silme (DELETE ile)
const deleteTicketById = async (req, res) => {
    const ticketId = req.params.id;

    try {
        const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

        if (!deletedTicket) {
            return res.status(404).json({ succeeded: false, error: "Silinecek ticket bulunamadı" });
        }

        // Customer'lardan da bu ticket ID'yi sil
        await Customer.updateMany(
            { tickets: ticketId },
            { $pull: { tickets: ticketId } }
        );

        res.status(200).json({ 
            succeeded: true,
            message: "Ticket başarıyla silindi",
            deletedTicket: {
                id: deletedTicket._id,
                title: deletedTicket.ticket.title,
                description: deletedTicket.ticket.description,
                department: deletedTicket.ticket.department,
                priority: deletedTicket.ticket.priority,
                category: deletedTicket.ticket.category,
                createdAt: deletedTicket.createdAt,
                updatedAt: deletedTicket.updatedAt
            }
        });
    } catch (error) {
        console.error("Ticket silme hatası:", error);
        res.status(500).json({ 
            succeeded: false,
            error: "Ticket silinirken bir hata oluştu",
            details: error.message
        });
    }
};

export { getAllData, getTicketsData, getCustomersData, createTicket, deleteTicketById };