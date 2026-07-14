/* Applique le manifeste des visuels (window.ASSETS, généré depuis Notion) au
   DOM. Tout élément portant data-asset="étiquette" reçoit l'image correspondante
   si elle a été synchronisée ; sinon l'aperçu de remplacement reste affiché.

   - <img data-asset="x">          -> src remplie
   - <div class="mx-fig" …>        -> l'aperçu (.mx-ph/.ph) est masqué et l'image
                                       injectée quand le visuel existe.
   window.applyAssets(root) peut être rappelée après tout rendu dynamique. */
(function () {
  "use strict";
  var slug = function (s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };
  var resolve = function (label) {
    var A = window.ASSETS || {};
    return A[label] || A[slug(label)] || null;
  };
  window.applyAssets = function (root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-asset]");
    nodes.forEach(function (elm) {
      var src = resolve(elm.getAttribute("data-asset"));
      if (!src) return;
      if (elm.tagName === "IMG") {
        elm.src = src;
      } else if (!elm.querySelector("img.asset-img")) {
        var img = document.createElement("img");
        img.className = "asset-img";
        img.src = src;
        img.alt = elm.getAttribute("data-asset-alt") || elm.getAttribute("data-asset") || "";
        elm.insertBefore(img, elm.firstChild);
      }
      var fig = elm.closest ? elm.closest(".mx-fig, .land-figure") : null;
      if (fig) {
        fig.classList.remove("mx-missing");
        var ph = fig.querySelector(".mx-ph, .ph");
        if (ph) ph.style.display = "none";
      }
    });
  };
  if (document.readyState !== "loading") window.applyAssets();
  else document.addEventListener("DOMContentLoaded", function () { window.applyAssets(); });
})();
