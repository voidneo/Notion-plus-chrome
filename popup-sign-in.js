const sendMessage = chrome.runtime.sendMessage;
const log = (obj) => { sendMessage({ code: obj }); }

function handleAuthorizationResponse(response) {
	switch (response) { // https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
		case "invalid_request":
			return;
		case "invalid_client":
			return;
		case "invalid_grant":
			return;
		case "unauthorized_client":
			sendMessage({ code: "sign_out" }, (response) => { });
			return;
		case "unsupported_grant_type":
			return;
	}

	window.location.replace("./popup-home.html");
}

function handleAuthenticationResponse(response) {
	switch (response) { // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
		case "user_deined_access":
			return;
		case "invalid_request":
			return;
		case "unauthorized_client":
			return;
		case "access_denied":
			return;
		case "unsupported_response_type":
			return;
		case "invalid_scope":
			return;
		case "server_error":
			return;
		case "temporarily_unavailable":
			return;
	}

	// TODO: delete
	log("Response recieved: " + response);

	sendMessage({ code: "authorize", tempToken: response }, handleAuthorizationResponse);
}

function handleRestoreSessionResponse(response) {
	if (response === "success") {
		window.location.replace("./popup-home.html");
	}
}

function logInBtnClickHandler(evt) {
	sendMessage({ code: "authenticate" }, handleAuthenticationResponse);
}

function docLoadHandler(evt) {
	sendMessage({ code: "restore_session" }, handleRestoreSessionResponse);
}

window.addEventListener("load", docLoadHandler);
btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", logInBtnClickHandler);
