const arrayToSelectList = function (strArray, value) {

    return strArray.map(v => {
        return {
            value: v,
            selected: v.toLowerCase() === value.toLowerCase()
        }
    })
}


module.exports = {
    arrayToSelectList

}