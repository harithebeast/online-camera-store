const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

let cartItems = [];

function fetchCartItems() {
    fetch("/user/cart")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            cartItems = data;
            updateCartItemsUI(cartItems);
        })
        .catch(error => {
            console.error('Error fetching cart items:', error);
        });
}

function displayTotalPrice(totalPrice) {
    const totalElem = document.querySelector(".cart-total");
    totalElem.innerText = `$${totalPrice.toFixed(2)}`;
}

function displayNumberOfProducts(numProducts) {
    const numProductsElem = document.querySelector(".cart-items");
    numProductsElem.innerText = numProducts;
}

function updateCartItemsUI(cartItems) {
    cartContent.innerHTML = '';
    let totalPrice = 0;
    cartItems.forEach(item => {
        addCartItemToUI(item);
        totalPrice += item.price;
    });
    displayTotalPrice(totalPrice);
    displayNumberOfProducts(cartItems.length); // Update to use cartItems.length
}
function addCartItemToUI(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    const totalPrice = item.price * item.amount; // Calculate total price
    div.innerHTML = `
        <img src="${item.image}" alt="product"> 
        <div>
            <h4>${item.title}</h4>
            <h5>$${totalPrice.toFixed(2)}</h5> <!-- Display total price -->
            <p>Quantity: ${item.amount}</p> <!-- Display quantity -->
        </div>
    `;
    cartContent.appendChild(div);
}


class Products {
    async getProducts() {
        try {
            let result = await fetch("products.json");
            let data = await result.json();
            let products = data.items;
            products = products.map(item => {
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image }
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const products = new Products();
    products.getProducts()
        .then(products => {
            fetchCartItems();
        });
});
