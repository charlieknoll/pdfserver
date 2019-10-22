const crypto = require('crypto')

const arrayToSelectList = function (strArray, value, addBlank) {

    const selectList = strArray.map(v => {
        if (v.value && v.label) {
            return {
                value: v.value,
                label: v.label,
                selected: v.value.toLowerCase() === value.toLowerCase()

            }
        }
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
        if (value.trim() === '') return false
        if (value.toLowerCase().includes('false')) return false
        if (value.toLowerCase().includes('0')) return false
        if (value.toLowerCase().includes('no')) return false
        if (value.toLowerCase().includes('off')) return false
        return true
    }
    else return value

}
const checkBooleanOrUndefined = function (value) {
    if (typeof value === 'string' || value instanceof String) {
        if (value.trim() === '') return undefined
        if (value.toLowerCase().includes('false')) return false
        if (value.toLowerCase().includes('0')) return false
        if (value.toLowerCase().includes('no')) return false
        if (value.toLowerCase().includes('off')) return false
        return true
    }
    else return value

}
const getTimeStamp = function (d) {
    if (!d) d = new Date
    return d.toISOString().substring(11, 23)
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
            consoleLogs: [],
            reject: reject,
            startTime: new Date,
            timeout: ms,
            addConsoleMessage: function (msg) {
                this.consoleLogs.push(getTimeStamp(new Date) + " : " + msg)
            },
            msRemaining: function () {
                const remaining = this.timeout - (new Date - this.startTime)
                if (remaining < 0) throw new Error(this.timeout + "ms timeout exceeded")
                return remaining
            }
        }

        const timer = setTimeout(() => {
            const err = new Error(`Timeout Error: ${msg}`)
            info.error = err
            err.consoleLogs = info.consoleLogs
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
            e.consoleLogs = info.consoleLogs
            reject(e)
        } finally {
            clearTimeout(timer)
        }
    })
}
const boolOrUndefined = function (par) {
    return (par === true || par === 'true') ? true : undefined
}
const combinePassword = function (email, password) {
    if (email.length + password.length <= 72) return email + password
    var result = crypto.createHash('sha1').update(JSON.stringify(email + password)).digest('hex')
    return result
}
module.exports = {
    arrayToSelectList,
    replaceAll,
    lookup,
    checkBoolean,
    checkBooleanOrUndefined,
    getTimeStamp,
    boolOrUndefined,
    runWithTimeout,
    waitFor,
    combinePassword,

}