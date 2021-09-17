importScripts("notion-client.js");

chrome.runtime.onInstalled.addListener(() => {
});

async function fetchAndStorePages() {
	let pages = await Notion.GetAllPages();

	// If it's not an array, it's an error
	if (Object.prototype.toString.call(pages) !== "[object Array]") {
		// TODO: something, idk
		return;
	}

	// Store pages locally
	chrome.storage.local.set({ "pages": pages }, () => {
		if (chrome.runtime.lastError) {
			log(`fetchAndStorePages(): ${chrome.runtime.lastError.message}`);
		} else {
			log("fetchAndStorePages(): success");
		}
	});
}

async function getAllChildren(pageId) {
	let response = await Notion.GetBlockChildren(pageId);

	// if notion returned an error, return it
	if (response.object !== "list")
		return response;

	// fetch and scan for remiders before fetching again perhaps? so as to waste time
	// to help avoid notion's 3 requests/sec limit
}

async function restoreSession(sendResponse) {
	if (Notion.IsSessionOpen()) {
		sendResponse("success");
	} else {
		sendResponse("failure");
	}
}

function signOut(sendResponse) {
	chrome.storage.local.clear(() => {
		if (chrome.runtime.lastError) {
			log(`signOut(): ${chrome.runtime.lastError.message}`);
			sendMessage("failure");
		} else {
			log("signOut(): success");
			Notion.ClearSession();
			sendResponse("success");
		}
	});
}

function messageListener(request, sender, sendResponse) {
	switch (request.code) {
		case "authenticate":
			log("Authentication executed");
			Notion.Authenticate(sendResponse);
			return true;
		case "authorize":
			log("Authorization executed");
			sendResponse(
				Notion.Authorize()
			);
			return true;
		case "restore_session":
			log("Restore session executed");
			restoreSession(sendResponse);
			return true;
		case "sign_out":
			log("Sign out executed");
			signOut(sendResponse);
			return true;
		default:
			log(request);
			return false;
	}
}

chrome.runtime.onMessage.addListener(messageListener);
