const sendMessage = chrome.runtime.sendMessage;

function handleSignOutResponse(response) {
	if (response === "success") {
        window.location.replace("./popup-sign-in.html");
	}
}

function signOutBtnClickHandler(evt) {
	sendMessage({ code: "sign_out" }, handleSignOutResponse);
}

btnSignOut = document.getElementById("btnSignOut");
btnSignOut.addEventListener("click", signOutBtnClickHandler);
