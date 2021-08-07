const OAUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const CLIENT_ID = "465dc18a-d891-497f-a8e9-4bf725da5591";
const REDIRECT_URL = chrome.identity.getRedirectURL();

chrome.runtime.onInstalled.addListener(() => {
	console.log("getRedirectURL():" + chrome.identity.getRedirectURL());
});

async function authorize(sendResponse) {
	return await chrome.identity
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
		(async () => {
			await authorize(sendResponse);
			console.log("Auth executed");
			return true;
		})();
	}
	return true;
});
