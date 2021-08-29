const AUTHENTICATION_URL = "https://api.notion.com/v1/oauth/authorize";
const AUTHORIZATION_URL = "https://api.notion.com/v1/oauth/token";
const CLIENT_ID = "";
const CLIENT_SECRET = "";
const REDIRECT_URL = chrome.identity.getRedirectURL();
const DEBUG_MODE = true;

const SESSION = {

};

function log(str) {
	if (DEBUG_MODE) console.log(str);
}

chrome.runtime.onInstalled.addListener(() => {
	log("Redirect url:" + REDIRECT_URL);
});

function authenticate(sendResponse) {
	chrome.identity
		.launchWebAuthFlow(
			{
				url: `${AUTHENTICATION_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}&response_type=code`,
				interactive: true,
			},
			(redirect_url) => {
				// User closed interactive log-in window
				if (chrome.runtime.lastError) {
					log("authenticate(): " + chrome.runtime.lastError.message);

					if (chrome.runtime.lastError.message !== "Authorization page could not be loaded.")
						sendResponse("user_deined_access");

					return;
				}

				let urlObj = new URL(redirect_url);
				let code = urlObj.searchParams.get("code");
				let error = urlObj.searchParams.get("error");

				// User denied access through interactive log-in window
				if (code == null) {
					sendResponse("user_deined_access");
					log("authenticate(): user_deined_access");
					return;
				}

				// Notion server returned an error
				if (error != null) {
					sendResponse(error);
					log("authenticate(): " + error);
					return;
				}

				sendResponse(code);
				log("Response sent");
			}
		);
}

async function authorize(tempToken, sendResponse) {
	let cred = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

	await fetch(AUTHORIZATION_URL, {
		method: "POST",
		headers: {
			"Authorization": `Basic ${cred}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			grant_type: "authorization_code",
			code: tempToken,
			redirect_uri: REDIRECT_URL
		})
	})
		.then((response) => response.json())
		.then((data) => {
			log(data);
			sendResponse(data);
		})
		.catch(error => {
			log(error.message);
		});
}

function persistSession(data) {
	chrome.storage.local.set(data, () => {
		if(chrome.runtime.lastError) {
			log(`persistSession(): ${chrome.runtime.lastError.message}`);
		}
	})
}

function restoreSession(sendResponse) {
	chrome.storage.local.get("access_token", (item) => {
		if(chrome.runtime.lastError) {
			log(`restoreSession(): ${chrome.runtime.lastError.message}`);
			sendResponse("failure");
		}

		if(typeof item.access_token !== "undefined") {
			sendResponse("success");
		} else {
			sendResponse("failure");
		}

		log("restoreSession(): " + JSON.stringify(item));
	});
}

function signOut(sendResponse) {
	chrome.storage.local.clear(() => {
		if(chrome.runtime.lastError){
			log(`signOut(): ${chrome.runtime.lastError.message}`);
			sendMessage("failure");
		} else {
			log("signOut(): success");
			sendResponse("success");
		}
	});
}

function messageListener(request, sender, sendResponse) {
	switch (request.message) {
		case "authenticate":
			authenticate(sendResponse);
			log("Auth executed");
			return true;
		case "authorize":
			authorize(request.tempToken, sendResponse);
			log("Access request executed")
			return true;
		case "persist_session":
			persistSession(request.data);
			return false;
		case "restore_session":
			restoreSession(sendResponse);
			log("Restore session executed");
			return true;
		case "sign_out":
			signOut(sendResponse);
			log("Sign out executed");
			return true;
		default:
			log(request);
			return true;
	}
}

chrome.runtime.onMessage.addListener(messageListener);
