const AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize";
const ACCESS_TOKEN_URL = "https://api.notion.com/v1/oauth/token";
const CLIENT_ID = "";
const REDIRECT_URL = chrome.identity.getRedirectURL();
const DEBUG_MODE = true;

function log(str) {
	if (DEBUG_MODE) console.log(str);
}

chrome.runtime.onInstalled.addListener(() => {
	log("Redirect url:" + REDIRECT_URL);
});

function authorize(sendResponse) {
	chrome.identity
		.launchWebAuthFlow(
			{
				url: `${AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}&response_type=code`,
				interactive: true,
			},
			(redirect_url) => {
				let urlObj = new URL(redirect_url);
				let response = {
					code: urlObj.searchParams.get("code"),
					error: urlObj.searchParams.get("error")
				};

				sendResponse(response);
				log("Response sent");
			}
		);

	if (chrome.runtime.lastError) {
		chrome.runtime.sendMessage({ message: "authorize(): " + chrome.runtime.lastError }, console.log);
	}
}

async function requestAccess(authData, sendResponse) {
	let cred = /* {client_id}:{client_secret} encoded in base64*/ 0;
	await fetch(ACCESS_TOKEN_URL, {
		mode: 'no-cors',
		method: "POST",
		headers: {
			"Authorization": `Basic ${cred}`,
			"Content-Type": "application/json"
		},
		body: {
			grant_type: "authorization_code",
			code: authData.code,
			redirect_uri: REDIRECT_URL
		}
	})
		.then((response) => response.json())
		.then((data) => log);
}

function messageListener(request, sender, sendResponse) {
	switch (request.message) {
		case "auth":
			authorize(sendResponse);
			log("Auth executed");
			return true;
		case "request-access":
			requestAccess(request.authData, sendResponse);
			log("Access request executed")
			return true;
		default:
			log(request.message);
			return true;
	}
}

chrome.runtime.onMessage.addListener(messageListener);
