const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const message = require('../util/message');

const transporter = nodemailer.createTransport({
	host: 'smtp.mailtrap.io',
	port: 2525,
	auth: {
		user: '01c8e79f26e1fe',
		pass: 'a037e7863e68c1',
	},
});

const SALT = 12;

exports.getLogin = (req, res, next) => {
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		messages: message.getMessage(req),
	});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.render('auth/login', {
			path: '/login',
			pageTitle: 'Login',
			messages: message.getMessage(req, validationResult(req).array()),
		});
	}

	User.findOne({
		email: email,
	})
		.then((user) => {
			if (!user) {
				message.createMessage(req, {
					type: 'is-danger',
					header: 'Invalid email or password',
					body: 'Please check your email and password.',
				});
				return res.redirect('/login');
			}
			bcrypt
				.compare(password, user.password)
				.then((doMatch) => {
					if (doMatch) {
						req.session.isLoggedIn = true;
						req.session.user = user;
						return req.session.save((err) => {
							if (err) {
								const error = new Error(err);
								error.httpStatus = 500;
								return next(error);
							}
							res.redirect('/');
						});
					}
					message.createMessage(req, {
						type: 'is-danger',
						header: 'Invalid password',
						body:
							'Please check your password. Double check caps-lock or language settings.',
					});
					res.redirect('/login');
				})
				.catch((err) => {
					console.log(err);
					res.redirect('/login');
				});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		if (err) {
			console.log(err);
		}
		res.sendStatus(200);
	});
};

exports.getSignup = (req, res, next) => {
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		messages: message.getMessage(req),
		oldInput: {
			email: '',
			password: '',
			confirmPassword: '',
		},
	});
};

exports.postSignup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			messages: message.createMessageGroup(req, {
				type: 'is-danger',
				header: 'Invalid input',
				body: errors.array(),
			}),
			oldInput: {
				email: email,
				password: password,
				confirmPassword: confirmPassword,
			},
		});
	}
	bcrypt
		.hash(password, SALT)
		.then((hashedPassword) => {
			const user = new User({
				email: email,
				password: hashedPassword,
				cart: { items: [] },
			});
			return user.save();
		})
		.then((result) => {
			message.createMessage(req, {
				type: 'is-success',
				header: 'Account created successfully!',
				body: 'Please login with the account credentials.',
			});
			res.redirect('/login');
			return transporter.sendMail({
				to: email,
				from: 'shop@node-complete.com',
				subject: 'Signup succeeded!',
				html: `<h1> You successfully singed up!</h1> <br> <h2> The email you signed up with is: ${email}.`,
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.getReset = (req, res, next) => {
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset Email',
		messages: message.getMessage(req),
	});
};

exports.postReset = (req, res, next) => {
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			message.createMessage(req, {
				type: 'is-danger',
				header: 'An error has occurred',
				body: err,
			});
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		User.findOne({ email: req.body.email })
			.then((user) => {
				if (!user) {
					message.createMessage(req, {
						type: 'is-danger',
						header: 'Invalid email',
						body: 'No account with that email found.',
					});
					return res.redirect('/reset');
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				user.save().then((result) => {
					message
						.createMessageAsync(req, {
							type: 'is-success',
							header: 'Successfully sent reset link',
							body: `Please check your email at: ${req.body.email}. The link is valid for the next hour.`,
						})
						.then((result) => {
							res.redirect('/reset');
							transporter.sendMail({
								to: req.body.email,
								from: 'shop@node-complete.com',
								subject: 'Password reset',
								html: `
                                <p>You requested a password reset</p>
                                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                                <p>If this wasn't done by you, you can ignore this email and consider double checking your account security</p>
                            `,
							});
						});
				});
			})
			.catch((err) => {
				const error = new Error(err);
				error.httpStatus = 500;
				return next(error);
			});
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	const userId = req.body.userId;

	User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() },
	})
		.then((user) => {
			if (!user) {
				message.createMessage(req, {
					type: 'is-danger',
					header: 'Invalid reset token',
					body:
						'Invalid token for password reset was used. It may not have matched an user or the link has expired.',
				});
				return res.redirect('/reset');
			}
			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'New Password',
				messages: message.getMessage(req),
				userId: user._id.toString(),
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};

exports.postNewPassword = (req, res, next) => {
	const userId = req.body.userId;
	const newPassword = req.body.password;

	User.findOne({
		_id: userId,
	})
		.then((user) => {
			if (!user) {
				message.createMessage(req, {
					type: 'is-danger',
					header: 'Invalid user',
					body:
						'Could not find user. This is an unexpected error. Please try again or if the problem persists, contact support.',
				});
				return res.redirect('/reset');
			}
			return bcrypt.hash(newPassword, SALT).then((hashedPassword) => {
				user.password = hashedPassword;
				user.resetToken = undefined;
				user.resetTokenExpiration = undefined;
				user.save().then((result) => {
					message
						.createMessageAsync(req, {
							type: 'is-success',
							header: 'Password has been reset',
							body: 'Your password has been reset.',
						})
						.then((result) => {
							res.redirect('/login');
							transporter.sendMail({
								to: user.email,
								from: 'shop@node-complete.com',
								subject: 'Password has been reset',
								html: `
                                        <p>You have reset your password at ${Date.now()}.</p>
                                        <p>If this wasn't done by you, please contact support and double check your account security/credentials.</p>
                                        `,
							});
						});
				});
			});
		})
		.catch((err) => {
			const error = new Error(err);
			error.httpStatus = 500;
			return next(error);
		});
};
