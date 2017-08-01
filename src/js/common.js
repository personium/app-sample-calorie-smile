/**
 * Personium
 * Copyright 2017 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
/*
 * The followings should be shared among applications and/or within the same application.
 */
var cs = {};

//Default timeout limit - 60 minutes.
cs.IDLE_TIMEOUT =  3600000;
// 55 minutes
cs.IDLE_CHECK = 3300000;
// Records last activity time.
cs.lastActivity = new Date().getTime();

cs.accessData = {};

/*
 * Need to move to a function to avoid conflicting with the i18nextBrowserLanguageDetector initialization.
 */
function initJqueryI18next() {
    // for options see
    // https://github.com/i18next/jquery-i18next#initialize-the-plugin
    jqueryI18next.init(i18next, $, {
        useOptionsAttr: true
    });
}

function updateContent() {
    // start localizing, details:
    // https://github.com/i18next/jquery-i18next#usage-of-selector-function
    $('title').localize();
    $('[data-i18n]').localize();
}

cs.appendSessionExpiredDialog = function() {
    // Session Expiration
    var html = [
        '<div id="modal-session-expired" class="modal fade" role="dialog" data-backdrop="static">',
            '<div class="modal-dialog">',
                '<div class="modal-content">',
                    '<div class="modal-header login-header">',
                        '<h4 class="modal-title">',
                            i18next.t("reLogin"),
                        '</h4>',
                    '</div>',
                    '<div class="modal-body">',
                        i18next.t("expiredSession"),
                    '</div>',
                    '<div class="modal-footer">',
                        '<button type="button" class="btn btn-primary" id="b-session-relogin-ok" >OK</button>',
                    '</div>',
               '</div>',
           '</div>',
        '</div>'
    ].join("");
    var modal = $(html);
    $(document.body).append(modal);
    $('#b-session-relogin-ok').on('click', function() { cs.closeTab(); });
};

/*
 * clean up data and close tab
 */
cs.closeTab = function() {
  sessionStorage.setItem("accessInfo", null);
  window.close();
};

cs.checkParam = function() {
    var msg_key = "";
    if (cs.accessData.target === null) {
        msg_key = "msg.error.targetCellNotSelected";
    } else if (cs.accessData.token ===null) {
        msg_key = "msg.error.tokenMissing";
    } else if (cs.accessData.refToken === null) {
        msg_key = "msg.error.refreshTokenMissing";
    } else if (cs.accessData.expires === null) {
        msg_key = "msg.error.tokenExpiryDateMissing";
    } else if (cs.accessData.refExpires === null) {
        msg_key = "msg.error.refreshTokenExpiryDateMissing";
    }

    if (msg_key.length > 0) {
        cs.displayMessageByKey(msg_key);
        return false;
    }

    return true;
};

cs.getName = function(path) {
  var collectionName = path;
  var recordsCount = 0;
  if (collectionName != undefined) {
          recordsCount = collectionName.length;
          var lastIndex = collectionName.lastIndexOf("/");
          if (recordsCount - lastIndex === 1) {
                  collectionName = path.substring(0, recordsCount - 1);
                  recordsCount = collectionName.length;
                  lastIndex = collectionName.lastIndexOf("/");
          }
          collectionName = path.substring(lastIndex + 1, recordsCount);
  }
  return collectionName;
};

// This method checks idle time
cs.setIdleTime = function() {
    document.onclick = function() {
      LASTACTIVITY = new Date().getTime();
      cs.refreshToken().done(function(data) {
              token = data.access_token;
              refToken = data.refresh_token;
              expires = data.expires_in;
              refExpires = data.refresh_token_expires_in;
      });
    };
    document.onmousemove = function() {
      LASTACTIVITY = new Date().getTime();
      cs.refreshToken().done(function(data) {
              token = data.access_token;
              refToken = data.refresh_token;
              expires = data.expires_in;
              refExpires = data.refresh_token_expires_in;
      });
    };
    document.onkeypress = function() {
      LASTACTIVITY = new Date().getTime();
      cs.refreshToken().done(function(data) {
              token = data.access_token;
              refToken = data.refresh_token;
              expires = data.expires_in;
              refExpires = data.refresh_token_expires_in;
      });
    };
}
cs.refreshToken = function() {
    return $.ajax({
        type: "POST",
        url: cs.accessData.cellUrl + '__token',
        processData: true,
        dataType: 'json',
        data: {
               grant_type: "refresh_token",
               refresh_token: cs.accessData.refToken
        },
        headers: {'Accept':'application/json'}
    })
}

cs.getAppToken = function() {
  return $.ajax({
                type: "POST",
                url: 'https://demo.personium.io/hn-app-genki/__token',
                processData: true,
                dataType: 'json',
                data: {
                        grant_type: "password",
                        username: "megenki",
                        password: "personiumgenki",
                        p_target: cs.accessData.cellUrl
                },
                headers: {'Accept':'application/json'}
         });
};

cs.getAppCellToken = function(appToken) {
  return $.ajax({
                type: "POST",
                url: cs.accessData.cellUrl + '__token',
                processData: true,
                dataType: 'json',
                data: {
                    grant_type: "refresh_token",
                    refresh_token: cs.accessData.refToken,
                    client_id: "https://demo.personium.io/hn-app-genki/",
                    client_secret: appToken
                },
                headers: {'Accept':'application/json'}
            });
};

cs.displayMessageByKey = function(msg_key) {
    $('#dispMsg').html(i18next.t(msg_key));
    $('#dispMsg').show();
};
