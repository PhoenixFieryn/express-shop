const express = require('express');
const path = require('path');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post(
	'/add-product',
	[
		body('title', 'Make sure the title is at least 3 characters long.')
			.isString()
			.isLength({ min: 3 })
			.trim(),
		body('price', 'The price must be a valid float value.').isFloat(),
		body(
			'description',
			'The minimum length is 5 characters long and the max is 1000 characters long.'
		)
			.isLength({ min: 5, max: 1000 })
			.trim(),
	],
	isAuth,
	adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
	'/edit-product',
	[
		body('title', 'Make sure the title is at least 3 characters long.')
			.isString()
			.isLength({ min: 3 })
			.trim(),
		body('price', 'The price must be a valid float value.').isFloat(),
		body(
			'description',
			'The minimum length is 5 characters long and the max is 1000 characters long.'
		)
			.isLength({ min: 5, max: 1000 })
			.trim(),
	],
	isAuth,
	adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
