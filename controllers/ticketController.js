import Ticket from "../models/ticketModel.js";

import Customer from '../models/customerModel.js';

const createTicket = async (req, res) => {

    try {

        const { name, email } = req.body;  

        

        const customer = await Customer.findOne({ 'user.email': email });

        

        if (!customer) {

            return res.status(404).json({

                succeeded: false,

                error: "Customer not found"

            });

        }

        const ticket = await Ticket.create({

            user: {

                name,

                email

            },

            ticket: req.body.ticket,  

        });



        customer.tickets.push(ticket._id);

        await customer.save();



        res.status(201).json({

            succeeded: true,

            ticket,

        });

    } catch (error) {

        console.error('Error creating ticket:', error); 



        res.status(500).json({

            succeeded: false,

            error: error.message || 'An error occurred while creating the ticket',

        });

    }

};

const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .sort({ createdAt: -1 }) 
        return tickets;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return [];
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
            
       const { id } = req.params;
       const { status } = req.body;
       const validStatuses = ["Open", "Processing", "Closed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                succeeded: false,
               error: "Invalid ticket status"
            });
        }

       const updatedTicket = await Ticket.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({
                succeeded: false,
                error: "Ticket not found"
            });
        }
       res.status(200).json({
            succeeded: true,
            ticket: updatedTicket
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error: error.message
        });    }
};

export const getTicketStats = async () => {
    try {
        const now = new Date();
     
        // Bugünün başlangıcı
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        // Tarih aralıkları
        const tenDaysAgo = new Date(now);
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
       
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Tüm istatistikleri tek bir sorguda topla
        const stats = await Promise.all([
            // Bugün oluşturulan ticketlar (createdAt kullanıyoruz)
            Ticket.countDocuments({ 
                createdAt: { $gte: todayStart } 
            }),
      
           // Processing durumundaki ticketlar
            Ticket.countDocuments({ 
                status: "Processing" 
            }),
            
            // Son 10 günde oluşturulan ticketlar
            Ticket.countDocuments({ 
                createdAt: { $gte: tenDaysAgo } 
            }),
            
            // Son 30 günde oluşturulan ticketlar
            Ticket.countDocuments({ 
                createdAt: { $gte: thirtyDaysAgo } 
            }),
          
            // Bugün CLOSED durumuna güncellenen ticketlar (updatedAt kullanıyoruz)
            Ticket.countDocuments({ 
                status: "Closed",
                updatedAt: { 
                   $gte: todayStart,
                   $lte: now 
                } 
            }),
         
            // Son 3 günde CLOSED durumuna güncellenen ticketlar
            Ticket.countDocuments({ 
                status: "Closed",
                updatedAt: { 
                    $gte: threeDaysAgo,
                    $lte: now 
                } 
            }),
           
            // Son 10 günde CLOSED durumuna güncellenen ticketlar
            Ticket.countDocuments({ 
                status: "Closed",
                updatedAt: { 
                    $gte: tenDaysAgo,
                    $lte: now 
                } 
            }),
          
            // Son 30 günde CLOSED durumuna güncellenen ticketlar
            Ticket.countDocuments({ 
                status: "Closed",
                updatedAt: { 
                    $gte: thirtyDaysAgo,
                    $lte: now 
                } 
            })
        ]);
        return {
            todaysTickets: stats[0],
            inProgressTickets: stats[1],
            last10DaysTickets: stats[2],
            last30DaysTickets: stats[3],
            todaysCompletedTickets: stats[4],
            last3DaysCompletedTickets: stats[5],
            last10DaysCompletedTickets: stats[6],
            last30DaysCompletedTickets: stats[7]
       };
    } catch (error) {
        console.error('Error getting ticket stats:', error);
        return {
            todaysTickets: 0,
            inProgressTickets: 0,
            last10DaysTickets: 0,
            last30DaysTickets: 0,
            todaysCompletedTickets: 0,
            last3DaysCompletedTickets: 0,
            last10DaysCompletedTickets: 0,
            last30DaysCompletedTickets: 0
        };
    }
};

export const getFilteredTickets = async (req, res) => {
    try {
        const { 
            id, 
            status, 
            dateSort, 
            name, 
            email, 
            title, 
            department, 
            priority, 
            category 
        } = req.query;

        // Filtre objesini oluştur
        const filter = {};
      
        if (id) {
            filter._id = { $regex: id, $options: 'i' };
        }
        
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            filter.status = { $in: statusArray };
        }
       
        if (name) {
           filter['user.name'] = { $regex: name, $options: 'i' };
       }
       
        if (email) {
            filter['user.email'] = { $regex: email, $options: 'i' };
       }
       
        if (title) {
            filter['ticket.title'] = { $regex: title, $options: 'i' };
        }
      
        if (department) {
            const deptArray = Array.isArray(department) ? department : [department];
            filter['ticket.department'] = { $in: deptArray };
        }
      
       if (priority) {
            const priorityArray = Array.isArray(priority) ? priority : [priority];
            filter['ticket.priority'] = { $in: priorityArray };
       }
      
        if (category) {
           const categoryArray = Array.isArray(category) ? category : [category];
           filter['ticket.category'] = { $in: categoryArray };
        }
        // Sıralama ayarları
        let sortOption = {};
        if (dateSort === 'newest') {
            sortOption = { createdAt: -1 };
        } else if (dateSort === 'oldest') {
            sortOption = { createdAt: 1 };
        }
        const tickets = await Ticket.find(filter).sort(sortOption);
      
        res.status(200).json({
            succeeded: true,
            tickets
        });
    } catch (error) {
        res.status(500).json({
            succeeded: false,
            error: error.message
        });
    }
};

export { createTicket , getAllTickets };