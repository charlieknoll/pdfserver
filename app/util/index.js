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

module.exports = {
    arrayToSelectList,
    replaceAll

}