//TODO add designer css as disabled

//read storage and detect if it should be enabled


var rp = {
  hostName: "http://localhost:3000",
  designerPath: "/devtools/responsive-paper.designer.css",
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

    //TODO add invisible form
    this.form = document.createElement("form");
    this.form.setAttribute("method", "post");
    this.form.setAttribute("action", this.hostName + "/convert");
    this.form.setAttribute("target", "responsive-paper-preview");
    var el = document.createElement("input");
    el.setAttribute("name", "value");
    el.setAttribute("id", "rp-value")
    this.form.appendChild(el);
    document.body.appendChild(this.form);
  },
  init: function () {
    rp.referenceCss(this.hostName + this.designerUrl)

    //TODO Load apikey from chrome storage

    //TODO Check if css should be enabled for url

    //TODO add options listener to set options if changed, if preview invoked

  },
  toggleCss: function () {
    this.cssEl.disabled = !this.cssEl.disabled

  },
  preview: function (waitForReady) {
    //TODO post HTML to pdfserver and open result in new tab (hidden button click?)
    var el = document.getElementById("rp-value")
    //el.value = new XMLSerializer().serializeToString(document)

    //TODO delete scripts

    //TODO Wait for ready if waitForReady



    el.value = document.documentElement.outerHTML
    this.form.submit()
    //TODO convert local css

    //TODO delete css links

    //TODO convert images

    //TODO convert background images in css



  }



}

rp.init()

rp.toggleCss()

rp.preview(true)