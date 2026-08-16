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

  // Pico styles `dialog` as a full-viewport flex container that centres an
  // inner card, rather than as the modal box itself. The image and its close
  // button therefore need a frame of their own to be positioned against —
  // without it, the button anchors to the viewport and lands in the page
  // corner.
  var frame = document.createElement("div");
  frame.className = "lightbox-frame";

  var image = document.createElement("img");
  image.alt = "";

  var close = document.createElement("button");
  close.className = "lightbox-close";
  close.type = "button";
  close.setAttribute("aria-label", "Close image");
  close.textContent = "×";

  frame.appendChild(image);
  frame.appendChild(close);
  dialog.appendChild(frame);
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

  /**
   * Close, and drop the source so a full-size screenshot is not held in memory
   * after the reader has dismissed it.
   *
   * Deliberately not hooked to the dialog's `close` event. That event is
   * specified to fire on every close, but does not fire reliably in practice —
   * verified here in Chrome, where `cancel` fires on Escape and the dialog
   * closes, yet `close` never arrives, even for an explicit `dialog.close()`.
   * Doing the cleanup at each close path is deterministic and costs nothing.
   */
  function closeLightbox() {
    if (dialog.open) dialog.close();
    image.removeAttribute("src");
  }

  close.addEventListener("click", closeLightbox);

  // Clicking outside the image closes. The dialog fills the viewport and the
  // frame wraps the image, so a click landing on the dialog itself is outside.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeLightbox();
  });

  // Escape. `cancel` fires while the dialog is still open, so the default
  // close still happens; `closeLightbox` just makes it explicit and clears up.
  dialog.addEventListener("cancel", closeLightbox);
})();
