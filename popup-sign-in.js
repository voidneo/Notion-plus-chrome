btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", (evt) => {
	chrome.runtime.sendMessage({ message: "login" }, (response) => {
		chrome.runtime.sendMessage({ message: "Response recieved" }, console.log);
	});
});
