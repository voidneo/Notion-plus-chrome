importScripts("helper-functions.js");

const Notion = (function () {
    const Version = "2021-05-13";

    const Url = {
        Authentication: "https://api.notion.com/v1/oauth/authorize",
        Authorization: "https://api.notion.com/v1/oauth/token",
        Search: "https://api.notion.com/v1/search"
    };

    const Client = {
        Id: "",
        Secret: "",
        TemporaryToken: null
    };

    async function getAccessTokenFromLocalStorage() {
        let promiseFulfilled = false;
        let data = new Promise((resolve, reject) => {
            chrome.storage.local.get("notion_plus", (items) => {
                if (typeof items.notion_plus !== "undefined") {
                    resolve(items.notion_plus.access_token);
                } else {
                    resolve(null);
                }
            });
        })
        .then((token) => {
            log("Fucking now it returns the value from storage, TOO FUCKING LATE");
            promiseFulfilled = true;
        });

        let i = 0;
        while(!promiseFulfilled) {
            log("Sleeping: 100ms, times slept: " + ++i + ", promise fullfiled: " + promiseFulfilled);
            await sleep(100);
            log("Sleep is over, promise fullfiled: " + promiseFulfilled);
        }

        log("Loop is over, promise fullfiled: " + promiseFulfilled);

        return data;
    }

    async function middleFunc() {
        return await getAccessTokenFromLocalStorage();
    }

    async function f() {
        return await middleFunc();
    }

    function isSessionOpen() {
        let token = f();
        log("isSessionOpen(): " + token);
        return typeof token === "string" ? true : false;
    }

    function authenticate(sendResponse) {
        chrome.identity
            .launchWebAuthFlow(
                {
                    url: `${Url.Authentication}?client_id=${Client.Id}&redirect_uri=${REDIRECT_URL}&response_type=code`,
                    interactive: true,
                },
                (redirect_url) => {
                    // User closed interactive log-in window
                    if (chrome.runtime.lastError) {
                        if (chrome.runtime.lastError.message !== "Authorization page could not be loaded.")
                            sendResponse("user_deined_access");
                        log("Notion.Authenticate(): " + chrome.runtime.lastError.message);
                        return;
                    }

                    let urlObj = new URL(redirect_url);
                    let code = urlObj.searchParams.get("code");
                    let error = urlObj.searchParams.get("error");

                    // User denied access through interactive log-in window
                    if (code == null) {
                        sendResponse("user_deined_access");
                        log("Notion.Authenticate(): user_deined_access");
                        return;
                    }

                    // Notion server returned an error
                    if (error != null) {
                        endResponse(error);
                        log("Notion.Authenticate(): " + error);
                        return;
                    }

                    Client.TemporaryToken = code;
                    sendResponse(code);
                    log("Response sent");
                }
            );
    }

    async function authorize() {
        log("Notion.Authorize(): Client.TemporaryToken = " + Client.TemporaryToken);
        let cred = btoa(`${Client.Id}:${Client.Secret}`);
        let response = await fetch(Url.Authorization, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${cred}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                code: Client.TemporaryToken,
                redirect_uri: REDIRECT_URL
            })
        })
            .then((response) => response.json())
            .catch(error => {
                log(error.message);
            });

        if (typeof response.access_token !== "undefined") {
            chrome.storage.local.set({ notion_plus: response }, () => {
                if (chrome.runtime.lastError) {
                    log(`Notion.Authorize(): ${chrome.runtime.lastError.message}`);
                }
            });
            return "success";
        }

        return response.code;
    }

    // Up to 100 pages
    async function getPages() {
        let accessToken = await getAccessTokenFromLocalStorage();

        // if no access token stored locally
        if (typeof accessToken !== "string") return null;

        let response = await fetch(Url.Search, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Notion-Version": Version
            },
            body: JSON.stringify({
                filter: {
                    value: "page",
                    property: "object"
                }
            })
        })
            .then(response => response.json())
        
        if(typeof response.results !== "undefined") {
            return response;
        }

        return response.code;

        /* Invalid request / token response
        {
            "object": "error",
            "status": 401,
            "code": "unauthorized",
            "message": "API token is invalid."
        }
        */
    }

    return Object.freeze({
        "Version": Version,
        "Authenticate": authenticate,
        "Authorize": authorize,
        "IsSessionOpen": isSessionOpen
    });
})();