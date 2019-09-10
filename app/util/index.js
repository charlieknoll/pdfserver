const arrayToSelectList = function (strArray, value) {

    return selectList = strArray.map(v => {
        return {
            value: v,
            selected: v.toLowerCase() === value.toLowerCase()
        }
    })

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

module.exports = {
    arrayToSelectList,
    replaceAll,
    lookup,
    checkBoolean,
    getTimeStamp,
    cache

}