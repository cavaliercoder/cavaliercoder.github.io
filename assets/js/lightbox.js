/**
 * Click-to-zoom for post screenshots.
 *
 * Replaces jQuery plus FancyBox, which loaded on every page from two CDNs to
 * serve seventeen anchors across four posts. A native <dialog> supplies focus
 * trapping, Escape to close, the backdrop and inertness of the page behind, so
 * this file is only the glue.
 *
 * The hook is `a.lightbox`, unchanged, so no post source needed editing.
 */
(function () {
  "use strict";

  var links = document.querySelectorAll("a.lightbox");
  if (!links.length) return;

  // Without dialog support the anchors stay plain links to the full-size
  // image, which is a reasonable outcome rather than a broken one.
  if (typeof HTMLDialogElement === "undefined") return;

  var dialog = document.createElement("dialog");
  dialog.className = "lightbox-dialog";

  var image = document.createElement("img");
  image.alt = "";

  var close = document.createElement("button");
  close.className = "lightbox-close";
  close.type = "button";
  close.setAttribute("aria-label", "Close image");
  close.textContent = "×";

  dialog.appendChild(image);
  dialog.appendChild(close);
  document.body.appendChild(dialog);

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      // Let modified clicks through so opening in a new tab still works.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      var thumb = link.querySelector("img");
      image.src = link.href;
      image.alt = thumb ? thumb.alt : "";
      dialog.showModal();
    });
  });

  close.addEventListener("click", function () {
    dialog.close();
  });

  // Clicking the backdrop closes. The dialog is only as large as the image, so
  // any click landing on the element itself is outside the image.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  // Drop the source on close so a large screenshot is not held in memory, and
  // so reopening a different image never flashes the previous one.
  dialog.addEventListener("close", function () {
    image.removeAttribute("src");
  });
})();
