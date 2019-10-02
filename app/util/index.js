const arrayToSelectList = function (strArray, value, addBlank) {

    const selectList = strArray.map(v => {
        return {
            value: v,
            selected: v.toLowerCase() === value.toLowerCase()
        }
    })
    if (addBlank) {
        selectList.unshift({ value: '', selected: value == '' })
    }
    return selectList
}

const replaceAll = function (str, search, replacement) {

    return str.replace(new RegExp(search, 'g'), replacement);
};

const lookup = function (obj, field) {
    if (!obj) { return null; }
    var chain = field.split(']').join('').split('[');
    for (var i = 0, len = chain.length; i < len; i++) {
        var prop = obj[chain[i]];
        if (typeof (prop) === 'undefined') { return null; }
        if (typeof (prop) !== 'object') { return prop; }
        obj = prop;
    }
    return null;
}
const checkBoolean = function (value) {
    if (typeof value === 'string' || value instanceof String) {
        return !value.toLowerCase().includes('false', 'no', '0', 'off')
    }
    else return value

}
const getTimeStamp = function (d) {
    if (!d) d = new Date
    return d.toISOString().substring(11)
}
const cache = {}


const waitFor = async function (fn, args, ms, interval) {
    const timeout = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    let timeoutCtr = 0
    const iterations = ms / interval

    while (timeoutCtr < iterations) {
        timeoutCtr++
        if (await fn(...args)) return true
        await timeout(interval)
    }
    return false

}
const runWithTimeout = (fn, ms, msg) => {
    return new Promise(async (resolve, reject) => {
        let resolved = false

        const info = {
            // information to pass to fn to ensure it can cancel
            // things if it needs to
            error: null,
            pageErrors: [],
            reject: reject
        }

        const timer = setTimeout(() => {
            const err = new Error(`Timeout Error: ${msg}`)
            info.error = err
            err.pageErrors = info.pageErrors
            resolved = true
            reject(err)
        }, ms)

        try {
            const result = await fn(info)

            if (resolved) {
                return
            }

            resolve(result)
        } catch (e) {
            if (resolved) {
                return
            }
            e.pageErrors = info.pageErrors
            reject(e)
        } finally {
            clearTimeout(timer)
        }
    })
}
const boolOrUndefined = function (par) {
    return (par === true || par === 'true') ? true : undefined
}

module.exports = {
    arrayToSelectList,
    replaceAll,
    lookup,
    checkBoolean,
    getTimeStamp,
    boolOrUndefined,
    runWithTimeout,
    waitFor,

}