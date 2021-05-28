// document.addEventListener('DOMContentLoaded', () => {
// 	const http = new Http();

// 	const deleteButton = Array.prototype.slice.call(document.querySelectorAll('.delete-item'), 0);

// 	for (let button of deleteButton) {
// 		const csrf = button.dataset.csrfToken;
// 		button.addEventListener('click', () => {
// 			const productId = button.dataset.productId;
// 			http.post('/admin/delete-product', {
// 				productId: productId,
// 				_csrf: csrf
// 			})
// 				.then((response) => {
// 					window.location = '/admin/products';
// 				})
// 				.catch((error) => {
// 					console.log(error);
// 				});
// 		});
// 	}
// });

const http = new Http();

const deleteProduct = (btn) => {
	const prodId = btn.dataset.productId;
	const csrf = btn.dataset.csrfToken;

	productElement = btn.closest('.is-parent');

	http.delete(`/admin/product/${prodId}`, {
		'csrf-token': csrf,
	})
		.then((response) => {
			productElement.parentNode.removeChild(productElement);
		})
		.catch((err) => console.error(err));
};
