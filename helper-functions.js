const DEBUG_MODE = true;
const log = (s) => { if (DEBUG_MODE) console.log(s); };
const isSet = (p) => typeof p !== "undefined";
const isValid = (t) => typeof t === "string";
const sleep = async (ms) => {
    return await new Promise(
        (res, rej) => {
            setTimeout(() => { res(ms); }, ms);
        }
    )
};