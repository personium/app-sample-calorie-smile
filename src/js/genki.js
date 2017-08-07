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
    cs.dataCnt = 0;
    cs.updCnt = 0;
    cs.insCnt = 0;
    cs.failCnt = 0;
    cs.debugCnt = 0;
    
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
    cs.accessData = JSON.parse(sessionStorage.getItem("accessInfo"));

    if (cs.checkParam()) {
        cs.setIdleTime();
        cs.transGenki();
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

    $('#bSendAllowed').on('click', function () {
        var value = $("#requestCells option:selected").val();
        if (value == undefined || value === "") {
            $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.pleaseSelectTargetCell"));
        } else {
            var title = i18next.t("readRequestTitle");
            var body = i18next.t("readRequestBody");
            var reqRel = "https://demo.personium.io/hn-app-genki/__relation/__/ShokujiViewer";
            cs.sendMessage(null, value, "req.relation.build", title, body, reqRel, cs.accessData.cellUrl);
        }
    });

    $("#extCellCalSmile").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
    });
    $("#sendAllowedMessage").on('show.bs.collapse', function() {
        $("#extCellCalSmile").removeClass('in');
        $("#extCellCalSmile").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
        $("#popupSendAllowedErrorMsg").html('');
    });
    $("#listAllowed").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#extCellCalSmile").removeClass('in');
        $("#extCellCalSmile").attr("aria-expanded", false);
        $("#receiveMessage").removeClass('in');
        $("#receiveMessage").attr("aria-expanded", false);
    });
    $("#receiveMessage").on('show.bs.collapse', function() {
        $("#sendAllowedMessage").removeClass('in');
        $("#sendAllowedMessage").attr("aria-expanded", false);
        $("#listAllowed").removeClass('in');
        $("#listAllowed").attr("aria-expanded", false);
        $("#extCellCalSmile").removeClass('in');
        $("#extCellCalSmile").attr("aria-expanded", false);
    });

    $('#dvOverlay').on('click', function() {
        $(".overlay").removeClass('overlay-on');
        $(".slide-menu").removeClass('slide-on');
    });
}

cs.openExtCellCalSmile = function() {
    $('#modal-extCellCalSmile').modal('show');
};

cs.openSendAllowedMessage = function() {
    $('#modal-sendAllowedMessage').modal('show');
};

cs.listAllowed = function() {
    $('#modal-listAllowed').modal('show');
};

cs.receiveMessage = function() {
    $('#modal-receiveMessage').modal('show');
};

cs.transGenki = function(json) {
    // 閲覧許可状況(外部セル)
    cs.getOtherAllowedCells();
    // 閲覧許可状況
    cs.getAllowedCellList();
    // 通知
    cs.getReceiveMessage();

    // 更新開始
    cs.getGenkikunData();
};

cs.dispGenkikun = function() {
    var childWindow = window.open('about:blank');
    childWindow.location.href = cs.accessData.genkiUrl + "CalSml_mb/login.jsp";
    childWindow = null;
};

