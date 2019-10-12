const bothPatternRegEx = /.*(@media \(min-width:(?: ?)([0-9]*)px\))(?:(?:.|\n)*?){(?:.|\n)*?(?:.*?)(?:(?:}})|(?:\n}\n))/g
const bracketRegEx = /}( |\n)*?}/g
const searchStr = "@media@"
const searchStrLen = 7
module.exports = function (css) {

  css = css.replace(/[\r\n]+/gm, "");
  css = css.replace(/[\n]+/gm, "");
  css = css.replace(/\/\*.*?\*\//g, "")
  css = css.replace(/  /gm, " ");
  css = css.replace(/@media /g, searchStr);
  css = css.replace(/@media@not /g, "@media@not@")
  css = css.replace(/@media@only /g, "@media@only@")
  css = css.replace(/@screen and \(/g, "@screen@and@(")
  css = css.replace(/@all and \(/g, "@all@and@(")
  css = css.replace(/@print and \(/g, "@print@and@(")
  css = css.replace(/@speech and \(/g, "@speech@and@(")
  css = css.replace(/[ ]+/gm, "");
  //fix white space between 2 brackets
  //css = css.replace(bracketRegEx, "}}")

  var newString = ""

  function convertPixels(p) {
    p = +p
    if (isNaN(p)) return 0
    return Math.floor(p * 0.75)
  }
  let location = css.indexOf(searchStr, 0)
  while (location != -1) {
    const end = css.indexOf("}}", location + searchStrLen)
    if (end < 1) return newString
    const fragment = css.substring(location, end + 2)
    //todo, make sure it contains width
    const outer = fragment.substr(1, fragment.indexOf("{"))

    //only px should be used with screen media type, only change width rules
    if (!outer.includes('width') || !outer.includes('px')) {
      location = css.indexOf(searchStr, location + searchStrLen)
      continue
    }

    const pxLocation = outer.indexOf("px", searchStrLen)
    const breakLocation = outer.lastIndexOf(":", pxLocation)
    const origPx = outer.substring(breakLocation + 1, pxLocation)
    const px = convertPixels(origPx)
    newString += '@' + outer.substring(0, breakLocation + 1).replace(/@/g, ' ') + px + outer.substr(pxLocation) + fragment.substr(outer.length + 1)
    location = css.indexOf(searchStr, location + searchStrLen)

  }
  // while (match != null) {
  //   if (match.length != 3) {
  //     match = bothPatternRegEx.exec(css)
  //     continue
  //   }
  //   var newPixels = convertPixels(match[2])
  //   if (newPixels == 0) {
  //     match = bothPatternRegEx.exec(css)
  //     continue
  //   }
  //   newString += match[0].replace(match[1], match[1].replace(match[2], newPixels))
  //   match = bothPatternRegEx.exec(css);
  // }
  return newString
}