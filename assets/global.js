"use-strict";

let subscribers = {};

function subscribe(eventName, callback) {
  if (subscribers[eventName] === undefined) {
    subscribers[eventName] = [];
  }

  subscribers[eventName] = [...subscribers[eventName], callback];

  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback;
    });
  };
}

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data);
    });
  }
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target?.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent('on' + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement('form');
  form.setAttribute('method', method);
  form.setAttribute('action', path);

  for (var key in params) {
    var hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', key);
    hiddenField.setAttribute('value', params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options['hideElement'] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    'change',
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = '';
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

var BlsAnimations = (function () {
  return {
    innit: function () {
      this.animates();
    },
    animates: function () {
      var animates = document.querySelectorAll(".scroll-trigger");
      if (animates.length > 0) {
        animates.forEach((i) => {
          i.addEventListener("animationend", (e) => {
            setTimeout(() => {
              e.target.setAttribute("animation-end", "");
            }, 1000);
          });
        });
      }
    },
  };
})();

let parser = new DOMParser();

const ON_CHANGE_DEBOUNCE_TIMER = 300;

const PUB_SUB_EVENTS = {
  cartUpdate: "cart-update",
  quantityUpdate: "quantity-update",
  variantChange: "variant-change",
};

class MotionElement extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (this.isHold) return;
    this.preInitialize();
    if (this.dataset.noview) {
      return;
    }
    if (!this.isConnected || !document.body.contains(this)) {
      setTimeout(() => {
        this.connectedCallback();
      }, 100);
      return;
    }

    var _this = this;
    let custom_margin = this.dataset.margin || '0px 0px -5px 0px';
    let rootElement = {};
    if (this.dataset.parent) {
      var parent = this.closest(`.${this.dataset.parent}`);
      rootElement = { root: parent };
      custom_margin = '0px 0px 0px 0px';
    }
    motion.inView(
      _this,
      async () => {
        if (
          !this.isInstant &&
          this.mediaElements &&
          this.hasAttribute('data-image')
        ) {
          await imageReady(this.mediaElements);
        }
        setTimeout(() => {
          _this.initialize();
        }, 50);
      },
      { margin: custom_margin, ...rootElement }
    );
  }

  get isHold() {
    return this.hasAttribute('hold');
  }

  get Transition() {
    let transition = this.getAttribute('data-transition')
      ?.split(',')
      .map(Number);
    return transition || [0, 0, 0.3, 1];
  }

  get isInstant() {
    return this.hasAttribute('data-instantly');
  }

  get mediaElements() {
    return Array.from(this.querySelectorAll('img, iframe, svg'));
  }

  get animationType() {
    return this.dataset.motion || 'fade-up';
  }

  get animationDelay() {
    return parseInt(this.dataset.motionDelay || 0) / 1000;
  }

  set animationDelay(value) {
    this.dataset.motionDelay = value;
  }

  preInitialize() {
    if (this.isHold) return;
    switch (this.animationType) {
      case 'fade-in':
        motion.animate(this, { opacity: 0.01 }, { duration: 0 });
        break;

      case 'fade-up':
        motion.animate(
          this,
          { transform: 'translateY(2.5rem)', opacity: 0.01 },
          { duration: 0 }
        );
        break;

      case 'fade-up-sm':
        motion.animate(
          this,
          { transform: 'translateY(1rem)', opacity: 0.01 },
          { duration: 0 }
        );
        break;

      case 'fade-up-lg':
        motion.animate(
          this,
          { transform: 'translateY(4rem)', opacity: 0.01 },
          { duration: 0 }
        );
        break;

      case 'zoom-in':
        motion.animate(this, { transform: 'scale(0.8)' }, { duration: 0 });
        break;
      case 'zoom-in-lg':
        motion.animate(this, { transform: 'scale(0)' }, { duration: 0 });
        break;

      case 'zoom-out':
        motion.animate(this, { transform: 'scale(1.07)' }, { duration: 0 });
        break;

      case 'zoom-out-sm':
        motion.animate(this, { transform: 'scale(1.07)' }, { duration: 0 });
        break;
      case 'zoom-out-lg':
        motion.animate(this, { transform: 'scale(1.07)' }, { duration: 0 });
        break;
    }
  }

  async initialize() {
    if (this.isHold) return;
    switch (this.animationType) {
      case 'fade-in':
        await motion.animate(
          this,
          { opacity: 1 },
          { duration: 1.5, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;

      case 'fade-up':
        await motion.animate(
          this,
          { transform: 'translateY(0)', opacity: 1 },
          {
            duration: 0.5,
            delay: this.animationDelay,
            easing: this.transition,
          }
        ).finished;
        break;

      case 'fade-up-sm':
        await motion.animate(
          this,
          { transform: 'translateY(0)', opacity: 1 },
          {
            duration: 0.3,
            delay: this.animationDelay,
            easing: this.transition,
          }
        ).finished;
        break;

      case 'fade-up-lg':
        await motion.animate(
          this,
          { transform: 'translateY(0)', opacity: 1 },
          {
            duration: 0.5,
            delay: this.animationDelay,
            easing: this.transition,
          }
        ).finished;
        break;

      case 'zoom-in':
        await motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1.3, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;

      case 'zoom-in-lg':
        await motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 0.5, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;

      case 'zoom-out':
        await motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1.5, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;

      case 'zoom-out-sm':
        await motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;
      case 'zoom-out-lg':
        await motion.animate(
          this,
          { transform: 'scale(1)' },
          { duration: 1, delay: this.animationDelay, easing: this.transition }
        ).finished;
        break;
    }
  }
  refreshAnimation() {
    this.removeAttribute('hold');
    this.preInitialize();
    setTimeout(() => {
      this.initialize();
    }, 50); // Delay a bit to make animation re init properly.
  }
}
customElements.define('motion-element', MotionElement);

var BlsLazyloadImg = (function () {
  return {
    init: function () {
      this.lazyReady();
    },
    lazyReady: function () {
      if (!!window.IntersectionObserver) {
        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const onImageLoad = (e) => {
                  const target = e.currentTarget;
                  setTimeout(() => {
                    target
                      ?.closest('motion-element')
                      ?.classList.remove('bls-loading-image');
                    target?.classList.remove('bls-loading-image');
                  }, 600);
                  e.currentTarget.removeEventListener('load', onImageLoad);
                };
                entry.target.width = entry.boundingClientRect.width;
                entry.target.height = entry.boundingClientRect.height;
                entry.target.sizes = `${entry.boundingClientRect.width}px`;
                entry.target.addEventListener('load', onImageLoad);
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: '10px' }
        );
        document.querySelectorAll('.bls-image-js img').forEach((img) => {
          observer.observe(img);
        });
      }
    },
  };
})();
BlsLazyloadImg.init();

class SlideSection extends HTMLElement {
  constructor() {
    super();
    this.globalSlide = null;
    this.init();
  }

  init() {
    if (document.body.classList.contains("index")) {
      let pos = window.pageYOffset;
      if (pos > 0 || document.body.classList.contains("swiper-lazy")) {
        this.initSlide();
      } else {
        if (this.classList.contains("lazy-loading-swiper-before")) {
          this.initSlide();
        } else {
          this.classList.add("lazy-loading-swiper-after");
        }
      }
    } else {
      this.initSlide();
    }
  }

  initSlide() {
    const _this = this;
    var autoplaying = _this?.dataset.autoplay === "true";
    const loop = _this?.dataset.loop === "true";
    const itemDesktop = _this?.dataset.desktop ? _this?.dataset.desktop : 4;
    var itemTablet = _this?.dataset.tablet ? _this?.dataset.tablet : "";
    const itemMobile = _this?.dataset.mobile ? _this?.dataset.mobile : 1;
    const direction = _this?.dataset.direction ? _this?.dataset.direction : 'horizontal';
    var autoplaySpeed = _this?.dataset.autoplaySpeed
      ? _this?.dataset.autoplaySpeed * 1000
      : 3000;
    var speed = _this?.dataset.speed ? _this?.dataset.speed : 400;
    const effect = _this?.dataset.effect ? _this?.dataset.effect : "slide";
    const row = _this?.dataset.row ? _this?.dataset.row : 1;
    var spacing = _this?.dataset.spacing ? _this?.dataset.spacing : 30;
    const progressbar = _this?.dataset.paginationProgressbar === "true";
    const autoItem = _this?.dataset.itemMobile === "true";
    const arrowCenterimage = _this?.dataset.arrowCenterimage
      ? _this?.dataset.arrowCenterimage
      : 0;
    spacing = Number(spacing);
    autoplaySpeed = Number(autoplaySpeed);
    speed = Number(speed);
    if (autoplaying) {
      autoplaying = { delay: autoplaySpeed };
    }
    if (!itemTablet) {
      if (itemDesktop < 2) {
        itemTablet = 1;
      } else if (itemDesktop < 3) {
        itemTablet = 2;
      } else {
        itemTablet = 3;
      }
    }
    if (direction == "vertical") {
      _this.style.maxHeight = _this.offsetHeight + "px";
    }
    this.globalSlide = new Swiper(_this, {
      slidesPerView: autoItem ? "auto" : itemMobile,
      spaceBetween: spacing >= 15 ? 15 : spacing,
      autoplay: autoplaying,
      direction: direction,
      loop: loop,
      effect: effect,
      speed: speed,
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      grid: {
        rows: row,
        fill: "row",
      },
      navigation: {
        nextEl: _this.querySelector(".swiper-button-next"),
        prevEl: _this.querySelector(".swiper-button-prev"),
      },
      pagination: {
        clickable: true,
        el: _this.querySelector(".swiper-pagination"),
        type: progressbar ? "progressbar" : "bullets",
      },
      breakpoints: {
        768: {
          slidesPerView: itemTablet,
          spaceBetween: spacing >= 30 ? 30 : spacing,
        },
        1025: {
          slidesPerView: itemDesktop,
          spaceBetween: spacing,
        },
      },
      thumbs: {
        swiper: this.thumbnailSlide ? this.thumbnailSlide : null,
      },

      on: {
        init: function () {
          var sec__tiktok = _this.closest(".sec__tiktok-video");
          if (sec__tiktok) {
            _this.initSecTiktok(sec__tiktok);
            window.addEventListener("resize", function () {
              setTimeout(() => {
                _this.initSecTiktok(sec__tiktok);
              }, 150);
            });
          }
          if (arrowCenterimage) {
            var items_slide = _this.querySelectorAll(
              ".product-item__media--ratio"
            );
            if (items_slide.length != 0) {
              var oH = [];
              items_slide.forEach((e) => {
                oH.push(e.offsetHeight / 2);
              });
              var max = Math.max(...oH);
              var arrowsOffset = "--arrows-offset-top: " + max + "px";
              if (_this.querySelectorAll(".swiper-arrow")) {
                _this.querySelectorAll(".swiper-arrow").forEach((arrow) => {
                  arrow.setAttribute("style", arrowsOffset);
                });
              }
            }
          }
          var video = _this.querySelector("video.slideshow")
          if(video){
            const handleIntersection = (entries, observer) => {
              if (!entries[0].isIntersecting) return;
              observer.unobserve(_this);
              const videos = _this.querySelectorAll("video");
              window.addEventListener("resize" , (e) => {
                videos.forEach((video) => {
                  const posterDesktop = video.dataset.posterdesktop
                  const postermobile = video.dataset.postermobile
                  const width = window.innerWidth;  
                  if(posterDesktop &&  postermobile) {
                    if(width > 768){
                      video.poster = `${posterDesktop}`
                     } else{
                       video.poster = `${postermobile}`
                     }
                  }
                });
                 
              })
              videos.forEach((video) => {
                const dataSrc = video.dataset.src;
                const posterDesktop = video.dataset.posterdesktop
                const postermobile = video.dataset.postermobile
                const width = window.innerWidth;
              
                if (dataSrc) {
                   video.src = dataSrc;
                  if(posterDesktop &&  postermobile) {
                    if(width > 768 ){
                      video.poster = `${posterDesktop}`
                     } else{
                       video.poster = `${postermobile}`
                     }
                  }
         
                  video.removeAttribute("data-src");
                }
              });
            };
            new IntersectionObserver(handleIntersection.bind(_this), {
              rootMargin: "0px 0px 200px 0px",
            }).observe(_this);
          }
          
        },
        realIndexChange: function (swiper) {
          const swiperSlide = _this.querySelector(".no-preload");
          swiperSlide?.classList.remove("no-preload");
        },
        slideChange: function () {
          const index_currentSlide = this.realIndex + 1;
          if (_this.closest(".sec__testimonials-single")) {
            const allDots = _this
              .closest(".sec__testimonials-single")
              .querySelectorAll(`single-item`);
            allDots.forEach((dot) => {
              dot.classList.remove("active");
            });
            _this
              .closest(".sec__testimonials-single")
              .querySelector(
                ".testimonials-author-image[data-position='" +
                  index_currentSlide +
                  "']"
              )
              .classList.add("active");
          }
        },
      },
    });
  }
  functionGoto = (position) => {
    this.globalSlide.slideTo(position - 1, 500);
  }

  initSecTiktok(sec) {
    sec.querySelectorAll(".swiper-slide").forEach((arrow) => {
      const tiktok = arrow.querySelector(".section_tiktok-image");
      let width = "--item-width: " + arrow.offsetWidth;
      tiktok.setAttribute("style", width);
    });
  }
}
customElements.define("slide-section", SlideSection);

class PopupBase extends HTMLElement {
  constructor() {
    super();
    this.customClass = this.dataset.customClass;
    this.modal = null;
  }

  initPopup(content, text, customClass) {
    const _this = this;
    this.modal = new tingle.modal({
      footer: false,
      stickyFooter: false,
      closeMethods: ["overlay", "button", "escape"],
      cssClass: [this.customClass || customClass],
      onOpen: function () {
        const video = this.modalBox.querySelector("video");
        if (!video) return;
        video.play();
        if (this.modal.classList.contains('shopable-video')) {
          video.muted = false
        }
      },
      onClose: function () {},
      beforeClose: function () {
        _this.onCloseEvent();
        return true;
      },
    });
    this.modal.setHeader = function (content) {
      let popup_content = this.modalBoxContent;
      let popup_header = document.createElement("div");
      popup_header.classList.add("tingle-modal-box__header");
      popup_header.innerHTML = content;
      let parentElement = popup_content.parentNode;
      parentElement.insertBefore(popup_header, popup_content);
    };
    if (text) {
      this.modal.setHeader(text);
    }

    this.modal.setContent(content);
    this.modal.open();
  }

  onClose() {
    this.modal.close();
  }
  onCloseEvent() {}
}

class SwatchInit extends HTMLElement {
  constructor() {
    super();
    this.options = null;
    this.init();
  }

  init() {
    const _this = this;
    this.querySelectorAll(".product__color-swatches--js").forEach((btn) => {
      _this.checkSwatches(btn);
    });
  }
  checkSwatches(e) {
    const { color, image, customValue, swatchType, optionSwatchValue } = e.dataset;
    if (color) {
      if (swatchType != "variant_images") {
        if (optionSwatchValue.length == 0 || optionSwatchValue == null) {
          if (this.checkColor(color)) {
            e.style.backgroundColor = color;
            e.classList.add(customValue);
          } else {
            e.classList.add(customValue);
            if (image) {
              e.classList.add("color__" + color.replace(" ", "-"));
              e.style.backgroundColor = null;
              e.style.backgroundImage = "url('" + image + "')";
              e.style.backgroundSize = "cover";
              e.style.backgroundRepeat = "no-repeat";
            }
          }
        }else{
          e.style.setProperty('--swatch--background', optionSwatchValue);
        }  
      } else {
        if (optionSwatchValue.length == 0 || optionSwatchValue == null) {
          if (image) {
            e.classList.add("color__" + color.replace(" ", "-"));
            e.style.backgroundColor = null;
            e.style.backgroundImage = "url('" + image + "')";
            e.style.backgroundSize = "cover";
            e.style.backgroundRepeat = "no-repeat";
          } else if (this.checkColor(color)) {
            e.style.backgroundColor = color;
            e.classList.add(customValue);
          } else {
            e.classList.add(customValue);
          }
        }else{
          e.style.setProperty('--swatch--background', optionSwatchValue);
        }
      }
    }
  }
  checkColor(strColor) {
    var s = new Option().style;
    s.color = strColor;
    return s.color == strColor;
  }
  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll(".product__color-swatches--js.active"),
      (select) => select.getAttribute("data-value")
    );
    this.variantData.find((variant) => {
      if (this.options.length == 1) {
        const variantOptions = {
          1: variant.option1,
          2: variant.option2,
          3: variant.option3,
        };
        if (variantOptions[this.position_swatch] === this.options[0]) {
          this.options = variant.options;
        }
      }
    });
  }
  updateMasterId(variantData) {
    return (this.currentVariant = variantData.find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    }));
  }
}