var d1 = null;
cs.getGenkikunData = function() {
    d1 = $.Deferred();
    cs.startAnimation();
    cs.displayMessageByKey("msg.info.collaboratingData");

    cs.getCalorieSmileServerToken(null, null, cs.refreshGenkikunToken);

    $.when(
        cs.getJissekiLatestDateAPI(),
        cs.getSokuteiLatestDateAPI(),
        cs.getShokujiLatestDateAPI(),
        d1
    ).done(function(dataJ,dataS,dataSh) {
        var prevDateJ = "";
        var prevDateS = "";
        var prevDateSh = "";
        var resJ = dataJ[0].d.results;
        var resS = dataS[0].d.results;
        var resSh = dataSh[0].d.results;
        if (resJ.length > 0) {
            prevDateJ = resJ[0].jisseki_date;
            prevDateJ = prevDateJ.replace(/\/|\-/g, "");
        }
        if (resS.length > 0) {
            prevDateS = resS[0].sokutei_date;
            prevDateS = prevDateS.replace(/\/|\-/g, "");
        }
        if (resSh.length > 0) {
            prevDateSh = resSh[0].shokuji_date;
            prevDateSh = prevDateSh.replace(/\/|\-/g, "");
        }
        $.when(
            cs.getDataAPI(prevDateJ), // need valid genkiToken
            cs.getDataAPI(prevDateS), // need valid genkiToken
            cs.getDataAPI(prevDateSh) // need valid genkiToken
        ).done(function(resultJ, resultS, resultSh) {
            cs.updateGenkikunData(resultJ, resultS, resultSh);
        }).fail(function(result) {
            cs.displayMessageByKey("msg.error.failedToRetrieveData");
            cs.stopAnimation();
        });
    }).fail(function(result) {
        cs.displayMessageByKey("msg.error.failedToRetrieveData");
        cs.stopAnimation();
    });
};
cs.startAnimation = function() {
    $('#updateGenki')
        .prop('disabled', true)
        .addClass("spinIcon");
};
cs.stopAnimation = function() {
    $('#updateGenki')
        .prop('disabled', false)
        .removeClass("spinIcon");
};
cs.refreshGenkikunToken = function(json, loginData) {
    cs.updateSessionStorageGenkikun(json, loginData);
    if (d1 && d1.state() == "pending") {
        d1.resolve();
    }
};
//cs.updateGenkikunData = function(result) {
cs.updateGenkikunData = function(resultJ, resultS, resultSh) {
    var id = resultJ[0].data.id;

    var jisseki = resultJ[0].data.jisseki;
    var sokutei = resultS[0].data.sokutei;
    var shokuji = resultSh[0].data.shokuji;
    cs.dataCnt = jisseki.length + sokutei.length + shokuji.length;
    cs.updCnt = 0;
    cs.insCnt = 0;
    cs.failCnt = 0;
    $("#nowLinkage").css("width", 0);

    for (var i in shokuji) {
        var shokujiDate = shokuji[i].shokujiDate;
        var json = {
            "id":id
           ,"shokuji_date":shokuji[i].shokujiDate
           ,"shokuji_type":shokuji[i].shokujiType
        }

        cs.shokujiLinkage(json);

        var shokujiInfo = shokuji[i].shokujiInfo;
        cs.dataCnt += shokujiInfo.length;
cs.debugCnt += shokujiInfo.length
        for (var j in shokujiInfo) {
            var jsonInfo = {
                "id":id
               ,"shokuji_date":shokujiDate
               ,"no":shokujiInfo[j].no
               ,"time":shokujiInfo[j].time
               ,"photo":shokujiInfo[j].photo
               ,"shokuji_comment":shokujiInfo[j].shokujiComment
//               ,"in_calorie":shokujiInfo[j].inCalorie
            }

            cs.shokujiInfoLinkage(jsonInfo);
        }
    }

    for (var i in sokutei) {
        var json = {
            "id":id
            ,"sokutei_date":sokutei[i].sokuteiDate
            ,"weather":sokutei[i].weather
            ,"feeling":sokutei[i].feeling
            ,"jisseki_comment":sokutei[i].jissekiComment
            ,"steps":sokutei[i].steps
            ,"weight":sokutei[i].weight
            ,"waist":sokutei[i].waist
            ,"bp_max":sokutei[i].bpMax
            ,"bp_min":sokutei[i].bpMin
            ,"fat_per":sokutei[i].fatPer
            ,"bu_calorie":sokutei[i].buCalorie
        };

        cs.sokuteiLinkage(json);
    }

    for (var i in jisseki) {
        var json = {
            "id":id
            ,"jisseki_date":jisseki[i].jissekiDate
            ,"plan_type":jisseki[i].planType
            ,"plan_detail":jisseki[i].planDetail
            ,"result_detail":jisseki[i].resultDetail
//            ,"result_comment":jisseki[i].resultComment
        };

        cs.jissekiLinkage(json);
    }
};

