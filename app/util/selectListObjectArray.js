module.exports = (strArray, value) => {

    return strArray.map(v => {
        return {
            value: v,
            selected: v.toLowerCase() === value.toLowerCase()
        }
    })

}