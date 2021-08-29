const sendMessage = chrome.runtime.sendMessage;
const log = (obj) => { sendMessage({ message: obj }); }

function handleAuthorizationResponse(response) {
	switch (response) { // https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
		case "invalid_request":
			return;
		case "invalid_client":
			return;
		case "invalid_grant":
			return;
		case "unauthorized_client":
			return;
		case "unsupported_grant_type":
			return;
	}

	sendMessage({ message: 'persist_session', data: response }, () => {});
	window.location.replace("./popup-home.html");
}

function handleAuthenticationResponse(response) {
	switch (response) { // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
		case "user_deined_access":
			log(response);
			return;
		case "invalid_request":
			log(response);
			return;
		case "unauthorized_client":
			log(response);
			return;
		case "access_denied":
			log(response);
			return;
		case "unsupported_response_type":
			log(response);
			return;
		case "invalid_scope":
			log(response);
			return;
		case "server_error":
			log(response);
			return;
		case "temporarily_unavailable":
			log(response);
			return;
	}

	// TODO: delete
	log("Response recieved: " + response);

	sendMessage({ message: "authorize", tempToken: response }, handleAuthorizationResponse);
}

function handleRestoreSessionResponse(response) {
	if (response === "success") {
		window.location.replace("./popup-home.html");
	}
}

function logInBtnClickHandler(evt) {
	sendMessage({ message: "authenticate" }, handleAuthenticationResponse);
}

function docLoadHandler(evt) {
	sendMessage({ message: "restore_session" }, handleRestoreSessionResponse);
}

window.addEventListener("load", docLoadHandler);
btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", logInBtnClickHandler);
