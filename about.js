/* about theme bootstrap */
(function () {
  try {
    var t = localStorage.getItem("mygpt.theme") || "dark";
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
  } catch (_) {}
})();
