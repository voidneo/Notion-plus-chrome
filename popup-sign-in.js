function handleAuthResponse(response) {
	if(response.code == null) return;
	//if(response.code != null) {} // if permission was denied

	// TODO: delete
	chrome.runtime.sendMessage({ message: "Response recieved: " + response.code }, console.log);

	chrome.runtime.sendMessage({ message: "request-access", authData: response}, (res) => {
		chrome.runtime.sendMessage({ message: "access requester: response recieved: " + JSON.stringify(res) }, console.log);
	});
}

function clickHandler(evt) {
	chrome.runtime.sendMessage({ message: "auth" }, handleAuthResponse);
}

btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", clickHandler);
