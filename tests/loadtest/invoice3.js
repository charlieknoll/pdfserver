//GET: https://www.responsivepaper.com/api/html2pdf/v2
//loadtest command: (-n number of requests, c = concurrency)
//loadtest -n 30 -c 10 -k -T application/x-www-form-urlencoded -p tests/loadtest/invoice3.js https://www.responsivepaper.com/api/html2pdf/v2
//run top on server: https://www.omgubuntu.co.uk/2011/11/5-system-monitoring-tools-for-ubuntu

module.exports = function (requestId) {
  //console.log('RequestId: ' + requestId)
  return 'value=https%3A%2F%2Fexamples.responsivepaper.com%2Finvoice&apikey=xyxJ4NJUQbeGTGCQ6Ox0Zx4phDbfu0na&waitForReadyToRender=true&includeConsole=false&timeout=40000';
  // return {
  //   value: 'https://examples.responsivepaper.com/invoice',
  //   apikey: 'wFhRvsXmr9ukvWLa2ZT9M1rSyFJMx0vU',
  //   waitForReadyToRender: true,
  //   includeConsole: false

  // }
}