cs.jissekiLinkage = function(data) {
    var planType = data.plan_type;
    if (planType) {
        planType = "%27" + planType + "%27"
    }
    $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunData/jisseki?$filter=id+eq+%27' + data.id + '%27+and+jisseki_date+eq+%27' + data.jisseki_date + '%27+and+plan_type+eq+' + planType,
        headers: {
            'Authorization': 'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = cs.accessData.target + '/GenkiKunData/jisseki';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, cs.accessData.token).done(function() {
            if (type === "PUT") {
                cs.updCnt += 1;
            } else {
                cs.insCnt += 1;
            }
        }).fail(function(data) {
            cs.failCnt += 1;
        }).always(function(nowData) {
            cs.updateLinkageProgress();
        });
    }).fail(function(nowData) {
        cs.failCnt += 1;
    }).always(function(nowData) {
        cs.updateLinkageProgress();
    });
};

cs.sokuteiLinkage = function(data) {
    $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunData/sokutei?$filter=id+eq+%27' + data.id + '%27+and+sokutei_date+eq+%27' + data.sokutei_date + '%27',
        headers: {
            'Authorization': 'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = cs.accessData.target + '/GenkiKunData/sokutei';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, cs.accessData.token).done(function() {
            if (type === "PUT") {
                cs.updCnt += 1;
            } else {
                cs.insCnt += 1;
            }
        }).fail(function(data) {
            cs.failCnt += 1;
        }).always(function(nowData) {
            cs.updateLinkageProgress();
        });
    }).fail(function(nowData) {
        cs.failCnt += 1;
    }).always(function(nowData) {
        cs.updateLinkageProgress();
    });
};

cs.shokujiLinkage = function(data) {
    var shokujiType = data.shokuji_type;
    if (shokujiType) {
        shokujiType = "%27" + shokujiType + "%27"
    }
    $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunData/shokuji?$filter=id+eq+%27' + data.id + '%27+and+shokuji_date+eq+%27' + data.shokuji_date + '%27+and+shokuji_type+eq+' + shokujiType,
        headers: {
            'Authorization': 'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = cs.accessData.target + '/GenkiKunData/shokuji';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, cs.accessData.token).done(function() {
            if (type === "PUT") {
                cs.updCnt += 1;
            } else {
                cs.insCnt += 1;
            }
        }).fail(function(data) {
            cs.failCnt += 1;
        }).always(function(nowData) {
            cs.updateLinkageProgress();
        });
    }).fail(function(nowData) {
        cs.failCnt += 1;
    }).always(function(nowData) {
        cs.updateLinkageProgress();
    });
};

cs.shokujiInfoLinkage = function(data) {
    $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunData/shokuji_info?$filter=id+eq+%27' + data.id + '%27+and+shokuji_date+eq+%27' + data.shokuji_date + '%27+and+no+eq+' + data.no + ' and time eq %27' + data.time + '%27',
        headers: {
            'Authorization': 'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = cs.accessData.target + '/GenkiKunData/shokuji_info';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, cs.accessData.token).done(function() {
            if (data.photo) {
                cs.uploadPhotoImage(data.photo).done(function(res) {
                    if (type === "PUT") {
                        cs.updCnt += 1;
                    } else {
                        cs.insCnt += 1;
                    }
                }).fail(function(res) {
                    cs.failCnt += 1;
                }).always(function(res) {
                    cs.updateLinkageProgress();
                });
            } else {
                if (type === "PUT") {
                    cs.updCnt += 1;
                } else {
                    cs.insCnt += 1;
                }
                cs.updateLinkageProgress();
            }
        }).fail(function(data) {
            cs.failCnt += 1;
        }).always(function(data) {
            cs.updateLinkageProgress();
        });
    }).fail(function(nowData) {
        cs.failCnt += 1;
    }).always(function(nowData) {
        cs.updateLinkageProgress();
    });
};

cs.getGenkiDataAPI = function(type, url, data, token) {
    return $.ajax({
        type: type,
        url: url,
        data: JSON.stringify(data),
        headers:{
            'Authorization': 'Bearer ' + token,
            'Accept':'application/json'
        }
    });
};

