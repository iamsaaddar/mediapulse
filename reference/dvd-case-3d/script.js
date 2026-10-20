/* ================================================================
   PARALLAX — 3D DVD case controller

   Two completely independent pieces of state:
     • view  → whole-case rotation  (applied to .case)
     • open  → lid hinge            (applied via the .is-open class)

   They never fight because they live on different nested elements.
   ================================================================ */
(function () {
  "use strict";

  var stage    = document.getElementById("stage");
  var caseEl   = document.getElementById("case");

  var btnFront = document.getElementById("btn-front");
  var btnBack  = document.getElementById("btn-back");
  var btnSide  = document.getElementById("btn-side");
  var btnOpen  = document.getElementById("btn-open");
  var btnClose = document.getElementById("btn-close");
  var btnReset = document.getElementById("btn-reset");

  /* ----------------------------- tuning ------------------------ */
  var BASE_TILT   = -6;    // default slight downward tilt (deg)
  var MIN_TILT    = -28;   // look up from below
  var MAX_TILT    = 16;    // look down from above
  var DRAG_YAW    = 0.45;  // degrees of rotation per pixel dragged
  var DRAG_PITCH  = 0.30;
  var SIDE_ANGLE  = 58;    // shows the spine
  var BACK_ANGLE  = 180;

  /* ------------------------------ state ------------------------ */
  var view = { yaw: 0, pitch: BASE_TILT };
  var isOpen = false;
  var drag = null;

  /* ---------------------------- helpers ------------------------ */

  function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  /* Shortest signed angular difference from `from` to `to` (-180..180) */
  function shortestDelta(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  /* Write the whole-case rotation. Only this element carries it. */
  function renderView() {
    caseEl.style.transform =
      "rotateX(" + view.pitch.toFixed(2) + "deg) " +
      "rotateY(" + view.yaw.toFixed(2) + "deg)";
  }

  /* Rotate to an absolute angle, always taking the short way round. */
  function rotateTo(degrees) {
    view.yaw += shortestDelta(view.yaw, degrees);
    renderView();
  }

  /* Open / close the lid. Purely a class flip — CSS owns the hinge. */
  function setOpen(open) {
    isOpen = open;
    caseEl.classList.toggle("is-open", open);
    stage.classList.toggle("is-open", open);
    btnOpen.disabled = open;
    btnClose.disabled = !open;
  }

  /* --------------------------- drag / orbit -------------------- */

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw: view.yaw,
      pitch: view.pitch
    };

    caseEl.classList.add("is-dragging");
    stage.classList.add("is-dragging");

    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
    }
    event.preventDefault(); // stop text selection / native drag
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;

    var dx = event.clientX - drag.x;
    var dy = event.clientY - drag.y;

    view.yaw   = drag.yaw + dx * DRAG_YAW;
    view.pitch = clamp(drag.pitch - dy * DRAG_PITCH, MIN_TILT, MAX_TILT);

    renderView();
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;

    drag = null;
    caseEl.classList.remove("is-dragging");
    stage.classList.remove("is-dragging");

    if (stage.releasePointerCapture && stage.hasPointerCapture &&
        stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  }

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerUp);
  stage.addEventListener("lostpointercapture", onPointerUp);
  stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* ---------------------------- buttons ------------------------ */

  btnFront.addEventListener("click", function () { rotateTo(0); });
  btnBack .addEventListener("click", function () { rotateTo(BACK_ANGLE); });
  btnSide .addEventListener("click", function () { rotateTo(SIDE_ANGLE); });

  btnOpen .addEventListener("click", function () { setOpen(true); });
  btnClose.addEventListener("click", function () { setOpen(false); });

  btnReset.addEventListener("click", function () {
    setOpen(false);

    /* normalise the continuous yaw into -180..180 so Reset never
       spins the long way round after several full turns */
    view.yaw = ((view.yaw % 360) + 540) % 360 - 180;
    view.pitch = BASE_TILT;

    rotateTo(0);
  });

  /* ----------------------------- init -------------------------- */

  renderView();
  setOpen(false);
})();