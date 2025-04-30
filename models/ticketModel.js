import mongoose from 'mongoose';

const { Schema } = mongoose;

const ticketSchema = new Schema({
    user: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        }
    },
    ticket: {
        title: {
            type: String,
            required: true,
            trim: true
        },
        department: {
            type: String,
            required: true,
            enum: ["IT", "HR", "Finance", "Support", "Other"],
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        priority: {
            type: String,
            required: true,
            enum: ["Low", "Medium", "High", "Critical"],
        },
        category: {
            type: String,
            required: true,
            enum: ["Software Issue", "Hardware Issue", "Network Issue", "Other"],
        },
    },
    status: {
        type: String,
        enum: ["Open", "Processing", "Closed"],
        default: "Open"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    customers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }]
});

ticketSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

ticketSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;