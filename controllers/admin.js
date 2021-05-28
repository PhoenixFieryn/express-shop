const mongodb = require('mongodb');
const fileHelper = require('../util/file');
const Product = require('../models/product');
const { validationResult } = require('express-validator');
const message = require('../util/message');

exports.getAddProduct = (req, res, next) => {
	res.render('admin/edit-product', {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		messages: message.getMessage(req, validationResult(req).array()),
	});
};

exports.postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const image = req.file;
	const price = req.body.price;
	const description = req.body.description;
	const errors = validationResult(req);
	if (!image) {
		message.createMessage(req, {
			type: 'is-danger',
			header: 'Invalid file',
			body: 'Attached file is not an image of file type PNG or JPEG/JPG.',
		});
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			messages: message.getMessage(req),
		});
	}
	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			messages: message.getMessage(req, validationResult(req).array()),
		});
	}

	const imageUrl = image.path;

	const product = new Product({
		title: title,
		description: description,
		imageUrl: imageUrl,
		price: price,
		userId: req.user._id,
	});
	product
		.save()
		.then((result) => {
			// console.log(result);
			console.log('Created Product');
			res.redirect('/admin/products');
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const prodId = req.params.productId;
	Product.findOne({ _id: prodId, userId: req.user._id })
		.then((product) => {
			if (!product) {
				return res.redirect('/');
			}
			res.render('admin/edit-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				product: product,
				messages: message.getMessage(req, validationResult(req).array()),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postEditProduct = (req, res, next) => {
	const prodId = req.body.productId;
	const updatedTitle = req.body.title;
	const updatedPrice = req.body.price;
	const image = req.file;
	const updatedDesc = req.body.description;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return Product.findOne({ _id: prodId, userId: req.user._id }).then((product) => {
			if (!product) {
				return res.redirect('/');
			}
			return res.status(422).render(`admin/edit-product`, {
				pageTitle: 'Add Product',
				path: '/admin/edit-product',
				editing: true,
				product: {
					title: updatedTitle,
					price: updatedPrice,
					description: updatedDesc,
					_id: prodId,
				},
				messages: message.getMessage(req, validationResult(req).array()),
			});
		});
	}
	Product.findById(prodId)
		.then((product) => {
			if (product.userId.toString() !== req.user._id.toString()) {
				return res.redirect('/');
			}
			product.title = updatedTitle;
			product.description = updatedDesc;
			product.price = updatedPrice;
			if (image) {
				fileHelper.deleteFile(product.imageUrl);
				product.imageUrl = image.path;
			}
			return product.save().then((result) => {
				res.redirect('/admin/products');
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getProducts = (req, res, next) => {
	Product.find({ userId: req.user._id })
		.populate('userId')
		.then((products) => {
			res.render('admin/products', {
				prods: products,
				pageTitle: 'Admin Products',
				path: '/admin/products',
				isAuthenticated: req.session.isLoggedIn,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.deleteProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then((product) => {
			if (!product) {
				return next(new Error('Product not found'));
			}
			fileHelper.deleteFile(product.imageUrl);
			return Product.deleteOne({ _id: prodId, userId: req.user._id });
		})
		.then(() => {
			res.status(200).json({ message: 'Success!' });
		})
		.catch((err) => {
			res.status(500).json({ message: 'Deleting product failed.' });
		});
};
