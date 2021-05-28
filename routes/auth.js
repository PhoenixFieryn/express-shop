const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
	'/login',
	[
		body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
		body('password').trim(),
	],
	authController.postLogin
);

router.post('/logout', authController.postLogout);

router.post(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please enter a valid email.')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject(
							'A user with the email already exists. Please use a different email or try logging in instead.'
						);
					}
				});
			})
			.normalizeEmail(),
		body(
			'password',
			'Please enter a password with a minimum of 8 characters and max of 128 characters.'
		)
			.isLength({ min: 8, max: 128 })
			.trim(),
		body('confirmPassword')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Passwords has to match.');
				}
				return true;
			})
			.trim(),
	],
	authController.postSignup
);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
