//TODO add designer css as disabled

//read storage and detect if it should be enabled


var rpDesigner = {
  options: {
    serverUrl: "https://responsivepaper.com",
    tunnelHostUrl: null,
    apiKey: "",
    includeConsole: true,
    waitForReadyToRender: true,
    applyResponsivePaperCss: true,
    autoPreview: true
  },
  designerPath: "/devtools/responsive-paper.designer.css",
  cssEl: undefined,
  referenceCss: function (url) {
    var css = document.createElement('link');
    css.setAttribute('href', url);
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('disabled', true);
    (document.head || document.body || document.documentElement).appendChild(css);
    this.cssEl = css



  },
  addHiddenForm: function () {
    //TODO add debug/include logs

    this.form = document.createElement("form");
    this.form.setAttribute("method", "post");
    this.form.setAttribute("action", this.options.serverUrl + "/convert");
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
    el = document.createElement("input");
    el.setAttribute("name", "includeConsole");
    el.setAttribute("id", "rp-include-console")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);
    document.body.appendChild(this.form);

  },
  init: function (opt) {
    Object.assign(this.options, opt)

    this.referenceCss(this.options.serverUrl + this.designerPath)
    this.addHiddenForm()
    if (!opt.tunnelHostUrl) console.log("Responsive Paper error: tunnelHostUrl not set on options. Please see getting started guide for help")
    if (!opt.apiKey) console.log("Responsive Paper error: apiKey not set on options. Please see getting started guide for help")
    if (opt.applyResponsivePaperCss) this.toggleCss()
    if (opt.autoPreview) {
      this.preview()
    }
  },
  toggleCss: function () {
    this.cssEl.disabled = !this.cssEl.disabled
  },
  preview: function () {

    if (!window.RESPONSIVE_PAPER_READY_TO_RENDER && this.options.waitForReadyToRender) {
      setTimeout(this.preview, 100)
      return
    }
    var el = document.getElementById("rp-value")

    el.value = window.location.href.replace(window.location.origin, this.options.tunnelHostUrl)

    el = document.getElementById("rp-apikey")
    el.value = this.options.apiKey
    el = document.getElementById("rp-include-console")
    el.value = this.options.includeConsole ? "on" : "off"
    this.form.submit()

  }
}
