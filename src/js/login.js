var cs = {};

cs.accessData = {};
cs.dataCnt = 0;
cs.updCnt = 0;
cs.insCnt = 0;
cs.failCnt = 0;

cs.debugCnt = 0;

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

$(document).ready(function() {
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
                    $('#dispMsg').html('ログインに失敗しました。');
                    $('#dispMsg').css("display", "block");
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
            $("#popupSendAllowedErrorMsg").html('対象セルを選択して下さい。');
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
});

cs.checkParam = function() {
    var msg = "";
    if (cs.accessData.target === null) {
        msg = '対象セルが設定されていません。';
    } else if (cs.accessData.token ===null) {
        msg = 'トークンが設定されていません。';
    } else if (cs.accessData.refToken === null) {
        msg = 'リフレッシュトークンが設定されていません。';
    } else if (cs.accessData.expires === null) {
        msg = 'トークンの有効期限が設定されていません。';
    } else if (cs.accessData.refExpires === null) {
        msg = 'リフレッシュトークンの有効期限が設定されていません。';
    }

    if (msg.length > 0) {
        $('#dispMsg').html(msg);
        $('#dispMsg').css("display", "block");
        return false;
    }

    return true;
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
            $('#dispMsg').html('保存に失敗しました。');
            $('#dispMsg').css("display", "block");
        });
    }).fail(function(data) {
        $('#dispMsg').html('ログインに失敗しました。');
        $('#dispMsg').css("display", "block");
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
        url: cs.accessData.cellUrl + '__auth',
        processData: true,
        dataType: 'json',
        data: {
               grant_type: "refresh_token",
               refresh_token: cs.accessData.refToken
        },
        headers: {'Accept':'application/json'}
    })
}