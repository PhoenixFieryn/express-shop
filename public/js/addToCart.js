document.addEventListener('DOMContentLoaded', () => {
	const http = new Http();

	const addToCartButton = Array.prototype.slice.call(
		document.querySelectorAll('.add-to-cart'),
		0
	);
	for (let button of addToCartButton) {
		const csrf = button.dataset.csrfToken;
		button.addEventListener('click', () => {
			const productId = button.dataset.productId;
			http.post('/cart', {
				productId: productId,
				_csrf: csrf
			})
				.then((response) => {
					window.location = '/cart';
				})
				.catch((err) => console.log(err));
		});
	}
});
