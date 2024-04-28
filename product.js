// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true }, // Add productId field
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
