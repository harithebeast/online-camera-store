const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItemsElem = document.querySelector(".cart-items");
const cartTotalElem = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

let buttonsDOM = [];
let userId;
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
            updateCartValues(cartItems);
        })
        .catch(error => {
            console.error('Error fetching cart items:', error);
        });
}

function updateCartItemsUI(cartItems) {
    cartContent.innerHTML = '';
    cartItems.forEach(item => {
        addCartItemToUI(item);
    });
}

function addCartItemToUI(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
        <img src="${item.image}" alt="product"> 
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id="${item.id}">remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id="${item.id}"></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id="${item.id}"></i>
        </div>
    `;
    cartContent.appendChild(div);
}

function updateCartValues(cartItems) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cartItems.forEach(item => {
        tempTotal += item.price * item.amount;
        itemsTotal += item.amount;
    });
    cartTotalElem.innerText = parseFloat(tempTotal.toFixed(2));
    cartItemsElem.innerText = isNaN(itemsTotal) ? 0 : itemsTotal;
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

function checkLoginStatus() {
    return new Promise((resolve, reject) => {
        fetch('/check-login')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.loggedIn) {
                    userId = data.userId;
                    resolve(data);
                } else {
                    userId = null;
                    resolve(data);
                }
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                reject(error);
            });
    });
}

class UI {
    displayProducts(products) {
        let result = "";
        products.forEach(product => {
            result += `
                <article class="product">
                    <div class="img-container">
                        <img src=${product.image} alt="product" class="product-img">
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            add to cart
                        </button>
                    </div> 
                    <h3>${product.title}</h3>
                    <h4>$${product.price}</h4>
                </article>`;
        });
        productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cartItems.find(item => item.id === id);
            if (inCart) {
                button.innerText = "In cart";
                button.disabled = true;
            } else {
                button.innerText = "Add to cart";
                button.disabled = false;
            }
            button.addEventListener('click', (event) => {
                event.target.innerText = "In cart";
                event.target.disabled = true;
                let cartItem = { ...Storage.getProduct(id), amount: 1 };
                cartItems.push(cartItem);
                Storage.saveCart(cartItems, userId);
                this.setCartValues(cartItems);
                this.addCardItem(cartItem);
                this.showCart();
            });
        });
    }
    
    setCartValues(cartItems) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cartItems.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        cartTotalElem.innerText = parseFloat(tempTotal.toFixed(2));
        cartItemsElem.innerText = itemsTotal;
    }
    
    addCardItem(item) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = ` 
            <img src=${item.image} alt="product"> 
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div> `;
        cartContent.appendChild(div);
    }
    
    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }
    
    setupApp() {
        cartItems = Storage.getCart(userId);
        this.setCartValues(cartItems);
        this.populateCart(cartItems);
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }
    
    populateCart(cartItems) {
        cartItems.forEach(item => this.addCardItem(item));
    }
    
    hideCart() {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    
    cartLogic() {
        clearCartBtn.addEventListener("click", () => { this.clearCart(); });
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains('remove-item')) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            } else if (event.target.classList.contains('fa-chevron-up')) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cartItems.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cartItems, userId);
                this.setCartValues(cartItems);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cartItems.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if (tempItem.amount > 0) {
                    Storage.saveCart(cartItems, userId);
                    this.setCartValues(cartItems);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }
    
    clearCart() {
        cartItems.forEach(item => {
            let button = this.getSingleButton(item.id);
            if (button) {
                button.disabled = false;
                button.innerText = "Add to cart";
            }
        });
        cartItems = [];
        cartContent.innerHTML = '';
        Storage.saveCart(cartItems, userId);
        this.setCartValues(cartItems);
        this.hideCart();
    }

    removeItem(id) {
        cartItems = cartItems.filter(item => item.id !== id);
        this.setCartValues(cartItems);
        Storage.saveCart(cartItems, userId);
        let button = this.getSingleButton(id);
        if (button) {
            button.disabled = false;
            button.innerText = "Add to cart";
        }
    }
    
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }

    static saveCart(cartItems, userId) {
        document.cookie = `${userId}_cart=${JSON.stringify(cartItems)}; expires=${new Date(Date.now() + 3600000).toUTCString()}; path=/`;
    }

    static getCart(userId) {
        try {
            const cookies = document.cookie.split(';').map(cookie => cookie.trim());
            const cartCookie = cookies.find(cookie => cookie.startsWith(`${userId}_cart=`));
            if (cartCookie) {
                const cartData = cartCookie.split('=')[1];
                return JSON.parse(cartData);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error parsing cart data:', error);
            return [];
        }
    }
}    

document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    const ui = new UI();
    const products = new Products();
    ui.setupApp();
    products.getProducts()
        .then(products => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(() => {
            ui.getBagButtons();
            ui.cartLogic();
            fetchCartItems();
        });
});