cs.uploadPhotoImage = function(imageSrc) {
    var url = cs.accessData.genkiUrl;
    var id = cs.accessData.id;
    return $.ajax({
        type:"GET",
        url: cs.accessData.target + '/GenkiKunService/getPhoto',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'photo': imageSrc,
            'genkiToken': cs.accessData.genkiToken,
            'refToken': cs.accessData.refToken,
            'myCellUrl': cs.accessData.cellUrl
        },
        headers:{
            'Accept':'application/json',
            'Authorization':'Bearer ' + cs.accessData.token
        }
    });
};

cs.updateLinkageProgress = function() {
    var endCnt = cs.insCnt + cs.updCnt + cs.failCnt;
    var par = endCnt / cs.dataCnt * 100;

    $("#nowLinkage").css("width", par + "%");
    if (par >= 100) {
        $('#dispMsg').hide();
        cs.stopAnimation();
        cs.dispPhoto(0, 50);
    }
};

cs.getOtherAllowedCells = function() {
    cs.getExtCell().done(function(json) {
        var objSel = document.getElementById("otherAllowedCells");
        if (objSel.hasChildNodes()) {
          while (objSel.childNodes.length > 0) {
            objSel.removeChild(objSel.firstChild);
          }
        }
        objSel = document.getElementById("requestCells");
        if (objSel.hasChildNodes()) {
          while (objSel.childNodes.length > 0) {
            objSel.removeChild(objSel.firstChild);
          }
        }

        var results = json.d.results;
        if (results.length > 0) {
            results.sort(function(val1, val2) {
              return (val1.Url < val2.Url ? 1 : -1);
            })

            for (var i in results) {
                var url = results[i].Url;
                cs.dispOtherAllowedCells(url);
            }
        }
    });
};

cs.dispOtherAllowedCells = function(extUrl) {
    cs.getProfile(extUrl).done(function(data) {
        var dispName = cs.getName(extUrl);
        if (data !== null) {
            dispName = data.DisplayName;
        }
        cs.checkOtherAllowedCells(extUrl, dispName)
    }).fail(function() {
        var dispName = cs.getName(extUrl);
        cs.checkOtherAllowedCells(extUrl, dispName)
    });
};

cs.checkOtherAllowedCells = function(extUrl, dispName) {
    cs.getTargetToken(extUrl).done(function(extData) {
        cs.getPhotoAPI(extUrl + cs.accessData.boxName, extData.access_token).done(function(data) {
            cs.appendOtherAllowedCells(extUrl, dispName);
        }).fail(function(data) {
            if (data.status !== 404) {
                cs.appendRequestCells(extUrl, dispName);
            }
        });
    });
};

cs.appendOtherAllowedCells = function(extUrl, dispName) {
    $("#otherAllowedCells").append('<option value="' + extUrl + '">' + dispName + '</option>');
};

cs.appendRequestCells = function(extUrl, dispName) {
    $("#requestCells").append('<option value="' + extUrl + '">' + dispName + '</option>');
};

cs.getAllowedCellList = function() {
    $.ajax({
        type: "GET",
        url: cs.accessData.cellUrl + '__ctl/Relation(Name=\'ShokujiViewer\',_Box\.Name=\'' + cs.accessData.boxName + '\')/$links/_ExtCell',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    }).done(function(data) {
        cs.dispAllowedCellList(data);
    });
};

