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
$(document).ready(function() {
    i18next
    .use(i18nextXHRBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'en',
        ns: ['common', 'login', 'glossary'],
        defaultNS: 'common',
        debug: true,
        backend: {
            // load from i18next-gitbook repo
            loadPath: './locales/{{lng}}/{{ns}}.json',
            crossDomain: true
        }
    }, function(err, t) {
        initJqueryI18next();
        
        cs.appendSessionExpiredDialog();
        cs.additionalCallback();
        
        updateContent();
    });
});

cs.additionalCallback = function() {
    var hash = location.hash.substring(1);
    var params = hash.split("&");
    for (var i in params) {
        var param = params[i].split("=");
        var id = param[0];
        var value = param[1];
        switch (id) {
            case "target":
                cs.accessData.target = value;
                var urlSplit = value.split("/");
                cs.accessData.cellUrl = urlSplit[0] + "//" + urlSplit[2] + "/" + urlSplit[3] + "/";
                var split = cs.accessData.target.split("/");
                cs.accessData.boxName = split[split.length - 1];
                break;
            case "token":
                cs.accessData.token = value;
                break;
            case "ref":
                cs.accessData.refToken = value;
                break;
            case "expires":
                cs.accessData.expires = value;
                break;
            case "refexpires":
                cs.accessData.refExpires = value;
                break;
        }
    }

    if (cs.checkParam()) {
        cs.getGenkiAccessInfoAPI().done(function(json) {
            var loginFlag = false;
            if (json !== undefined) {
                var data = JSON.parse(json);
                loginFlag = true;
                var url = data.Url;
                var id = data.Id;
                var pass = data.Pw;
                if (url.length > 0) {
                    $('#iGenkikunUrl').val(url);
                } else {
                    loginFlag = false;
                }
                if (id.length > 0) {
                    $('#iGenkikunId').val(id);
                } else {
                    loginFlag = false;
                }
                if (pass.length > 0) {
                    $('#iGenkikunPw').val(pass);
                } else {
                    loginFlag = false;
                }
            }

            if (loginFlag) {
                cs.loginGenki().done(function(data) {
                    cs.transGenki(data);
                }).fail(function(data) {
                    $('.login_area').css("display", "block");
                    cs.setIdleTime();
                    cs.displayMessageByKey("login:msg.error.failedToLogin");
                });
            } else {
                $('.login_area').css("display", "block");
                cs.setIdleTime();
            }
            
        }).fail(function(data) {
            $('.login_area').css("display", "block");
            cs.setIdleTime();
        });
    }

    $('#bExtCalSmile').on('click', function () {
        var value = $("#otherAllowedCells option:selected").val();
        if (value == undefined || value === "") {
            $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.pleaseSelectTargetCell"));
        } else {
            cs.getTargetToken(value).done(function(extData) {
                var dispName = cs.getName(value);
                cs.getProfile(value).done(function(data) {
                    if (data !== null) {
                        dispName = data.DisplayName;
                    }
                }).always(function() {
                    cs.dispPhotoImage(value, extData.access_token, dispName);
                });
            });
        }
    });
};

cs.getGenkiAccessInfoAPI = function() {
    return $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunBox/genkiAccessInfo.json',
        dataType: "text",
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/text'
        }
    });
};

cs.loginGenki = function() {
    var url = $("#iGenkikunUrl").val();
    if (url.slice(-1) != "/") {
        url += "/";
    }
    $("#iGenkikunUrl").val(url);
    var id = $("#iGenkikunId").val();
    var pw = $("#iGenkikunPw").val();
    return $.ajax({
        type: "POST",
        //url: cs.accessData.target + '/GenkiKunService/getToken?targetUrl=' + url + 'newpersonium/Response&id=' + id + '&pass=' + pw,
        url: cs.accessData.target + '/GenkiKunService/getToken',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'pass': pw
        },
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + cs.accessData.token
        }
    });
};

cs.saveGenkiAccess = function() {
    cs.loginGenki().done(function(data) {
        saveData = {
            "Url": $("#iGenkikunUrl").val(),
            "Id":$("#iGenkikunId").val(),
            "Pw":$("#iGenkikunPw").val()
        };
        $.ajax({
            type: "PUT",
            url: cs.accessData.target + '/GenkiKunBox/genkiAccessInfo.json',
            data: JSON.stringify(saveData),
            dataType: 'json',
            headers: {
                'Authorization':'Bearer ' + cs.accessData.token,
                'Accept':'application/json'
            }
        }).done(function(res) {
            cs.transGenki(data);
        }).fail(function(res) {
            cs.displayMessageByKey("login:msg.error.failedToSaveData");
        });
    }).fail(function(data) {
        cs.displayMessageByKey("login:msg.error.failedToLogin");
    });
}

cs.transGenki = function(json) {
    cs.accessData.id = $("#iGenkikunId").val();
    cs.accessData.genkiUrl = $("#iGenkikunUrl").val();
    cs.accessData.genkiToken = json.access_token;
    cs.accessData.genkiexpires = json.expires_in;
    sessionStorage.setItem("accessInfo", JSON.stringify(cs.accessData));

    location.href = "./genki.html";
};
