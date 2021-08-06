const OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const CLIENT_ID = "465dc18a-d891-497f-a8e9-4bf725da5591";
const REDIRECT_URL = chrome.identity.getRedirectURL();

chrome.runtime.onInstalled.addListener(() => {
	console.log("getRedirectURL():" + chrome.identity.getRedirectURL());
});

async function doAuth() {
	let response = "";
	chrome.identity.launchWebAuthFlow(
		{
			url: `${OAUTH_URL}?client_id=${CLIENT_ID}&redirect_url=${REDIRECT_URL}&response_type=code`,
			interactive: true,
		},
		(redirect_url) => {
			if (chrome.runtime.lastError) {
				response = "error";
			} else if (redirect_url.includes("access_denied")) {
				response = "acces-denied"
			} else {
				response = redirect_url;
			}
		}
	);

	return response;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "login") {
		chrome.identity
			.launchWebAuthFlow(
				{
					url: `${OAUTH_URL}?client_id=${CLIENT_ID}&redirect_url=${REDIRECT_URL}&response_type=code`,
					interactive: true,
				},
				(redirect_url) => {
					console.log("redirect_url: " + redirect_url);
					sendResponse(redirect_url);
				}
			);
		}
	return true;
});
