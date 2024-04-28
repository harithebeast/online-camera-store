// Import required modules
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./product');

// Create Express app
const app = express();
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static('public'));

app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use('/app1.js', express.static(path.join(__dirname, 'app1.js')));

app.use(express.static(path.join(__dirname, 'public')));


// Serve product.json statically
app.use('/product.json', express.static(path.join(__dirname, 'product.json')));

// Serve index.js statically
app.use('/index.css', express.static(path.join(__dirname, 'index.css')));

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/your_database_name');

// Define User schema
const userSchema = new mongoose.Schema({
    name: String,
    mobileNumber: String,
    username: String,
    email: String,
    password: String,
    
});



const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/index.html');
    } else {
        res.sendFile(__dirname + '/index.html');
    }
});

app.post('/signup', async (req, res) => {
    const { name, mobileNumber, username, email, password } = req.body;
    try {
        const user = await User.create({ name, mobileNumber, username, email, password });
        
        // Automatically log in the user after signing up
        req.session.userId = user._id;

        // Redirect the user to their account or dashboard page
        res.redirect('/index.html');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating user');
    }
});

app.get('/user/cart', async (req, res) => {
    const userId = req.session.userId; // Assuming you have stored the user ID in the session
    const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
    const cartCookie = cookies.find(cookie => cookie.startsWith(`${userId}_cart=`));
    let cartItems = [];
    if (cartCookie) {
        cartItems = JSON.parse(cartCookie.split('=')[1]);
    }
    res.json(cartItems);
});



app.post('/user/cart/add/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        // Fetch product details from the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Retrieve user ID from the session
        const userId = req.session.userId;

        // Retrieve cart items from cookies
        const cookies = req.headers.cookie.split(';').map(cookie => cookie.trim());
        const cartCookie = cookies.find(cookie => cookie.startsWith(`${userId}_cart=`));
        let cartItems = [];
        if (cartCookie) {
            cartItems = JSON.parse(cartCookie.split('=')[1]);
        }

        // Check if the product is already in the cart
        const existingItemIndex = cartItems.findIndex(item => item.id === productId);

        if (existingItemIndex !== -1) {
            // If the product is already in the cart, increase its quantity
            cartItems[existingItemIndex].quantity++;
        } else {
            // If the product is not in the cart, add it with a default quantity of 1
            cartItems.push({
                id: product._id,
                title: product.title,
                price: product.price,
                quantity: 1 // Default quantity is 1
            });
        }

        // Update the cart items in cookies
        res.cookie(`${userId}_cart`, JSON.stringify(cartItems), { maxAge: 3600000, httpOnly: true });

        res.send('Product added to cart successfully!');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).send('Error adding product to cart');
    }
});



app.get('/products.json', (req, res) => {
    // Assuming 'products.json' is located in the 'public' directory
    res.sendFile(path.join(__dirname,  'products.json'));
});
app.get('/signup.html', (req, res) => {
    // Assuming 'products.json' is located in the 'public' directory
    res.sendFile(path.join(__dirname,  'signup.html'));
});
app.get('/buynow.html', (req, res) => {
    // Assuming 'products.json' is located in the 'public' directory
    res.sendFile(path.join(__dirname,  'buynow.html'));
});

app.post('/signup', async (req, res) => {
    const { name, mobileNumber, username, email, password } = req.body;
    try {
        const user = await User.create({ name, mobileNumber, username, email, password });
        
        // Automatically log in the user after signing up
        req.session.userId = user._id;
        req.session.username = user.name;
        // Display success message
        res.send('Signup successful!');

        // Redirect the user to the home page
        res.redirect('/index.html');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.session.userId = user._id; 
            req.session.username = user.name;
            res.status(200).json({ loggedIn: true, userId: user._id, username: user.username });
       
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
});



app.get('/check-login', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({ loggedIn: true, userId: req.session.userId, username: req.session.username });
    } else {
        res.status(200).json({ loggedIn: false });
    }
});



app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/login.html'); // Redirect to login page after logout
        }
    });
});

app.get('/login.html', (req, res) => {
    if (req.session.userId) {
        res.redirect('/login.html');
    } else {
        res.sendFile(__dirname + '/login.html');
    }
});

const fs = require('fs');


app.get('/products', (req, res) => {
    try {
        const productsPath = path.join(__dirname, './products.json');
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});



app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

// Route to handle form submission and add the product to the database
app.post('/admin/add-product', async (req, res) => {
    const { productId, title, price, image } = req.body;
    try {
        const product = new Product({ productId, title, price, image });
        await product.save();
        res.send('Product added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Error adding product');
    }
});




app.get('/index.html', (req, res) => {
    if (req.session.userId) {
        res.sendFile(__dirname + '/index.html');
    } else {
        res.redirect('/');
    }
});







// Start the server
const port = 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
