importScripts("helper-functions.js");

const Notion = (function () {
    const Version = "2021-08-16";

    const Url = {
        Authentication: "https://api.notion.com/v1/oauth/authorize",
        Authorization: "https://api.notion.com/v1/oauth/token",
        Search: "https://api.notion.com/v1/search",
        GetBlock: "https://api.notion.com/v1/blocks",
        Redirect: chrome.identity.getRedirectURL()
    };

    const Client = {
        Id: "",
        Secret: "",
        TemporaryToken: null,
        AccessToken: null
    };

    let LastRequestTime = new Date(0).getTime();

    chrome.storage.local.get("notion_plus", (items) => {
        if (isSet(items.notion_plus)) {
            Client.AccessToken = items.notion_plus.access_token;
        }
    });

    function updateLocalAccessToken() {
        chrome.storage.local.get("notion_plus", (items) => {
            if (isSet(items.notion_plus)) {
                Client.AccessToken = items.notion_plus.access_token;
            } else {
                Client.AccessToken = null;
            }
        });
    }

    function isSessionOpen() {
        log("isSessionOpen(): " + Client.AccessToken);
        return isValid(Client.AccessToken);
    }

    function authenticate(sendResponse) {
        chrome.identity
            .launchWebAuthFlow(
                {
                    url: `${Url.Authentication}?client_id=${Client.Id}&redirect_uri=${Url.Redirect}&response_type=code`,
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
                redirect_uri: Url.Redirect
            })
        })
            .then((response) => response.json())
            .catch(error => {
                log(error.message);
            });

        if (isSet(response.access_token)) {
            chrome.storage.local.set({ notion_plus: response }, () => {
                if (chrome.runtime.lastError) {
                    log(`Notion.Authorize(): ${chrome.runtime.lastError.message}`);
                }
            });

            Client.AccessToken = response.access_token;
            return "success";
        }

        return response.code;
    }

    function clearSession() {
        Client.AccessToken = null;
    }

    async function search(query, sort, filter, startCursor, maxPages) {
        // if no access token stored locally
        if (!isValid(Client.AccessToken)) return {};
        let body = {};

        if (isSet(query) && query != null) {
            body.query = query;
        }
        if (isSet(sort) && sort != null) {
            body.sort = sort;
        }
        if (isSet(filter) && filter != null) {
            body.filter = filter;
        }
        if (isSet(startCursor) && startCursor != null) {
            body.start_cursor = startCursor;
        }
        if (isSet(maxPages) && maxPages != null) {
            body.page_size = maxPages;
        }

        let response = await fetch(Url.Search, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Client.AccessToken}`,
                "Content-Type": "application/json",
                "Notion-Version": Version
            },
            "body": JSON.stringify(body)
        })
            .then(response => response.json());

        return response;
    }

    async function getAllPages() {
        // if no access token stored locally
        if (!isValid(Client.AccessToken)) return null;

        let response = await search(null, null, { value: "page", property: "object" });

        // if notion returned an error, return it
        if (response.object !== "list")
            return response;

        // else, keep fetching pages as long there are search results
        let data = [response];
        let lastResponse = data[0];
        let tries = 0;
        while (lastResponse.has_more) {
            response = await search(null, null, { value: "page", property: "object" }, lastResponse.next_cursor);

            // if notion returned a list of results
            if(response.object === "list") {
                data.push(response);
                lastResponse = response;
            }
            else {
                if(tries++ >= 3) {
                    log("Notion.GetAllPages(): Failed to fetch pages after 3 tries");
                    return data;
                }
            }
        }

        return data;

        /* Invalid request / token response
        {
            "object": "error",
            "status": 401,
            "code": "unauthorized",
            "message": "API token is invalid."
        }
        */
    }

    async function getBlock(blockId) {
        if (!isValid(Client.AccessToken)) return null;

        let response = await fetch(`${Url.GetBlock}/${blockId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${Client.AccessToken}`,
                "Content-Type": "application/json",
                "Notion-Version": Version
            }
        })
            .then(response => response.json());

        return response;
    }

    async function getBlockChildren(blockId, startCursor, maxBlocks) {
        // if no access token stored locally
        if (!isValid(Client.AccessToken) || !isSet(blockId) || blockId == null) return {};

        let params = {};

        if (isSet(startCursor) && startCursor != null) {
            params.start_cursor = startCursor;
        }
        if (isSet(maxBlocks) && maxBlocks != null) {
            params.page_size = maxBlocks;
        }

        params = new URLSearchParams(params).toString();

        let response = await fetch(`${Url.GetBlock}/${blockId}/children?${params}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${Client.AccessToken}`,
                "Content-Type": "application/json",
                "Notion-Version": Version
            }
        })
            .then(response => response.json());

        return response;
    }

    return Object.freeze({
        "Version": Version,
        "Authenticate": authenticate,
        "Authorize": authorize,
        "IsSessionOpen": isSessionOpen,
        "ClearSession": clearSession,
        "Search": search,
        "GetAllPages": getAllPages,
        "GetBlock": getBlock,
        "GetBlockChildren": getBlockChildren
    });
})();