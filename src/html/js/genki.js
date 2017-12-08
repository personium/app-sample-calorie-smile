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
additionalCallback = function() {
    cs.dataCnt = 0;
    cs.updCnt = 0;
    cs.insCnt = 0;
    cs.failCnt = 0;
    cs.debugCnt = 0;

    cs.accessData = JSON.parse(sessionStorage.getItem("cs.accessInfo"));

    Common.setIdleTime();
    cs.transGenki();

    $('#bReadAnotherCell').on('click', function () {
        var value = $("#otherAllowedCells option:selected").val();
        if (value == undefined || value === "") {
            $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.pleaseSelectTargetCell"));
        } else {
            Common.getTargetToken(value).done(function(extData) {
                var dispName = Common.getCellNameFromUrl(value);
                Common.getProfile(value).done(function(data) {
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
            var reqRel = Common.getAppCellUrl() + "__relation/__/" + getAppReadRelation();
            Common.sendMessageAPI(null, value, "req.relation.build", title, body, reqRel, Common.getCellUrl()).done(function(data){
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.messageSent"));
            }).fail(function(data) {
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
            });
        }
    });

    $("#modal-sendAllowedMessage").on('show.bs.modal', function() {
        $("#popupSendAllowedErrorMsg").html('');
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
    Common.getOtherAllowedCells();
    // 閲覧許可状況
    Common.getAllowedCellList();
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
    Common.displayMessageByKey("glossary:msg.info.collaboratingData");

    cs.updateCSToken();

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
            Common.displayMessageByKey("msg.error.failedToRetrieveData");
            cs.stopAnimation();
        });
    }).fail(function(result) {
        Common.displayMessageByKey("msg.error.failedToRetrieveData");
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
/*
 * called by either of the followings:
 * 1. cs.transGenki -> cs.getGenkikunData during initialization
 * 2. cs.getGenkikunData when refresh button is clicked
 */
cs.updateCSToken = function() {
    cs.getCalorieSmileServerToken(null, null, cs.refreshGenkikunToken);
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
        url: Common.getBoxUrl() + 'GenkiKunData/jisseki?$filter=id+eq+%27' + data.id + '%27+and+jisseki_date+eq+%27' + data.jisseki_date + '%27+and+plan_type+eq+' + planType,
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = Common.getBoxUrl() + 'GenkiKunData/jisseki';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, Common.getToken()).done(function() {
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
        url: Common.getBoxUrl() + 'GenkiKunData/sokutei?$filter=id+eq+%27' + data.id + '%27+and+sokutei_date+eq+%27' + data.sokutei_date + '%27',
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = Common.getBoxUrl() + 'GenkiKunData/sokutei';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, Common.getToken()).done(function() {
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
        url: Common.getBoxUrl() + 'GenkiKunData/shokuji?$filter=id+eq+%27' + data.id + '%27+and+shokuji_date+eq+%27' + data.shokuji_date + '%27+and+shokuji_type+eq+' + shokujiType,
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = Common.getBoxUrl() + 'GenkiKunData/shokuji';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, Common.getToken()).done(function() {
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
        url: Common.getBoxUrl() + 'GenkiKunData/shokuji_info?$filter=id+eq+%27' + data.id + '%27+and+shokuji_date+eq+%27' + data.shokuji_date + '%27+and+no+eq+' + data.no + ' and time eq %27' + data.time + '%27',
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(nowData) {
        var type = "POST";
        var url = Common.getBoxUrl() + 'GenkiKunData/shokuji_info';
        if (nowData.d.results.length > 0) {
            // update
            type = "PUT";
            url += "('" + nowData.d.results[0].__id + "')";
        }
        cs.getGenkiDataAPI(type, url, data, Common.getToken()).done(function() {
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
        url: Common.getBoxUrl() + 'GenkiKunService/getPhoto',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'photo': imageSrc,
            'genkiToken': cs.accessData.genkiToken,
            'refToken': Common.getRefressToken(),
            'myCellUrl': Common.getCellUrl()
        },
        headers:{
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
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

cs.getReceiveMessage = function() {
    $("#messageList").empty();
    cs.getReceivedMessageAPI().done(function(data) {
        var results = data.d.results;
        for (var i in results) {
            var boxName = results[i]["_Box.Name"];
            if (Common.getBoxName() === boxName) {
                var title = results[i].Title;
                var body = results[i].Body;
                var fromCell = results[i].From;
                var uuid = results[i].__id;

                if (results[i].Status !== "approved" && results[i].Status !== "rejected") {
                    var html = '<div class="panel panel-default" id="recMsgParent' + i + '"><div class="panel-heading"><h4 class="panel-title accordion-togle"><a data-toggle="collapse" data-parent="#accordion" href="#recMsg' + i + '" class="allToggle collapsed">' + Common.getCellNameFromUrl(fromCell) + ':[' + title + ']</a></h4></div><div id="recMsg' + i + '" class="panel-collapse collapse"><div class="panel-body">';
                    if (results[i].Type === "message") {
                        html += '<table class="display-table"><tr><td width="80%">' + body + '</td></tr></table>';
                    } else {
                        html += '<table class="display-table"><tr><td width="80%">' + body + '</td>';
                        html += '<td width="10%"><button onClick="Common.approvalRel(\'' + fromCell + '\', \'' + uuid + '\', \'recMsgParent' + i + '\');">' + i18next.t("btn.approve") +'</button></td>';
                        html += '<td width="10%"><button onClick="Common.rejectionRel(\'' + fromCell + '\', \'' + uuid + '\', \'recMsgParent' + i + '\');">' + i18next.t("btn.decline") + '</button></td>';
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
        cs.accessData.photoCell = cellUrl + Common.getBoxName() + "/";
        cs.accessData.photoToken = token;
        cs.accessData.Title = title;
        Common.accessData.fromCell = Common.getCellUrl();
    } else {
        cs.accessData.photoCell = Common.getBoxUrl();
        cs.accessData.photoToken = Common.getToken();
        cs.accessData.Title = i18next.t("me");
    }
    
    sessionStorage.setItem("Common.accessData", JSON.stringify(Common.accessData));
    sessionStorage.setItem("cs.accessInfo", JSON.stringify(cs.accessData));
    location.href = "./genkiPhoto.html";
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
            Common.displayMessageByKey("msg.error.dataNotFound");
        }
    }).fail(function(data) {
        Common.displayMessageByKey("msg.error.dataNotFound");
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
    var filePath = Common.getBoxUrl() + 'Images/' + imageName;
    var oReq = new XMLHttpRequest();
    oReq.open("GET", filePath);
    oReq.responseType = "blob";
    oReq.setRequestHeader("Content-Type", contentType);
    oReq.setRequestHeader("Authorization", "Bearer " + Common.getToken());
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
        url: Common.getBoxUrl() + 'GenkiKunData/shokuji_info?$skip=' + skip + '&$top=' + top + '&$filter=id+eq+%27' + id + '%27&$orderby=shokuji_date%20desc,time%20asc,no%20asc',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
}

cs.openSlide = function() {
    $(".overlay").toggleClass('overlay-on');
    $(".slide-menu").toggleClass('slide-on');
}

cs.getJissekiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: Common.getBoxUrl() + 'GenkiKunData/jisseki?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=jisseki_date%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
};
cs.getSokuteiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: Common.getBoxUrl() + 'GenkiKunData/sokutei?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=sokutei_date%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
};
cs.getShokujiLatestDateAPI = function() {
    var id = cs.accessData.id;
    return $.ajax({
        type: 'GET',
        url: Common.getBoxUrl() + 'GenkiKunData/shokuji?$filter=id+eq+%27' + id + '%27&$top=1&$orderby=shokuji_date%20desc',
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
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
      url: Common.getBoxUrl() + 'GenkiKunService/getData',
      data: {
          'targetUrl':url + 'newpersonium/Response',
          'id':id,
          'nowDate':year + month + day,
          'prevDate': prevDate,
          'genkiToken': cs.accessData.genkiToken
      },
      headers:{
          'Accept':'application/json',
          'Authorization':'Bearer ' + Common.getToken()
      }
  });
};

cs.getReceivedMessageAPI = function() {
  return $.ajax({
                type: "GET",
                url: Common.getCellUrl() + '__ctl/ReceivedMessage?$orderby=__published%20desc',
                headers: {
                    'Authorization':'Bearer ' + Common.getToken(),
                    'Accept':'application/json'
                }
  });
};
