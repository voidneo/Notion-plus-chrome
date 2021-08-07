btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", (evt) => {
	chrome.runtime.sendMessage({ message: "login" }, (response) => {
		alert("Message sender recieved a response");
		chrome.notifications.create(
			"notifid",
			{
				type: "basic",
				title: "Response",
				message: "... " + response,
				contextMessage: "Response: ",
				iconUrl: "clock_256.png"
			},
			(notif_id) => { }
		);
	});
});
