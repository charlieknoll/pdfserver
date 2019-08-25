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
    (document.head || document.body || document.documentElement).appendChild(css);
    this.cssEl = css

    //TODO add invisible form
    this.form = document.createElement("form");
    this.form.setAttribute("method", "post");
    this.form.setAttribute("action", this.hostName + "/convert");
    this.form.setAttribute("target", "responsive-paper-preview");
    var el = document.createElement("input");
    el.setAttribute("name", "value");
    el.setAttribute("id", "rp-value")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);
    el = document.createElement("input");
    el.setAttribute("name", "apikey");
    el.setAttribute("id", "rp-apikey")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);
    document.body.appendChild(this.form);

  },
  init: function () {
    rp.referenceCss(this.hostName + this.designerPath)

    //TODO Load apikey from chrome storage

    //TODO Check if css should be enabled for url

    //TODO add options listener to set options if changed, if preview invoked

  },
  toggleCss: function () {
    this.cssEl.disabled = !this.cssEl.disabled

  },
  prepCss: function (url) {
    //check if responsive paper can access url (ignore localhost, 127.0.0.1)
    //TODO, call server side to verify for non obvious urls
    if (
      !url.startsWith("https://localhost") &&
      !url.startsWith("http://localhost") &&
      !url.startsWith("https://127.0.0.1") &&
      !url.startsWith("http://127.0.0.1")
    ) return url


    //fetch css
    var css = await fetch("url").then(function (r) { return r.text() }).then(function (b) { return b })


    //base64 image urls and update css

    //hash it

    //check if hash exists

    //post it

    //return updated url
    return "http://test"

  },

  preview: function (waitForReady) {
    //TODO post HTML to pdfserver and open result in new tab (hidden button click?)
    var el = document.getElementById("rp-value")
    el.value = ''
    //el.value = new XMLSerializer().serializeToString(document)
    var clone = document.cloneNode(true)

    //TODO delete scripts
    var r = clone.getElementsByTagName('script');

    for (var i = (r.length - 1); i >= 0; i--) {
      r[i].parentNode.removeChild(r[i]);
    }

    r = clone.getElementsByTagName('form');

    for (var i = (r.length - 1); i >= 0; i--) {
      r[i].parentNode.removeChild(r[i]);
    }

    r = clone.getElementsByTagName('link');

    for (var i = (r.length - 1); i >= 0; i--) {
      if (r[i].rel.toLowerCase() == 'stylesheet') {
        r[i].href = this.prepCss(r[i].href)
      }
    }

    //TODO convert images, canvases



    el.value = clone.firstChild.outerHTML
    el = document.getElementById("rp-apikey")
    el.value = "HZNgn1OWoVnGee99FDDSqZGCh8K5erA4"
    this.form.submit()
    //TODO convert local css




  }



}
