const mongoose = require('mongoose');
require('dotenv').config();

const Offer = require('./models/Offer');

const offersData = [
    {
        name: "Premium Frozen Combo",
        description: "Includes 12 Shami Kebabs, 12 Chicken Spring Rolls, and 12 Chicken Samosas. Perfect for tea time or sudden guests!",
        original_price: 2400,
        discounted_price: 1800,
        discount_percentage: 25,
        image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80",
        is_active: true
    },
    {
        name: "Weekend Feast Deal",
        description: "Get our signature Chicken Karahi (1kg) frozen with 12 soft naans. Heat and eat in under 10 minutes!",
        original_price: 3200,
        discounted_price: 2400,
        discount_percentage: 25,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80",
        is_active: true
    },
    {
        name: "Kids Party Special",
        description: "Pack of 20 premium Chicken Nuggets and 10 mini Cheese Pizzas. A healthy and delicious treat for kids!",
        original_price: 1800,
        discounted_price: 1350,
        discount_percentage: 25,
        image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
        is_active: true
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB cluster.");
        
        // Remove existing offers to ensure clean state
        await Offer.deleteMany({});
        console.log("Cleared old offers.");

        const seeded = await Offer.create(offersData);
        console.log(`Seeded ${seeded.length} promotional offers successfully!`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
};

seed();
