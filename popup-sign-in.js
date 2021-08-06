btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", (evt) => {
	chrome.runtime.sendMessage({ message: "login" }, (response) => {
		chrome.notifications.create(
			"notifid",
			{
				type: "basic",
				title: "Response",
				message: "Response: ",
				contextMessage: response,
				iconUrl: "clock_256.png"
			},
			(notif_id) => { }
		);
	});
});
