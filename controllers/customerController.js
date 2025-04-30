import Customer from "../models/customerModel.js";
import Ticket from "../models/ticketModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Yeni müşteri oluşturma
const createCustomer = async (req, res) => {
    try {
        const newCustomer = new Customer({
            user: {
                name: req.body.name,
                password: req.body.password,
                email: req.body.email,
                company: req.body.company,
                department: req.body.department,
            }
        });
        const customer = await newCustomer.save();
        res.status(201).json({ succeeded: true, customer });
    } catch (error) {
        console.error("Müşteri oluşturma hatası:", error);
        res.status(500).json({ succeeded: false, error: "Bir hata oluştu!" });
    }
};

const createToken = (customer_id) => {
    return jwt.sign({ customerId: customer_id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

const loginCustomer = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const customer = await Customer.findOne({ 'user.name': username });
        
        if (!customer) {
            console.log("Kullanıcı bulunamadı!");
            return res.status(401).json({ 
                succeeded: false, 
                error: "There is no such customer" 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, customer.user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                succeeded: false, 
                error: "Passwords do not match." 
            });
        }

        const token = createToken(customer._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 1000 * 60 * 60 * 24,
            secure: process.env.NODE_ENV === 'production'
        });

        // customer-login sayfasına yönlendirme yapılıyor
        
        res.redirect('/customer-login');

    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ 
            succeeded: false, 
            error: "Server error" 
        });
    }
};

// Tüm müşterileri ve biletlerini getirme
const getAllCustomers = async (req, res) => {
    try {
        const { departments, companies } = await getDepartmentsAndCompanies();
        const customers = await Customer.find({});
        
        const customersWithTickets = await Promise.all(customers.map(async (customer) => {
            const tickets = await Ticket.find({ "user.email": customer.user.email });
            return { customer, tickets };
        }));
        
        res.render("customers", { customersWithTickets, departments, companies, sortOptions: ["name_asc", "name_desc", "date_asc", "date_desc"] });
    } catch (error) {
        console.error("Tüm müşterileri getirme hatası:", error);
        res.status(500).json({ succeeded: false, error: "Server error" });
    }
};

// En son eklenen müşterileri getirme
const getRecentCustomers = async () => {
    try {
        return await Customer.find().sort({ _id: -1 });
    } catch (error) {
        console.error("Son müşterileri getirme hatası:", error);
        return [];
    }
};

