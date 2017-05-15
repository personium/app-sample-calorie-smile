// データ取得
function(request){
  // GET 以外は405
  if(request.method !== "GET") {
     return {
            status : 405,
            headers : {"Content-Type":"application/json"},
            body : ['{"error":"method not allowed"}']
     };
  }
  
  var queryValue = request.queryString;
  if (queryValue === "") {
      return {
             status : 400,
             headers : {"Content-Type":"application/json"},
             body : ['{"error":"required parameter not exist."}']
      };
  }
  var params = dc.util.queryParse(queryValue);
  var ContentType = "image/jpeg";

  var urlY = params.targetUrl + "?service=calsml&func=03&username=" + params.id + "&photo=" + params.photo;
  var headersY = {"Authorization": "Bearer " + params.genkiToken,
                  "Accept": ContentType};
  var bodyY = {};
  var contentTypeY = {};

  // エンドポイントへのGET
  var httpclient = null;
  try {
    httpclient = new _p.extension.HttpClient();
  } catch (e) {
    return {
          status: 500,
          headers: {"Content-Type":"text/html"},
          body: ["httpclient Error massage: " + e]
    };
  }

  var apiRes = {status: "", headers: {}, body: []};
  try {
    apiRes = httpclient.get(urlY, headersY, true);
  } catch(e) {
    return {
         status: 500,
         headers: {"Content-Type":"text/plain"},
          body: ["httpclient.get Error massage: " + e]
    };
  }

  if (apiRes === null) {
      return {
          status : 418,
          headers : {"Content-Type":"application/json"},
          body : ['HttpResponse ois null ']
      };
  }
  if (apiRes.status === "") {
      return {
          status : 418,
          headers : {"Content-Type":"text/html"},
          body : ['HTTP Response code is null']
      };
  }

  if (apiRes.status != "200") {
      return {
          status : 418,
          headers : {"Content-Type":"application/json"},
          body : ["HTTP Response code is not 200. This is " + apiRes.status + " body : " + apiRes.body]
      };
  }

  // イメージファイル保存
  var imgName = params.photo.match(".+/(.+?)([\?#;].*)?$")[1];
  var myUrl = {
      "cellUrl": params.myCellUrl,
      "refreshToken": params.refToken
  }
  var box = dc.as(myUrl).cell().box("io_personium_demo_hn-app-genki");
  var col = box.col("Images");
  col.put({
      path: imgName,
      contentType: ContentType,
      data: apiRes.body
  });

  if (apiRes.status == "200") {
      return {
          // レスポンスステータスコードの設定
          status: 200,
          // レスポンスヘッダの設定
          headers : {"Content-Type":"text/plain"},
          body : ['success']
      };
  }
}
