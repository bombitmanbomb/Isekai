const Http = new XMLHttpRequest();
const url = "/authorization";

function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function post(code, username) {
  $.post(
    "/authorization",
    {
      token: code,
      name: username
    }.d
      .done(function(data) {
        let dat = JSON.parse(data);
        console.log(dat);
        if (dat.status === 200) {
          console.log("redirect");
          window.location.href = "https://isekai.glitch.me/";
        }
      })
      .fail(function() {
        console.log("error");
      })
  );
}

$("form").submit(function(event) {
  console.log(event);
});

$(document).ready(function() {
  console.log(location);
  let token = getUrlParameter("code");
  let username = getUrlParameter("nick");
  if (token && username) {
    //console.log(token);
    $("inputcodewindow").hide();
    post(token, username);
  } else if (token) {
    post(token, "test");
  }
});