const getFilteredCustomers = async (req, res) => {
    try {
        // Parametreleri al
        const departmentFilters = req.query.department ? req.query.department.split(',') : [];
        const companyFilters = req.query.company ? req.query.company.split(',') : [];
        const filterType = req.query.filterType;
        const sort = req.query.sort || 'date_desc';
       const { departments, companies } = await getDepartmentsAndCompanies();
       let filter = {
            $or: []
        };
        // Departman filtresi (birden fazla seçilebilir)
        if (departmentFilters.length) {
           filter.$or.push({ 'user.department': { $in: departmentFilters } });
        }
        if (companyFilters.length) {
            filter.$or.push({ 'user.company': { $in: companyFilters } });
        }
        if (filter.$or.length === 0) {
            delete filter.$or; // Hiç filtre yoksa tüm kayıtlar gelsin
        }

        if (filterType) {
            const now = new Date();
            const dateFilter = {};
       
            switch(filterType) {
                case 'last_hour':
                    dateFilter.$gte = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case 'today':
                    const todayStart = new Date();
                    todayStart.setHours(0,0,0,0);
                    dateFilter.$gte = todayStart;
                    break;
                case 'this_week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    weekStart.setHours(0,0,0,0);
                    dateFilter.$gte = weekStart;
                    break;
                case 'this_month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFilter.$gte = monthStart;
                    break;
                case 'this_year':
                    const yearStart = new Date(now.getFullYear(), 0, 1);
                    dateFilter.$gte = yearStart;
                    break;
           }
        
          filter['user.createdAt'] = dateFilter;
        }

        // Varsayılan sıralama (son eklenenler en üstte)
        let sortOption = {};        
        switch(sort) {
            case 'name_asc':
                sortOption = { 'user.name': 1 };
                break;
            case 'name_desc':
                sortOption = { 'user.name': -1 };
                break;
            case 'date_asc':
               sortOption = { 'user.createdAt': 1 }; // Eski -> Yeni
                break;
            case 'date_desc':
               default:
                sortOption = { 'user.createdAt': -1 }; // Yeni -> Eski
        }

        console.log('Final Filter:', filter);
        console.log('Sort Option:', sortOption);

        const customers = await Customer.find(filter).sort(sortOption);

        const tickets = await Ticket.find();
        // Müşterileri ve biletleri birleştir
        const customersWithTickets = customers.map(customer => {
            const userEmail = customer.user.email;
            const userTickets = tickets.filter(ticket => ticket.user.email === userEmail);
            return {
                customer,
                tickets: userTickets
           };
        });
        // Eğer sonuç yoksa, detaylı mesaj
        if (customersWithTickets.length === 0) {
            let errorMessage = "Seçtiğiniz filtrelerle eşleşen müşteri bulunamadı.";
            if (departmentFilters.length && companyFilters.length) {
                errorMessage = `${departmentFilters.join(', ')} departman(lar)ından VE ${companyFilters.join(', ')} şirket(ler)inden müşteri bulunamadı.`;
            } else if (departmentFilters.length) {
                errorMessage = `${departmentFilters.join(', ')} departman(lar)ından müşteri bulunamadı.`;
            } else if (companyFilters.length) {
                errorMessage = `${companyFilters.join(', ')} şirket(ler)inden müşteri bulunamadı.`;
            }
            res.render('customers', {
                customersWithTickets: [],
                departments,
                companies,
                sortOptions: ["name_asc", "name_desc", "date_asc", "date_desc"],
                activeFilters: {
                    department: departmentFilters,
                    company: companyFilters,
                    filterType: filterType ? [filterType] : [],
                    sort: [sort]
                },
                errorMessage
            });
        } else {
            res.render('customers', {
                customersWithTickets,
                departments,
                companies,
                sortOptions: ["name_asc", "name_desc", "date_asc", "date_desc"],
                activeFilters: {
                    department: departmentFilters,
                    company: companyFilters,
                    filterType: filterType ? [filterType] : [],
                    sort: [sort]
                }
            });
        }
    } catch (error) {
       console.error("Filtreleme hatası:", error);
        res.status(500).json({
           succeeded: false,
            error: "Filtreleme sırasında bir hata oluştu!"
        });
    }
};

// Departman ve şirket bilgilerini getirme
const getDepartmentsAndCompanies = async () => {
    return {
        departments: await Customer.distinct("user.department"),
        companies: await Customer.distinct("user.company")
    };
};

// Belirli bir müşteriyi ID ile getirme
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) throw new Error("Müşteri bulunamadı");
        
        const tickets = await Ticket.find({ "user.email": customer.user.email });
        res.render("customers", {
            customersWithTickets: [{ customer, tickets }],
            departments: await Customer.distinct("user.department"),
            companies: await Customer.distinct("user.company"),
            sortOptions: ["name_asc", "name_desc", "date_asc", "date_desc"]
        });
    } catch (error) {
        console.error("Müşteri ID ile getirme hatası:", error);
        res.render("customers", {
            customersWithTickets: [],
            departments: await Customer.distinct("user.department"),
            companies: await Customer.distinct("user.company"),
            sortOptions: ["name_asc", "name_desc", "date_asc", "date_desc"],
            errorMessage: "Müşteri bulunamadı"
        });
    }
};

// Müşteri silme işlemi
const deleteCustomer = async (req, res) => {
    try {
        const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
        if (!deletedCustomer) return res.status(404).json({ succeeded: false, error: "Müşteri bulunamadı!" });
        
        await Ticket.deleteMany({ "user.email": deletedCustomer.user.email });
        res.status(200).json({ succeeded: true, message: "Müşteri başarıyla silindi!" });
    } catch (error) {
        console.error("Müşteri silme hatası:", error);
        res.status(500).json({ succeeded: false, error: "Silme işlemi sırasında bir hata oluştu!" });
    }
};

export { createCustomer, loginCustomer , createToken, getAllCustomers , getRecentCustomers, getFilteredCustomers, getDepartmentsAndCompanies, getCustomerById, deleteCustomer };
