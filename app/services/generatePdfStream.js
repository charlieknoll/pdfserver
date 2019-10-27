const PDFWStreamForBuffer = require('./PDFWStreamForBuffer')
const hummus = require('hummus');

module.exports = async function generatePdfStream(timeoutInfo, page, pdfOptions, pageTitle) {

  const paperSizesByPage = await page.evaluate(() => rp.getPagePaperTypes())

  const paperSizes = paperSizesByPage.filter((ps, i, a) => a.indexOf(ps) === i)

  let pdfStreams = {}
  for (var i = 0; i < paperSizes.length; i++) {
    const newPdfOptions = await page.evaluate((paperType) => rp.showPaperType(paperType), paperSizes[i])
    Object.assign(pdfOptions, newPdfOptions)
    //Don't set margins this way?
    pdfOptions.margin = {
      top: pdfOptions.marginTop,
      right: pdfOptions.marginRight,
      bottom: pdfOptions.marginBottom,
      left: pdfOptions.marginLeft
    }
    //pdfOptions.preferCSSPageSize = true
    pdfOptions.dpi = 96
    pdfStreams[paperSizes[i]] = await page.pdf(pdfOptions)
    timeoutInfo.requestLog.file_size += pdfStreams[paperSizes[i]].length
    if (timeoutInfo.error) return
  }

  if (timeoutInfo.error) return
  //throw error here to test logs
  //throw new Error('test')
  if (paperSizes.length === 1) {
    return { content: pdfStreams[paperSizes[0]], pageTitle, consoleLogs: timeoutInfo.consoleLogs }
  }

  const writeStream = new PDFWStreamForBuffer()
  const pdfWriter = hummus.createWriter(writeStream)
  let cPaperSize = paperSizesByPage[0]
  let pagesToWrite = 1
  for (var i = 0; i < paperSizesByPage.length - 1; i++) {

    if (paperSizesByPage[i + 1] !== cPaperSize) {
      //write out previous index through previ
      const bufferStream = new hummus.PDFRStreamForBuffer(pdfStreams[cPaperSize])
      pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage ? pdfStreams[cPaperSize].nextPage : 0
      pdfWriter.appendPDFPagesFromPDF(bufferStream,
        { type: hummus.eRangeTypeSpecific, specificRanges: [[pdfStreams[cPaperSize].nextPage, pdfStreams[cPaperSize].nextPage + pagesToWrite - 1]] })
      pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage + pagesToWrite
      pagesToWrite = 1
      cPaperSize = paperSizesByPage[i + 1]
    }
    else {
      pagesToWrite++
    }
  }
  //Write out last page
  const bufferStream = new hummus.PDFRStreamForBuffer(pdfStreams[cPaperSize])
  pdfStreams[cPaperSize].nextPage = pdfStreams[cPaperSize].nextPage ? pdfStreams[cPaperSize].nextPage : 0
  pdfWriter.appendPDFPagesFromPDF(bufferStream,
    { type: hummus.eRangeTypeSpecific, specificRanges: [[pdfStreams[cPaperSize].nextPage, pdfStreams[cPaperSize].nextPage + pagesToWrite - 1]] })

  pdfWriter.end()
  if (timeoutInfo.error) return
  return { content: writeStream.buffer, pageTitle, consoleLogs: timeoutInfo.consoleLogs }




}