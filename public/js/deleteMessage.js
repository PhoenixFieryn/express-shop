document.addEventListener('click', (e) => {
	if (e.target && e.target.classList.contains('delete-message')) {
		e.target.parentNode.parentNode.remove();
	}
});
