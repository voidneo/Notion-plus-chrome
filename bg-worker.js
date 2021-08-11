const OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const CLIENT_ID = "";
const REDIRECT_URL = chrome.identity.getRedirectURL();
const DEBUG_MODE = true;

chrome.runtime.onInstalled.addListener(() => {
	if (DEBUG_MODE) console.log("Redirect url:" + REDIRECT_URL);
});

function authorize(sendResponse) {
	chrome.identity
		.launchWebAuthFlow(
			{
				url: `${OAUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}&response_type=code`,
				interactive: true,
			},
			(redirect_url) => {
				sendResponse(redirect_url);
				if (DEBUG_MODE) console.log("Response sent");
			}
		);

	if (chrome.runtime.lastError) {
		chrome.runtime.sendMessage({ message: "authorize(): " + chrome.runtime.lastError }, console.log);
	}
}

function messageListener(request, sender, sendResponse) {
	if (request.message === "login") {
		authorize(sendResponse);
		if (DEBUG_MODE) console.log("Auth executed");
		return true;
	}
	else {
		console.log(request.message);
		return true;
	}
}

chrome.runtime.onMessage.addListener(messageListener);
