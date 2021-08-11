function doStuffWithToken(token) {
	chrome.runtime.sendMessage({ message: "Response recieved: " + token }, console.log);
}

function clickHandler(evt) {
	chrome.runtime.sendMessage({ message: "login" }, doStuffWithToken);
}

btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", clickHandler);