// js for 3d product - not done yet
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );
      if (focus) deferredElement.focus();
      if (
        deferredElement.nodeName == "VIDEO" &&
        deferredElement.getAttribute("autoplay")
      ) {
        deferredElement.play();
      }
    }
  }
}

function handleErrorMessagePopup(errorMessage = false) {
  const url = `${window.location.pathname}?section_id=form-message`;
  fetch(url)
    .then((response) => response.text())
    .then((responseText) => {
      const html = new DOMParser().parseFromString(responseText, "text/html");
      const elementErrorMessage = html.querySelector(
        ".product-form__error-message-wrapper"
      );
      const elementMessage = elementErrorMessage.querySelector(
        ".product-form__error-message"
      );
      elementMessage.textContent = errorMessage;
      showToast(elementErrorMessage.innerHTML, 5000, "modal-error");
    })
    .catch((e) => {
      throw e;
    });
}

function showToast(message, duration = 3000, customClass = "") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast show ${customClass}`;
  toast.innerHTML = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    closeToast(toast);
  }, duration);
}

function closeToast(toast) {
  toast.classList.remove("show");
  setTimeout(() => {
    toast.remove();
    if (!document.querySelector("#toast-container .toast")) {
      document.getElementById("toast-container").remove();
    }
  }, 500);
}

class SlideLazyLoad {
  constructor(e) {
    (this.triggerEventsJs = e), (this.eventOptionsJs = { passive: !0 }), (this.userEventListenerJs = this.triggerListenerJs.bind(this)), (this.delayedScriptsJs = { normal: [], async: [], defer: [] });
  }
  triggerListenerJs() {
      this._removeUserInteractionListenerJs(this), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", this._loadEverythingReadyNow.bind(this)) : this._loadEverythingReadyNow();
  }
  _removeUserInteractionListenerJs(e) {
      this.triggerEventsJs.forEach((t) => window.removeEventListener(t, e.userEventListenerJs, e.eventOptionsJs));
  }
  _addUserInteractionListenerJs(e) {
      this.triggerEventsJs.forEach((t) => window.addEventListener(t, e.userEventListenerJs, e.eventOptionsJs));
  }
  _preloadAllScriptsJs() {
    document.body.classList.add("swiper-lazy");
    document.body.classList.add("review-lazy");
    const loadingSwiper = document.querySelectorAll('.lazy-loading-swiper-after');
    loadingSwiper.forEach((el) => {
      el.classList.remove("lazy-loading-swiper-after");
      this.initSlide(el);
    });
    const reviewProduct = document.querySelectorAll('.review-product-added');
    reviewProduct.forEach((el) => {
      el.classList.remove("review-product-added");
      el.innerHTML = el.querySelector(".product-review-json").innerHTML;
      el.classList.remove("inline-loading");
    });
  }

  initSlide(el) {
    const _this = el;
    var autoplaying = _this?.dataset.autoplay === "true";
    const loop = _this?.dataset.loop === "true";
    const itemDesktop = _this?.dataset.desktop ? _this?.dataset.desktop : 4;
    var itemTablet = _this?.dataset.tablet ? _this?.dataset.tablet : "";
    const itemMobile = _this?.dataset.mobile ? _this?.dataset.mobile : 1;
    const direction = _this?.dataset.direction
      ? _this?.dataset.direction
      : "horizontal";
    var autoplaySpeed = _this?.dataset.autoplaySpeed
      ? _this?.dataset.autoplaySpeed * 1000
      : 3000;
    var speed = _this?.dataset.speed ? _this?.dataset.speed : 400;
    const effect = _this?.dataset.effect ? _this?.dataset.effect : "slide";
    const row = _this?.dataset.row ? _this?.dataset.row : 1;
    var spacing = _this?.dataset.spacing ? _this?.dataset.spacing : 30;
    const progressbar = _this?.dataset.paginationProgressbar === "true";
    const autoItem = _this?.dataset.itemMobile === "true";
    const arrowCenterimage = _this?.dataset.arrowCenterimage
      ? _this?.dataset.arrowCenterimage
      : 0;
    spacing = Number(spacing);
    autoplaySpeed = Number(autoplaySpeed);
    speed = Number(speed);
    if (autoplaying) {
      autoplaying = { delay: autoplaySpeed };
    }
    if (!itemTablet) {
      if (itemDesktop < 2) {
        itemTablet = 1;
      } else if (itemDesktop < 3) {
        itemTablet = 2;
      } else {
        itemTablet = 3;
      }
    }
    if (direction == "vertical") {
      _this.style.maxHeight = _this.offsetHeight + "px";
    }
    _this.globalSlide = new Swiper(_this, {
      slidesPerView: autoItem ? "auto" : itemMobile,
      spaceBetween: spacing >= 15 ? 15 : spacing,
      autoplay: autoplaying,
      direction: direction,
      loop: loop,
      effect: effect,
      speed: speed,
      watchSlidesProgress: true,
      watchSlidesVisibility: true,
      grid: {
        rows: row,
        fill: "row",
      },
      navigation: {
        nextEl: _this.querySelector(".swiper-button-next"),
        prevEl: _this.querySelector(".swiper-button-prev"),
      },
      pagination: {
        clickable: true,
        el: _this.querySelector(".swiper-pagination"),
        type: progressbar ? "progressbar" : "bullets",
      },
      breakpoints: {
        768: {
          slidesPerView: itemTablet,
          spaceBetween: spacing >= 30 ? 30 : spacing,
        },
        1025: {
          slidesPerView: itemDesktop,
          spaceBetween: spacing,
        },
      },
      thumbs: {
        swiper: this.thumbnailSlide ? this.thumbnailSlide : null,
      },

      on: {
        init: function () {
          var sec__tiktok = _this.closest(".sec__tiktok-video");
          if (sec__tiktok) {
            _this.initSecTiktok(sec__tiktok);
            window.addEventListener("resize", function () {
              setTimeout(() => {
                _this.initSecTiktok(sec__tiktok);
              }, 150);
            });
          }
          if (arrowCenterimage) {
            var items_slide = _this.querySelectorAll(
              ".product-item__media--ratio"
            );
            if (items_slide.length != 0) {
              var oH = [];
              items_slide.forEach((e) => {
                oH.push(e.offsetHeight / 2);
              });
              var max = Math.max(...oH);
              var arrowsOffset = "--arrows-offset-top: " + max + "px";
              if (_this.querySelectorAll(".swiper-arrow")) {
                _this.querySelectorAll(".swiper-arrow").forEach((arrow) => {
                  arrow.setAttribute("style", arrowsOffset);
                });
              }
            }
          }
        },
        slideChange: function () {
          const index_currentSlide = this.realIndex + 1;
          if (_this.closest(".sec__testimonials-single")) {
            const allDots = _this
              .closest(".sec__testimonials-single")
              .querySelectorAll(`single-item`);
            allDots.forEach((dot) => {
              dot.classList.remove("active");
            });
            _this
              .closest(".sec__testimonials-single")
              .querySelector(
                ".testimonials-author-image[data-position='" +
                  index_currentSlide +
                  "']"
              )
              .classList.add("active");
          }
        },
      },
    });
  }

  async _loadEverythingReadyNow() {
    this._preloadAllScriptsJs(),
    await this._loadScriptsFromListJs(this.delayedScriptsJs.normal),
    await this._loadScriptsFromListJs(this.delayedScriptsJs.defer),
    await this._loadScriptsFromListJs(this.delayedScriptsJs.async),
    await this._triggerDOMContentLoadedJs(),
    await this._triggerWindowLoadJs(),
    window.dispatchEvent(new Event("milanospeed-allScriptsLoaded"));
  }
  async _loadScriptsFromListJs(e) {
    const t = e.shift();
    return t ? (await this._transformScript(t), this._loadScriptsFromListJs(e)) : Promise.resolve();
  }
  async _transformScript(e) {
    return (
        await this._requestAnimFrame(),
        new Promise((t) => {
            const s = document.createElement("script");
            let n;
            [...e.attributes].forEach((e) => {
                let t = e.nodeName;
                "type" !== t && ("data-milanolazy-type" === t && ((t = "type"), (n = e.nodeValue)), s.setAttribute(t, e.nodeValue));
            }),
                e.hasAttribute("src") ? (s.addEventListener("load", t), s.addEventListener("error", t)) : ((s.text = e.text), t()),
                e.parentNode.replaceChild(s, e);
        })
    );
  }
  async _triggerDOMContentLoadedJs() {
    (this.domReadyFired = !0),
    await this._requestAnimFrame(),
    document.dispatchEvent(new Event("milanospeed-DOMContentLoaded")),
    await this._requestAnimFrame(),
    window.dispatchEvent(new Event("milanospeed-DOMContentLoaded")),
    await this._requestAnimFrame(),
    document.dispatchEvent(new Event("milanospeed-readystatechange")),
    await this._requestAnimFrame(),
    document.milanoonreadystatechange && document.milanoonreadystatechange();
  }
  async _triggerWindowLoadJs() {
    await this._requestAnimFrame(),
    window.dispatchEvent(new Event("milanospeed-load")),
    await this._requestAnimFrame(),
    window.milanoonload && window.milanoonload(),
    await this._requestAnimFrame(),
    window.dispatchEvent(new Event("milanospeed-pageshow")),
    await this._requestAnimFrame(),
    window.milanoonpageshow && window.milanoonpageshow();
  }
  async _requestAnimFrame() {
    return new Promise((e) => requestAnimationFrame(e));
  }
  static run() {
    const e = new SlideLazyLoad(["keydown", "mousemove", "touchmove", "touchstart", "touchend", "wheel"]);
    e._addUserInteractionListenerJs(e);
  }
}
SlideLazyLoad.run();

// js for copy button
class CopyButton extends HTMLElement {
  constructor() {
    super();
    this.content = this.dataset.content;
    this.init();
  }
  init() {
    if (this.content) {
      this.addEventListener("click", this.onClick.bind(this));
    }
  }
  onClick() {
    navigator.clipboard.writeText(this.content);
    this.classList.add("copied");
  }
  updateUrl(newContent) {
    this.content = newContent;
  }
}
customElements.define("copy-button", CopyButton);