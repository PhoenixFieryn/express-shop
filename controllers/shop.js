const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(
	'sk_test_51IYIneL6LKdW7TRAFEo0bbtvMN4i18zBXRwRDKAPnamxo14y5eQZP68rw6HBWS4rX3xwYIVe6L2uPZlvAji3MIo300W2rdF3CM'
);

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
	let page = parseInt(req.query.page || 1);
	let totalItems;

	Product.find()
		.countDocuments()
		.then((numProducts) => {
			totalItems = numProducts;
			return Product.find()
				.skip((page - 1) * ITEMS_PER_PAGE)
				.limit(ITEMS_PER_PAGE);
		})
		.then((products) => {
			res.render('shop/product-list', {
				prods: products,
				pageTitle: 'All Products',
				path: '/products',
				isAuthenticated: req.session.isLoggedIn,
				hasNextPage: ITEMS_PER_PAGE * page < totalItems,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				previousPage: page - 1,
				lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
				currentPage: page,
				hasFirstEllipses: page - 2 == 1,
				hasSecondEllipse:
					page + 2 == Math.ceil(totalItems / ITEMS_PER_PAGE),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			res.render('shop/product-detail', {
				product: product,
				pageTitle: product.title,
				path: `/products/${product.title}`,
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => {
			res.render('shop/product-detail', {
				removed: true,
				removedMessage:
					'This product does not or no longer exists. If you are coming from the orders page, the product may have been removed.',
				pageTitle: 'This product no longer exists',
				path: `/products/removed`,
				isAuthenticated: req.session.isLoggedIn,
			});
		});
};

exports.getIndex = (req, res, next) => {
	let page = parseInt(req.query.page || 1);
	let totalItems;

	Product.find()
		.countDocuments()
		.then((numProducts) => {
			totalItems = numProducts;
			return Product.find()
				.skip((page - 1) * ITEMS_PER_PAGE)
				.limit(ITEMS_PER_PAGE);
		})
		.then((products) => {
			res.render('shop/index', {
				prods: products,
				pageTitle: 'Shop',
				path: '/',
				hasNextPage: ITEMS_PER_PAGE * page < totalItems,
				hasPreviousPage: page > 1,
				nextPage: page + 1,
				previousPage: page - 1,
				lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
				currentPage: page,
				hasFirstEllipses: page - 2 == 1,
				hasSecondEllipse:
					page + 2 == Math.ceil(totalItems / ITEMS_PER_PAGE),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items;
			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products: products,
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postCart = (req, res, next) => {
	const prodId = req.body.productId;
	Product.findById(prodId)
		.then((product) => {
			return req.user.addToCart(product);
		})
		.then((result) => {
			res.sendStatus(200);
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postCartDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	req.user
		.removeFromCart(prodId)
		.then((result) => {
			res.redirect('/cart');
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then((orders) => {
			res.render('shop/orders', {
				path: '/orders',
				pageTitle: 'Your Orders',
				orders: orders,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postOrder = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items.map((i) => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					email: req.user.email,
					userId: req.user,
				},
				products: products,
			});
			return order.save();
		})
		.then((result) => {
			req.user.clearCart();
		})
		.then(() => {
			res.redirect('/orders');
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getCheckoutSuccess = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			const products = user.cart.items.map((i) => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					email: req.user.email,
					userId: req.user,
				},
				products: products,
			});
			return order.save();
		})
		.then((result) => {
			req.user.clearCart();
		})
		.then(() => {
			res.redirect('/orders');
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getCheckout = (req, res, next) => {
	let products;
	let total = 0;

	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then((user) => {
			products = user.cart.items;
			total = 0;
			products.forEach((p) => {
				total += p.quantity * p.productId.price;
			});

			return stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: products.map((p) => {
					return {
						name: p.productId.title,
						description: p.productId.description,
						amount: p.productId.price * 100,
						currency: 'usd',
						quantity: p.quantity,
					};
				}),
				success_url: `${req.protocol}://${req.get(
					'host'
				)}/checkout/success`,
				cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
			});
		})
		.then((session) => {
			res.render('shop/checkout', {
				path: '/checkout',
				pageTitle: 'Checkout',
				products: products,
				isAuthenticated: req.session.isLoggedIn,
				totalSum: total,
				sessionId: session.id,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getInvoice = (req, res, next) => {
	const orderId = req.params.orderId;
	Order.findById(orderId)
		.then((order) => {
			if (!order) {
				return next(new Error('No order found.'));
			}
			if (order.user.userId.toString() !== req.user._id.toString()) {
				return next(new Error('Unauthorized access.'));
			}
			const invoiceName = 'invoice-' + orderId + '.pdf';
			const invoicePath = path.join('data', 'invoices', invoiceName);

			const pdfDoc = new PDFDocument();
			res.setHeader('content-type', 'application/pdf');
			res.setHeader('content-disposition', `inline; filename="${invoiceName}"`);
			pdfDoc.pipe(fs.createWriteStream(invoicePath));
			pdfDoc.pipe(res);

			pdfDoc.fontSize(26).text('Invoice');

			pdfDoc.fontSize(14);

			let totalPrice = 0;
			order.products.forEach((prod) => {
				totalPrice += prod.quantity * prod.product.price;
				pdfDoc.text(
					`${prod.product.title} - ${prod.quantity} x $${prod.product.price}`
				);
			});

			pdfDoc.text(`Total Price: $${totalPrice}`);

			pdfDoc.end();
		})
		.catch((err) => next(err));
};
