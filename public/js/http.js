class Http {
	//Make HTTP GET request
	async get(url) {
		const response = await fetch(url);
		const status = await response.status;
		return status;
	}

	// Make an HTTP POST request
	async post(url, data) {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		const status = await response.status;
		return status;
	}

	// Make a HTTP PUT request
	async put(url, data) {
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		const status = await response.status;
		return status;
	}

	// Make a HTTP DELETE request
	async delete(url, headers) {
		const response = await fetch(url, {
			method: 'DELETE',
			headers: headers || {
				'Content-type': 'application/json',
			},
		});
		const status = await response.status;
		return status;
	}
}
