import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const customerSchema = new Schema({

    user: {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength:8,
            maxlenght:30,
            // select: false,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        company: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],
});

customerSchema.virtual('createdAtValue').get(function() {
    return this.user.createdAt;
});

// Sıralama için virtual alanı enable et
customerSchema.set('toObject', { virtuals: true });
customerSchema.set('toJSON', { virtuals: true });

customerSchema.pre('save', function(next) {
    const customer = this;
    // Sadece şifre değiştiyse hash'le
    if (customer.isModified('user.password')) {
        bcrypt.hash(customer.user.password, 10, (err, hash) => {
            if (err) return next(err);
            customer.user.password = hash;
            next();
        });
    } else {
        next(); // Şifre değişmediyse atla
    }
});
const Customer = mongoose.model('Customer', customerSchema);

export default Customer;