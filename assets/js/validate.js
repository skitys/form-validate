;(function($) {

  // ---------------------------------------------- //
  // Class ValidateHandler
  // ---------------------------------------------- //

  function ValidateHandler(name) {
    const _ = this;
    _.items = [];
    _.allValid = false;
    _.name = name || location.pathname;
  }

  ValidateHandler.prototype.addItems = function(item) {
    const _ = this;
    _.items.push(item);
  };

  ValidateHandler.prototype.checkAllValid = function(item) {
    const _ = this;
    let flag = true;

    _.items.forEach(function(v, i) {
      v.validators.forEach(function(validator, i) {
        if (!validator.isValid) {
          flag = false;
        }
      });
    });

    _.allValid = flag
  }

  ValidateHandler.prototype.changeSubmitStatus = function() {
    const _ = this;
    const $buttonClassName = $('.js-next-step');
    const yetButtonText = $buttonClassName.data('yet');
    const completeButtonText = $buttonClassName.data('complete');
    const disabledClassName = 'disabled';

    if(_.allValid) {
      $buttonClassName.removeClass(disabledClassName);
      $buttonClassName.text(completeButtonText);
    } else {
      $buttonClassName.addClass(disabledClassName)
      $buttonClassName.text(yetButtonText);
    }
  }

  ValidateHandler.prototype.handleErrorMessage = function() {
    const _ = this;

    _.items.forEach(function(v, i) {
      let errorMessage = '';

      v.validators.forEach(function(validator, i) {
        validator.errors.forEach(function(error, i) {
          errorMessage = error
        });
      });

      if(errorMessage === '') {
        $(v.errorDisplay).hide();
      } else {
        $(v.errorDisplay).text(errorMessage);
        $(v.errorDisplay).show();
      }
    });
  }

  //check whether Storage is available
  //https://developer.mozilla.org/ja/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  ValidateHandler.prototype.checkSessionStorageAvailable = function() {
    try {
      const storage = window.sessionStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return e instanceof DOMException && (
        e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        (storage && storage.length !== 0);
    }
  }

  ValidateHandler.prototype.setVisitedFlag = function() {
    const _ = this;

    if(this.checkSessionStorageAvailable()) {
      sessionStorage.setItem('visited:' + _.name, 'true')
    }
  }

  ValidateHandler.prototype.checkIsInitialVisit = function(key) {
    if(this.checkSessionStorageAvailable()) {
      return sessionStorage.getItem(key) !== 'true';
    }
    return false;
  }

  ValidateHandler.prototype.execAllValidators = function() {
    const _ = this;

    _.items.forEach(function(v, i) {
      v.validators.forEach(function(validator, i) {
        $(validator.target).change();
      });
    });
  }

  // ---------------------------------------------- //
  // Class Validator
  // ---------------------------------------------- //

  function Validator(target, handler, vals, options) {
    const _ = this;
    _.isValid = false;
    _.target = $(target);
    _.handler = handler;
    _.vals = vals ? vals : [];
    _.options = options ? options : {};
    _.errors = [];

    $(target).on('change', function(ev) {

      _.validate(ev.target.value)
      .then(function() {
        _.isValid = true;
        //????????????????????????????????????????????????????????????
        if(_.target.attr('type') !== 'hidden') {
          _.target.parent().removeClass('error')
          _.target.parent().addClass('entered')
        }
        _.errors = []
        _.handler.checkAllValid()
        _.handler.changeSubmitStatus()
        _.handler.handleErrorMessage()
      })
      .catch(function(data) {
        _.isValid = false;
        //????????????????????????????????????????????????????????????
        if(_.target.attr('type') !== 'hidden') {
          _.target.parent().removeClass('entered')
          _.target.parent().addClass('error')
        }
        _.errors.push(data.message)
        _.handler.checkAllValid()
        _.handler.changeSubmitStatus()
        _.handler.handleErrorMessage()
      })
      .finally(function() {
        //callback????????????????????????????????????????????????????????????????????????????????????
        if(_.options.callback && typeof _.options.callback === 'function') {
          _.options.callback(_);
        }
        //related??????????????????????????????????????????????????????????????????????????????????????????
        if(_.options.related && _.options.related.length > 0) {
          _.options.related.forEach(function(v, i) {
            if ($(v.target).val() !== "") {
              $(v.target).change();
            }
          });
        }
      });

      //???????????????????????????????????????????????????????????????????????????????????????
      _.handler.setVisitedFlag();
    })
  }

  Validator.prototype.validate = function(inputData) {
    const _ = this;

    //skip?????????????????????????????????????????????????????????Promise?????????
    if(_.options.skip && typeof _.options.skip === 'function' && _.options.skip(_)) {
      return Promise.resolve();
    };

    return Promise.all(_.vals.map(function(v, i) {
      return _.rules[v.rule](inputData, v);
    }));
  };

  Validator.prototype.resetValidator = function() {
    const _ = this;
    _.isValid = false;
    _.errors = [];
    $(_.target).parent().removeClass('error');
    $(_.target).parent().removeClass('entered');
  }

  Validator.prototype.rules = {
    required: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData !== '' ? resolve(option) : reject(option)
      });
    },
    //??????????????????????????????API?????????
    email: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        $.ajax(
          "/quick/hosho/entry/emailValidator",
          {
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: 'val=' + inputData,
          }
        )
        .done(function(res) {
          if(Number(res.resultcode) === 200) {
            resolve(option);
          }
          reject(Object.assign(option, {message: res.errorMessage}))
        })
        .fail(function(err) {
          //?????????????????????Http??????????????????????????????FE??????????????????????????????
          //???????????????????????????Submit?????????????????????????????????????????????
          resolve(option)
        })
      });
    },
    emailFormat: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData.match(/^[a-zA-Z0-9_+-]+(.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/) ? resolve(option) : reject(option)
      });
    },
    zenkaku: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData.match(/^[^\x01-\x7E\uFF61-\uFF9F]+$/) ? resolve(option) : reject(option)
      })
    },
    kana: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData.match(/^[???-??????]+$/) ? resolve(option) : reject(option)
      });
    },
    equal: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData === option.params.compare.val() ? resolve(option) : reject(option)
      });
    },
    number: function (inputData, option) {
      return new Promise(function(resolve, reject) {
        inputData.match(/^[0-9]+$/) ? resolve(option) : reject(option)
      });
    },
    nonZero: function (inputData, option) {
      return new Promise(function(resolve, reject) {
        Number(inputData) !== 0 ? resolve(option) : reject(option)
      });
    },
    digits: function (inputData, option) {
      return new Promise(function(resolve, reject) {
        String(inputData).length === option.params.digits ? resolve(option) : reject(option)
      });
    },
    digitsRange: function (inputData, option) {
      return new Promise(function(resolve, reject) {
        if(String(inputData).length >= option.params.minDigits && String(inputData).length <= option.params.maxDigits) {
          resolve(option)
        } else {
          reject(option)
        }
      })
    },
    digitsCount: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        const digitsList = option.params.targets.map(function(target, i) {
          return $(target).val().length
        })
        const digitsCount = digitsList.reduce(function(acc, cur) { return acc + cur })

        if (digitsCount >= option.params.minLimit && digitsCount <= option.params.maxLimit) {
          resolve(option)
        } else {
          reject(option)
        }
      })
    },
    validDate: function (inputData, option) {
      return new Promise(function(resolve, reject) {
        const year = option.params.year.val()
        const month = option.params.month.val()
        const date = inputData
        const createdDate = new Date(year, month - 1, date);
        if(!(year && month && date)) {
          resolve(option);
        }
        Number(month) === createdDate.getMonth() + 1 ? resolve(option) : reject(option)
      });
    },
    shortServiceLengthDate: function(inputData, option) {
      return new Promise(function(resolve, reject) {
        // ????????????????????????????????????????????????1???????????????????????????????????????????????????????????????
        const year = option.params.year.val() != undefined ? option.params.year.val() : inputData;
        const month = option.params.month.val() != undefined ? option.params.month.val() : inputData;
        const date = option.params.date.val() != undefined ? option.params.date.val() : inputData;

        const joinedDate = new Date(year, month - 1, date); //????????????????????????
        var oneYearAgoDate = new Date();

        // ?????????????????????Day Mmm dd yyyy 00:00:00 GMT+0900 (???????????????) ??????????????? ?????????
        oneYearAgoDate = new Date( 
          (oneYearAgoDate.getFullYear()-1),
          oneYearAgoDate.getMonth(),
          oneYearAgoDate.getDate()
          );

        if( oneYearAgoDate >= joinedDate || !(year && month && date)) {
          resolve(option)
        }
        reject(option);
      })
    },
  };

  // ---------------------------------------------- //
  // Prevent Press EnterKey Submit
  // ---------------------------------------------- //
  $(".js-hosho-entry-wrap input").keydown(function(e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      return false;
    } else {
      return true;
    }
  });

  // ---------------------------------------------- //
  // Add Global
  // ---------------------------------------------- //
  window.asyncValidate = window.asyncValidate || {}
  window.asyncValidate.ValidateHandler = ValidateHandler
  window.asyncValidate.Validator = Validator

})(jQuery)