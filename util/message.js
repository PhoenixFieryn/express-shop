exports.createMessage = (req, { type, header, body }) => {
	req.flash('messageType', type);
	req.flash('messageHeader', header);
	req.flash('messageBody', body);
};

exports.createMessageAsync = async function (req, { type, header, body }) {
	req.flash('messageType', type);
	req.flash('messageHeader', header);
	req.flash('messageBody', body);
	return new Promise((resolve) => {
		resolve('resolved');
	});
};

exports.getMessage = (req, errors) => {
	let messages = [];
	const type = req.flash('messageType');
	const header = req.flash('messageHeader');
	const body = req.flash('messageBody');

	if (type.length > 0) {
		messages.push({
			type: type,
			header: header,
			body: body,
		});
	}

	if (errors) {
		messages = messages.concat(this.createErrors(req, errors));
	}

	return messages;
};

exports.createErrors = (req, body) => {
	return this.createMessageGroup(req, { type: 'is-danger', header: 'Invalid input', body: body });
};

exports.getMessageAsync = async function (req) {
	let messages = [];
	const type = req.flash('messageType');
	const header = req.flash('messageHeader');
	const body = req.flash('messageBody');

	if (type.length > 0) {
		messages.push({
			type: type,
			header: header,
			body: body,
		});
	}

	if (errors) {
		messages = messages.concat(this.createErrors(req, errors));
	}

	return new Promise((resolve) => {
		resolve(messages);
	});
};

exports.createMessageGroup = (req, { type, header, body }) => {
	const errors = [];
	body.forEach((error) => {
		errors.push({
			type: type,
			header: header,
			body: error.msg,
		});
	});
	return errors;
};
