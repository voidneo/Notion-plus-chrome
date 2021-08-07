const OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const CLIENT_ID = "";
const REDIRECT_URL = chrome.identity.getRedirectURL();

chrome.runtime.onInstalled.addListener(() => {
	console.log("Redirect url:" + REDIRECT_URL);
});

function authorize(sendResponse) {
	chrome.identity
		.launchWebAuthFlow(
			{
				url: `${OAUTH_URL}?client_id=${CLIENT_ID}&redirect_url=${REDIRECT_URL}&response_type=code`,
				interactive: true,
			},
			(redirect_url) => {
				sendResponse(redirect_url);
				console.log("Response sent");
			}
		);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "login") {
		authorize(sendResponse);
		console.log("Auth executed");
		return true;
	}
	else {
		console.log(request.message);
		return false;
	}
});