cs.dispAllowedCellList = function(json) {
    $("#allowedCellList").empty();
    var results = json.d.results;
    if (results.length > 0) {
        results.sort(function(val1, val2) {
          return (val1.uri < val2.uri ? 1 : -1);
        })

        for (var i in results) {
          var uri = results[i].uri;
          var matchUrl = uri.match(/\(\'(.+)\'\)/);
          var extUrl = matchUrl[1];

          cs.dispAllowedCellListAfter(extUrl, i);
        }
    }
};

cs.dispAllowedCellListAfter = function(extUrl, no) {
    cs.getProfile(extUrl).done(function(data) {
        var dispName = cs.getName(extUrl);
        if (data !== null) {
            dispName = data.DisplayName;
        }
        cs.appendAllowedCellList(extUrl, dispName, no)
    }).fail(function() {
        var dispName = cs.getName(extUrl);
        cs.appendAllowedCellList(extUrl, dispName, no)
    });
};

cs.appendAllowedCellList = function(extUrl, dispName, no) {
    $("#allowedCellList").append('<tr id="deleteExtCellRel' + no + '"><td class="paddingTd">' + dispName + '</td><td><button onClick="cs.notAllowedCell(\'' + extUrl + '\', ' + no + ')">' + i18next.t("release") + '</button></td></tr>');
};

cs.notAllowedCell = function(extUrl, no) {
    cs.deleteExtCellLinkRelation(extUrl, 'ShokujiViewer').done(function() {
        $("#deleteExtCellRel" + no).remove();
    });
};

cs.getReceiveMessage = function() {
    $("#messageList").empty();
    cs.getReceivedMessageAPI().done(function(data) {
        var results = data.d.results;
        for (var i in results) {
            var boxName = results[i]["_Box.Name"];
            if (cs.accessData.boxName === boxName) {
                var title = results[i].Title;
                var body = results[i].Body;
                var fromCell = results[i].From;
                var uuid = results[i].__id;

                if (results[i].Status !== "approved" && results[i].Status !== "rejected") {
                    var html = '<div class="panel panel-default" id="recMsgParent' + i + '"><div class="panel-heading"><h4 class="panel-title accordion-togle"><a data-toggle="collapse" data-parent="#accordion" href="#recMsg' + i + '" class="allToggle collapsed">' + cs.getName(fromCell) + ':[' + title + ']</a></h4></div><div id="recMsg' + i + '" class="panel-collapse collapse"><div class="panel-body">';
                    if (results[i].Type === "message") {
                        html += '<table class="display-table"><tr><td width="80%">' + body + '</td></tr></table>';
                    } else {
                        html += '<table class="display-table"><tr><td width="80%">' + body + '</td>';
                        html += '<td width="10%"><button onClick="cs.approvalRel(\'' + fromCell + '\', \'' + uuid + '\', \'recMsgParent' + i + '\');">' + i18next.t("approve") +'</button></td>';
                        html += '<td width="10%"><button onClick="cs.rejectionRel(\'' + fromCell + '\', \'' + uuid + '\', \'recMsgParent' + i + '\');">' + i18next.t("decline") + '</button></td>';
                        html += '</tr></table>';
                    }
                    html += '</div></div></div>';

                    $("#messageList").append(html);
                }
            }
        }
    }).fail(function(data) {
        var test = "";
    });
};

cs.dispPhotoImage = function(cellUrl, token, title) {
    if (cellUrl) {
        cs.accessData.photoCell = cellUrl + cs.accessData.boxName;
        cs.accessData.photoToken = token;
        cs.accessData.Title = title;
    } else {
        cs.accessData.photoCell = cs.accessData.target;
        cs.accessData.photoToken = cs.accessData.token;
        cs.accessData.Title = i18next.t("me");
    }
    
    sessionStorage.setItem("accessInfo", JSON.stringify(cs.accessData));
    location.href = "./genkiPhoto.html";
};

cs.sendMessage = function(uuid, extCell, type, title, body, reqRel, reqRelTar) {
    cs.getAppToken().done(function(appToken) {
        cs.getAppCellToken(appToken.access_token).done(function(msgToken) {
            cs.sendMessageAPI(uuid, extCell, type, title, body, reqRel, reqRelTar, msgToken.access_token).done(function(data) {
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.messageSent"));
            }).fail(function(data) {
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
            });
        }).fail(function(msgToken) {
            $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
        });
    }).fail(function(appToken) {
        $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
    });
};

// Photo Disp
cs.dispPhoto = function(skip, top) {
    $('#dvMainArea').empty();
    cs.getDispPhotoAPI(skip, top).done(function(data) {
        var dataList = data.d.results;
        var html = "";
        var nowDate = "";

        for (var i in dataList) {
            var imageSrc = dataList[i].photo;
            var imageName = "";
            if (imageSrc) {
                imageName = imageSrc.match(".+/(.+?)([\?#;].*)?$")[1];
            }
            var shokujiDate = dataList[i].shokuji_date;
            var dateId = shokujiDate.replace(/\/|\-/g, "");
            var shokujiTime = dataList[i].time;
            var timeId = shokujiTime.replace(/:/g, "");
            var dispTimeS = shokujiTime.split(':');
            var dispTime = dispTimeS[0] + ":" + dispTimeS[1];
            var noId = dataList[i].no;

            var html = '';
            if (nowDate !== shokujiDate) {
                nowDate = shokujiDate;
                html = '<section class="meal-section"><h2>' + nowDate.replace(/\/|\-/g, ".") + '</h2><div class="daily-meal" id="td' + dateId + '"></div></section>';

                $('#dvMainArea').append(html);
            }

            var comm = dataList[i].shokuji_comment;
            if (!comm) {
                comm = "";
            }
            var imageId = ["im", dateId, timeId, noId].join("");
            html = [
                '<div class="meal">',
                    '<div class="picture">',
                        '<img id="' + imageId + '" alt="' + i18next.t("glossary:food") + '">',
                    '</div>',
                    '<div class="time">',
                        dispTime,
                    '</div>',
                    '<div class="comment">',
                        comm,
                    '</div>',
                '</div>'
            ].join("");

            $("#td" + dateId).append(html);
            cs.setPhoto(dateId, timeId, noId, imageName);
        }

        if (dataList.length > 0) {
            $('#dvMainArea').css("display", "block");
        } else {
            cs.displayMessageByKey("msg.error.dataNotFound");
        }
    }).fail(function(data) {
        cs.displayMessageByKey("msg.error.dataNotFound");
    });
}

cs.setPhoto = function(dateId, timeId, noId, imageName) {
    var ext = imageName.split('.')[1];
    var contentType = "image/jpeg";
    switch (ext) {
        case "png":
            contentType = "image/png";
            break;
        case "gif":
            contentType = "image/gif";
            break;
    }
    var filePath = cs.accessData.target + '/Images/' + imageName;
    var oReq = new XMLHttpRequest();
    oReq.open("GET", filePath);
    oReq.responseType = "blob";
    oReq.setRequestHeader("Content-Type", contentType);
    oReq.setRequestHeader("Authorization", "Bearer " + cs.accessData.token);
    oReq.onload = function(response) {
        var blob = oReq.response;
        var file = new File([blob], imageName);
        try {
            var reader = new FileReader();
        } catch (e) {
            return;
        }

        reader.onload = function(event) {
            //$("#im" + dateId + timeId + noId).css('background-image','url(\'' + event.target.result + '\')');
            $("#im" + dateId + timeId + noId).attr('src',event.target.result);
        }
        reader.readAsDataURL(file, "UTF-8");
    }
    oReq.send();
};

cs.getDispPhotoAPI = function(skip, top) {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: cs.accessData.target + '/GenkiKunData/shokuji_info?$skip=' + skip + '&$top=' + top + '&$filter=id+eq+%27' + id + '%27&$orderby=shokuji_date%20desc,time%20asc,no%20asc',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    });
}

