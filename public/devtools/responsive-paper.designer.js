//TODO add designer css as disabled

//read storage and detect if it should be enabled


var rpDesigner = {
  options: {
    serverUrl: "https://responsivepaper.com",
    tunnelHostUrl: null,
    apiKey: "",
    includeConsole: true,
    waitForReadyToRender: true,
    waitForReadyToRenderTimeout: 20000,
    applyResponsivePaperCss: false,
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
    el = document.createElement("input");
    el.setAttribute("name", "waitForReadyToRender");
    el.setAttribute("id", "rp-waitForReadyToRender")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);
    el = document.createElement("input");
    el.setAttribute("name", "waitForReadyToRenderTimeout");
    el.setAttribute("id", "rp-waitForReadyToRenderTimeout")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);
    el = document.createElement("input");
    el.setAttribute("name", "disableCache");
    el.setAttribute("id", "rp-disableCache")
    el.setAttribute("type", "hidden");
    this.form.appendChild(el);

    document.body.appendChild(this.form);

  },
  init: function (opt) {
    Object.assign(this.options, opt)

    this.referenceCss(this.options.serverUrl + this.designerPath)
    this.addHiddenForm()
    if (opt.applyResponsivePaperCss) this.toggleAll()
    if (!opt.tunnelHostUrl) {
      console.log("Responsive Paper error: tunnelHostUrl not set on options. Please see getting started guide for help")

    }
    if (!opt.apiKey) console.log("Responsive Paper error: apiKey not set on options. Please see getting started guide for help")
    if (opt.autoPreview) {
      this.waitTime = 0
      this.preview()
    }
  },
  toggleAll: function () {
    this.toggleParents(!this.cssEl.disabled)
    this.cssEl.disabled = !this.cssEl.disabled
  },
  toggleCss: function () {
    this.cssEl.disabled = !this.cssEl.disabled
  },

  toggleParents: function (show) {

    function toggleChildren(parent, child) {
      Array.prototype.map.call(parent.children, function (parentChild) {
        if (child === parentChild) {
          show ? parent.classList.remove('rp-outside-parent') : parent.classList.add('rp-outside-parent')
        }
        else {
          parentChild.style.display = show ? 'inherit' : 'none'
        }
      });
      if (parent.parentNode && parent.nodeName !== 'BODY') toggleChildren(parent.parentNode, parent)
    }
    const pageEls = document.getElementsByClassName('rp-page')
    if (pageEls.length !== 1) {
      console.log("ERROR: rp-page element not found")
      return
    }
    toggleChildren(pageEls[0].parentNode, pageEls[0])
    pageEls[0].classList.add('rp-render')
    pageEls[0].parentNode.classList.add('rp-pdf')

  },
  preview: function () {

    if (!window.RESPONSIVE_PAPER_READY_TO_RENDER && this.options.waitForReadyToRender) {
      //TODO add READY_TO_RENDER TIMEOUT
      if (!this.waitTime) this.waitTime = 0 //just in case preview is called manually
      this.waitTime += 100
      if (this.waitTime > this.options.waitForReadyToRenderTimeout) {
        console.log(this.options.waitForReadyToRenderTimeout + "ms timeout exceeded waiting for window.RESPONSIVE_PAPER_READY_TO_RENDER === true")
        return
      }
      setTimeout(this.preview.bind(this), 100)
      return
    }
    var el = document.getElementById("rp-value")

    el.value = window.location.href.replace(window.location.origin, this.options.tunnelHostUrl)

    el = document.getElementById("rp-apikey")
    el.value = this.options.apiKey
    el = document.getElementById("rp-include-console")
    el.value = this.options.includeConsole ? "on" : "off"
    el = document.getElementById("rp-waitForReadyToRender")
    el.value = this.options.waitForReadyToRender
    el = document.getElementById("rp-waitForReadyToRenderTimeout")
    el.value = this.options.waitForReadyToRenderTimeout
    el = document.getElementById("rp-disableCache")
    el.value = this.options.disableCache

    this.form.submit()

  }
}
