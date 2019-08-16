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

module.exports = {
    arrayToSelectList,
    replaceAll,
    lookup

}