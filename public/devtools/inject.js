//TODO add designer css as disabled

//read storage and detect if it should be enabled


var rp = {
  designerUrl: "http://localhost:3000/devtools/responsive-paper.designer.css",
  apiKey: "",
  includeConole: true,
  cssEl: undefined,
  referenceCss: function (url) {
    var css = document.createElement('link');
    css.setAttribute('href', url);
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('disabled', true);
    (document.body || document.head || document.documentElement).appendChild(css);
    this.cssEl = css

  },
  init: function () {
    rp.referenceCss(this.designerUrl)

    //TODO Load apikey from chrome storage

    //TODO Check if css should be enabled for url

    //TODO add options listener to set options if changed, if preview invoked

  },
  toggleCss: function () {
    this.cssEl.disabled = !this.cssEl.disabled

  },
  preview: function () {
    //TODO post HTML to pdfserver and open result in new tab (hidden button click?)

    //TODO add support for local debug pdfserver

    //TODO convert local css

    //TODO convert images

    //TODO convert background images in css



  }



}

rp.init()

rp.toggleCss()