cs.openSlide = function() {
    $(".overlay").toggleClass('overlay-on');
    $(".slide-menu").toggleClass('slide-on');
}

cs.getExtCell = function() {
  return $.ajax({
                type: "GET",
                url: cs.accessData.cellUrl + '__ctl/ExtCell',
                headers: {
                    'Authorization':'Bearer ' + cs.accessData.token,
                    'Accept':'application/json'
                }
  });
};

cs.getProfile = function(url) {
    return $.ajax({
    type: "GET",
    url: url + '__/profile.json',
    dataType: 'json',
        headers: {'Accept':'application/json'}
    })
};

cs.getTargetToken = function(extCellUrl) {
  return $.ajax({
                type: "POST",
                url: cs.accessData.cellUrl + '__token',
                processData: true,
        dataType: 'json',
                data: {
                        grant_type: "refresh_token",
                        refresh_token: cs.accessData.refToken,
                        p_target: extCellUrl
                },
        headers: {'Accept':'application/json'}
         });
};

cs.getPhotoAPI = function(targetCell, token) {
    return $.ajax({
        type: 'GET',
        url: targetCell + '/GenkiKunData/shokuji_info?$top=1',
        headers: {
            'Authorization':'Bearer ' + token,
            'Accept':'application/json'
        }
    });
};

