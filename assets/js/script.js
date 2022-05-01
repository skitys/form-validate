$(function () {
   // tab切り替え
  function localSwitchTab() {
    class SwitchTab {
      constructor(obj) {

        this.$active_cnt = $(obj.id).find(this.stateClass.cnt_$)
        this.$active_btn = $(obj.id).find(this.selectorJs.btn)
        this.$tab = $(obj.id).find(this.selectorJs.tab)

        this.$label = $(obj.id).find(this.selectorJs.btn)

      }

      get selectorJs() {
        return {
          btn: ".js-switchTabBtn",
          tab: ".js-switchTab"
        }
      }

      get stateClass() {
        return {
          list_l: "is-left",
          list_r: "is-right",
          btn: "is-btn-active",
          cnt: "is-tabCnt-active",
          cnt_$: ".is-tabCnt-active"
        }
      }
      switchCorrent(evt) {
        // contentの切り替え
        $(this.stateClass.cnt_$).removeClass(this.stateClass.cnt)

        this.$active_cnt = document.getElementById(evt.currentTarget.dataset.id)
        this.$active_cnt.classList.add(this.stateClass.cnt)

        // labelの left right 切り替え
        evt.currentTarget.dataset.position == "right" && this.$tab.removeClass(this.stateClass.list_l).addClass(this.stateClass.list_r)
        evt.currentTarget.dataset.position == "left" && this.$tab.removeClass(this.stateClass.list_r).addClass(this.stateClass.list_l)

      }
      set current(evt) {
        // btnの切り替え
        if (evt.currentTarget.classList.contains(this.stateClass.btn)) {
          return
        } else {
          this.$active_btn.removeClass(this.stateClass.btn)
          evt.currentTarget.classList.add(this.stateClass.btn)
        }

        this.switchCorrent(evt)
      }
    }

    const loanTab = new SwitchTab({
      id: "#js-switchTab_01"
    })

    loanTab.$label.on("click", e => {
      loanTab.current = e
    })
  }
  localSwitchTab();
  
  // 追従バナー
  function fixedBanerToggle(){
  class Baners {
    constructor(setting){
      this.$bnr = $(setting.bnr)
      this.$triger = $(setting.trigerElm)
    }
    set toggleBnr(winOff){
      winOff - this.$triger.innerHeight() + window.screen.height > this.$triger.offset().top?
      this.$bnr.addClass("is-nav-show"):
      this.$bnr.removeClass("is-nav-show");
    }

  }
  const localBnr = new Baners({
    bnr: ".js-navBottom",
    trigerElm: "#logoArea"
  })
  $(window).scroll(()=>{
    localBnr.toggleBnr = window.pageYOffset
  })
  // scroll eve
}
fixedBanerToggle()
});

// lazy load
const lazyLoadSet = () => {
  let data = new Array()
  const imgs = document.getElementsByClassName("js-lazyLoad")
  for (let i = 0, n = imgs.length; i < n; i++) {
    data.push({ URL: imgs[i].src, selector: imgs[i] })
    imgs[i].src = "data:image/gif;base64,R0lGODlhAQABAGAAACH5BAEKAP8ALAAAAAABAAEAAAgEAP8FBAA7";
  }
  window.addEventListener("load", () => {
    // 未読み込み画像の配列が戻る
    data = lazyLoadRun(data, 750)
    let timerID = null
    const scrollFunc = () => {
      if (!timerID) {
        timerID = setTimeout(() => {
          timerID = null
          data = lazyLoadRun(data, 500)
          if (data.length < 1) {
            timerID = true
          }
          // debug
          //console.log(data.length)

          // 残り画像数0で破棄する
          if (data.length == 0) {
            window.removeEventListener("scroll", scrollFunc, false)
          }
        }, 200)
      }
    }

    window.addEventListener("scroll", scrollFunc, false)

  }, false)

  const lazyLoadRun = function ($data, $pre) {
    const returnArr = new Array()
    const windowHeight = document.documentElement.clientHeight
    for (let j = 0, m = $data.length; j < m; j++) {
      if ($data[j].selector.getBoundingClientRect().top < windowHeight + $pre) {
        $data[j].selector.src = $data[j].URL
        $data[j].selector.classList.add("lazyLoaded")
      } else {
        returnArr.push($data[j])
      }
    }
    return returnArr;
  }
}
window.addEventListener("DOMContentLoaded", lazyLoadSet, false)