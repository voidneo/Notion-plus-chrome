importScripts("notion-client.js");

// TODO: Organize constants in objects
// TODO: Organize functions in objects

chrome.runtime.onInstalled.addListener(() => {
});

async function restoreSession(sendResponse) {
	if (Notion.IsSessionOpen()) {
		sendResponse(await Notion.GetAllPages());
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