cs.getJissekiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: cs.accessData.target + '/GenkiKunData/jisseki?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=jisseki_date%20desc',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    });
};
cs.getSokuteiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: cs.accessData.target + '/GenkiKunData/sokutei?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=sokutei_date%20desc',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    });
};
cs.getShokujiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: cs.accessData.target + '/GenkiKunData/shokuji?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=shokuji_date%20desc',
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/json'
        }
    });
};

cs.getDataAPI = function(prevDate) {
  var nowData = new Date();
  var url = cs.accessData.genkiUrl;
  var id = cs.accessData.id;
  var year = nowData.getFullYear();
  var month = nowData.getMonth() + 1;
  month = ("0" + month).slice(-2);
  var day = nowData.getDate();
  day = ("0" + day).slice(-2);

  return $.ajax({
      type: "GET",
      url: cs.accessData.target + '/GenkiKunService/getData',
      data: {
          'targetUrl':url + 'newpersonium/Response',
          'id':id,
          'nowDate':year + month + day,
          'prevDate': prevDate,
          'genkiToken': cs.accessData.genkiToken
      },
      headers:{
          'Accept':'application/json',
          'Authorization':'Bearer ' + cs.accessData.token
      }
  });
};

cs.sendMessageAPI = function(uuid, extCell, type, title, body, reqRel, reqRelTar, msgToken) {
    var data = {};
    data.BoxBound = true;
    data.InReplyTo = uuid;
    data.To = extCell;
    data.ToRelation = null
    data.Type = type;
    data.Title = title;
    data.Body = body;
    data.Priority = 3;
    if (reqRel) {
        data.RequestRelation = reqRel;
    }
    if (reqRelTar) {
        data.RequestRelationTarget = reqRelTar;
    }

    return $.ajax({
            type: "POST",
            url: cs.accessData.cellUrl + '__message/send',
            data: JSON.stringify(data),
            headers: {
                    'Authorization':'Bearer ' + msgToken
            }
    })
};

cs.deleteExtCellLinkRelation = function(extCell, relName) {
    var urlArray = extCell.split("/");
    var hProt = urlArray[0].substring(0, urlArray[0].length - 1);
    var fqdn = urlArray[2];
    var cellName = urlArray[3];
    return $.ajax({
            type: "DELETE",
            url: cs.accessData.cellUrl + '__ctl/ExtCell(\'' + hProt + '%3A%2F%2F' + fqdn + '%2F' + cellName + '%2F\')/$links/_Relation(Name=\'' + relName + '\',_Box.Name=\'' + cs.accessData.boxName + '\')',
            headers: {
              'Authorization':'Bearer ' + cs.accessData.token
            }
    });
};

cs.getReceivedMessageAPI = function() {
  return $.ajax({
                type: "GET",
                //url: cs.accessData.cellUrl + '__ctl/ReceivedMessage?$filter=startswith%28Title,%27MyBoard%27%29&$orderby=__published%20desc',
                //url: cs.accessData.cellUrl + '__ctl/ReceivedMessage?$filter=_Box.Name+eq+%27' + cs.accessData.boxName + '%27&$orderby=__published%20desc',
                url: cs.accessData.cellUrl + '__ctl/ReceivedMessage?$orderby=__published%20desc',
                headers: {
                    'Authorization':'Bearer ' + cs.accessData.token,
                    'Accept':'application/json'
                }
  });
};
