import mongoose from 'mongoose';
import Customer from './models/customerModel.js';
import Admin from './models/adminModel.js';

const conn = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {
            dbName: 'users'
        });
        console.log('✅ Veritabanına bağlanıldı');

        // --- Varsayılan Admin oluştur ---
        const defaultAdmin = {
            username: "admin",
            password: "admin123"
        };

        let admin = await Admin.findOne({ username: defaultAdmin.username });
        if (!admin) {
            admin = new Admin(defaultAdmin);
            await admin.save();
            console.log(`👤 Admin oluşturuldu → ID: ${admin._id}, Şifre: ${defaultAdmin.password}`);
        } else {
            console.log(`✅ Admin zaten var → ID: ${admin._id}`);
        }

        // --- Varsayılan Customer oluştur ---
        const defaultCustomer = {
            user: {
                name: "Customer1",
                email: "customer1@example.com",
                password: "customer123",
                company: "Test",
                department: "Test"
            }
        };

        let customer = await Customer.findOne({ username: defaultCustomer.username });
        if (!customer) {
            customer = new Customer(defaultCustomer);
            await customer.save();
            console.log(`👥 Müşteri oluşturuldu → İsim: ${customer.user.name}, Şifre: ${defaultCustomer.user.password}`);
        } else {
            console.log(`✅ Müşteri zaten var → İsim: ${customer.user.name}`);
        }

    } catch (err) {
        console.error(`❌ DB bağlantı hatası: ${err}`);
    }
};

export default conn;
