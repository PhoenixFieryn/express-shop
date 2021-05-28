document.addEventListener('DOMContentLoaded', () => {
	const http = new Http();

	const logoutBtn = Array.prototype.slice.call(document.querySelectorAll('.logout-btn'));
	for (let button of logoutBtn) {
		const csrf = button.dataset.csrfToken;
		button.addEventListener('click', () => {
			http.post('/logout', {
				_csrf: csrf
			})
				.then((response) => {
					window.location = '/';
				})
				.catch((error) => {
					console.log(error);
				});
		});
	}
});
