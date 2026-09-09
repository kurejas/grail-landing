/* ============================================================
   Grail — landing
   No dependencies. ~6 KB unminified.
   ============================================================ */
(function () {
  "use strict";

  /* ── Switches ─────────────────────────────────────────────
     section2       "animated" — HOW / GRAIL / WORKS stagger in on arrival
                    "static"   — plain fade, exactly as the Figma frame
     phoneCrossfade true       — the Grail University phone cycles through its
                                 three screens (all in the Figma file);
                                 false holds the first screen only
     ------------------------------------------------------- */
  var CONFIG = {
    section2: "animated",
    phoneCrossfade: true
  };

  /* Slide timings come from the prototype's own reactions
     (38:16308 → ON_CLICK, SMART_ANIMATE, EASE_IN_AND_OUT). */
  var DUR_FWD  = 600;
  var DUR_BACK = 300;

  var doc = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1 · Layout ──────────────────────────────────────────
     Nothing to do here any more. The slides used to be a fixed Figma
     surface that this scaled with a transform; they are now laid out
     fluidly in CSS, so type stays at a real, readable size and the
     composition reflows around it. Kept as a marker so the section
     numbering below still lines up with the CSS. */

  /* ── 2 · Modes ───────────────────────────────────────────── */
  doc.dataset.s2 = CONFIG.section2;
  if (CONFIG.section2 === "animated") {
    /* Slide 2's group carries the reveal so the title and the avatar arrive
       together. For the staggered version the group's own fade is dropped and
       the three words plus the avatar reveal individually instead — opacity
       only, so the rigid group geometry is untouched either way. */
    var grp = document.querySelector(".how__group");
    if (grp) {
      grp.removeAttribute("data-reveal");
      var words = grp.querySelectorAll(".how__w");
      for (var i = 0; i < words.length; i++) {
        words[i].setAttribute("data-reveal", "");
        words[i].style.setProperty("--d", (i * 90) + "ms");
      }
      var av = grp.querySelector(".how__avatar");
      if (av) {
        av.setAttribute("data-reveal", "");
        av.style.setProperty("--d", (words.length * 90) + "ms");
      }
    }
  }
  if (CONFIG.phoneCrossfade && !reduced) doc.dataset.guCrossfade = "on";

  var deck = document.getElementById("deck");
  var sections = [].slice.call(document.querySelectorAll(".sec"));
  var dots = [].slice.call(document.querySelectorAll(".dots__dot"));
  var byId = {};
  dots.forEach(function (d) { if (d.dataset.go) byId[d.dataset.go] = d; });

  /* Later slides paint above earlier ones: the incoming slide rises over the
     one it replaces, and going back it drops away to reveal it again. */
  sections.forEach(function (s, i) { s.style.zIndex = String(i + 1); });

  /* Stagger the reveal of the pieces inside each section */
  sections.forEach(function (s) {
    [].slice.call(s.querySelectorAll("[data-reveal]")).forEach(function (el, i) {
      el.style.setProperty("--d", (i * 110) + "ms");
    });
  });

  /* ── 3 · Deferred images ─────────────────────────────────
     Only the hero is fetched up front; each slide's images are pulled in as
     the slide before it becomes current, so they are ready before it rises. */
  function loadImages(sec) {
    if (!sec) return;
    var imgs = sec.querySelectorAll("img[data-src]");
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].src = imgs[i].dataset.src;
      imgs[i].removeAttribute("data-src");
    }
  }

  addEventListener("load", function () {
    var rest = function () { sections.forEach(loadImages); };
    if (window.requestIdleCallback) requestIdleCallback(rest, { timeout: 3000 });
    else setTimeout(rest, 1200);
  });

  /* ── 4 · Hero video ──────────────────────────────────────── */
  var video = document.querySelector(".phone__video");
  var videoLoaded = false;
  var START_AT = 2 / 24;          // frame 3 of a 24fps source

  /* Plays once while its slide is on screen. Leaving pauses it where it is and
     coming back resumes from there — unless it had already finished, in which
     case it starts over. The poster (frame 1 of the video) covers the wait
     while it loads. */
  function playVideo(on) {
    if (!video) return;

    if (!on) {
      if (videoLoaded && !video.paused) video.pause();
      return;
    }

    if (!videoLoaded) {
      var src = video.querySelector("source[data-src]");
      if (src) { src.src = src.dataset.src; video.load(); }
      video.addEventListener("loadedmetadata", function () {
        try { video.currentTime = START_AT; } catch (e) {}
      }, { once: true });
      videoLoaded = true;
    }

    /* Frame 3, not 0 — the first couple of frames are black, so starting a
       hair in matches the poster and avoids a flash of nothing. 24fps. */
    if (video.ended || video.currentTime < START_AT) {
      try { video.currentTime = START_AT; } catch (e) {}
    }

    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
  }

  /* ── 5 · The slide deck ──────────────────────────────────
     One slide is current; everything before it sits at 0.9 behind, everything
     after waits a full viewport below. Only the outgoing and incoming slides
     animate — the rest are moved with transitions suppressed, so a jump
     straight from slide 1 to slide 4 does not fan the middle ones past. */
  var cur = 0;
  var busy = false;

  /* ── Slide background colour ───────────────────────────
     Each slide's card is "transparent -> theme at 50% -> gold at 100%". The
     themed stop is driven by --deck-mid / --deck-0 on :root so that a slide
     change EASES from one colour to the next rather than snapping. Done here
     rather than with a CSS transition because the cards two or more slides
     away are visibility:hidden, and a transition started on a hidden element
     stays pinned to its start value. */
  var THEMES = { blue: [32, 76, 104], slate: [70, 79, 117], grey: [80, 80, 80] };
  var deckRGB = THEMES.blue.slice();
  var deckRAF = 0;
  var deckTimer = 0;
  var deckTo = THEMES.blue.slice();

  function paintDeck(rgb) {
    var c = "rgb(" + Math.round(rgb[0]) + ", " + Math.round(rgb[1]) + ", " + Math.round(rgb[2]) + ")";
    doc.style.setProperty("--deck-mid", c);
    doc.style.setProperty("--deck-0", "rgba(" + Math.round(rgb[0]) + ", " + Math.round(rgb[1]) + ", " + Math.round(rgb[2]) + ", 0)");
  }

  function settleDeck() {                 /* jump straight to the target */
    if (deckRAF) { cancelAnimationFrame(deckRAF); deckRAF = 0; }
    if (deckTimer) { clearTimeout(deckTimer); deckTimer = 0; }
    deckRGB = deckTo.slice();
    paintDeck(deckRGB);
  }

  function tweenTheme(name) {
    deckTo = (THEMES[name] || THEMES.blue).slice();
    var to = deckTo, from = deckRGB.slice();
    if (from[0] === to[0] && from[1] === to[1] && from[2] === to[2]) return;

    var dur = reduced ? 0 : parseFloat(doc.style.getPropertyValue("--slide-dur")) || DUR_FWD;
    if (deckRAF) { cancelAnimationFrame(deckRAF); deckRAF = 0; }
    if (deckTimer) { clearTimeout(deckTimer); deckTimer = 0; }
    if (!dur || document.hidden) { settleDeck(); return; }

    /* rAF is frozen while the tab is in the background, which would strand the
       colour part-way. A timer for the same span always fires, so it lands the
       final colour whatever happened to the frames. */
    deckTimer = setTimeout(settleDeck, dur + 60);

    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   /* easeInOutCubic */
      deckRGB = [
        from[0] + (to[0] - from[0]) * e,
        from[1] + (to[1] - from[1]) * e,
        from[2] + (to[2] - from[2]) * e
      ];
      paintDeck(deckRGB);
      if (p < 1) deckRAF = requestAnimationFrame(step);
      else settleDeck();
    })(t0);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) settleDeck();
  });

  function render(from, to) {
    var animate = [from, to];

    sections.forEach(function (s, i) {
      if (animate.indexOf(i) === -1) s.classList.add("no-trans");
    });
    void deck.offsetHeight;                      // flush, so no-trans applies first

    sections.forEach(function (s, i) {
      s.classList.toggle("is-current", i === to);
      s.classList.toggle("is-past", i < to);
      s.classList.toggle("is-far", Math.abs(i - to) > 1);
    });

    dots.forEach(function (d) {
      d.classList.toggle("is-active", d === byId[sections[to].id]);
    });
    doc.dataset.theme = sections[to].dataset.theme || "blue";

    enterScroll(from, to);

    loadImages(sections[to]);
    loadImages(sections[to + 1]);
    playVideo(sections[to].id === "s1");

    /* The banner is an invitation to sign up. Once the signup form itself is
       on screen it has done its job, so it retires rather than covering it. */
    if (sections[to].id === "s9" && window.__grailHidePromo) window.__grailHidePromo();

    /* "How it Works" in the nav is a plain blue link everywhere except the
       How it Works run itself — s2 (its title slide) through s7 — where the
       frames show it gold and italic. */
    var HOW = { s2: 1, s3: 1, s4: 1, s5: 1, s6: 1, s7: 1 };
    if (HOW[sections[to].id]) document.documentElement.setAttribute("data-nav", "how");
    else document.documentElement.removeAttribute("data-nav");

    tweenTheme(sections[to].dataset.theme || "blue");

    setTimeout(function () {
      sections.forEach(function (s) { s.classList.remove("no-trans"); });
    }, 40);
  }

  function go(to) {
    to = Math.max(0, Math.min(sections.length - 1, to));
    if (to === cur || busy) return;

    var dur = reduced ? 0 : (to > cur ? DUR_FWD : DUR_BACK);
    /* On :root, not the deck — the fixed chrome and the dot rail live outside
       the deck and need the same clock for their theme colour change. */
    doc.style.setProperty("--slide-dur", dur + "ms");

    var from = cur;
    cur = to;
    busy = true;
    render(from, to);

    /* Released just before the slide fully settles — the last stretch of an
       ease-in-out is visually finished, and waiting the full 600ms before
       accepting the next scroll is what makes a deck feel unresponsive. */
    setTimeout(function () { busy = false; }, Math.max(150, dur - 120));
  }

  /* ── 5b · Scrolling inside a slide that is taller than the viewport ──
     The min-height floor can make a slide taller than the window. Rather
     than cropping it, the slide scrolls: the wheel moves the card up to its
     own bottom edge first, and only a FRESH gesture at that edge hands off
     to the deck. If the slide fits, overflow is 0 and none of this runs —
     the deck behaves exactly as before.

     Hero only for now, on purpose: this is the first cut of the behaviour. */
  var SCROLLS = { s1: true, s3: true, s4: true, s5: true, s6: true, s7: true };

  var scrollPos = 0;      // px the current slide is scrolled by
  var overAcc = 0;        // delta pushed INTO an edge since reaching it
  var OVER_STEP = 50;     // that much past the edge hands off to the deck

  function overflowOf(i) {
    var s = sections[i];
    if (!s || !SCROLLS[s.id]) return 0;
    return Math.max(0, s.offsetHeight - innerHeight);
  }

  function applyScroll(i, px) {
    sections[i].style.setProperty("--scroll", px + "px");
  }

  /* Arriving downward you land at the top; arriving upward you land at the
     bottom, so the motion carries on in the direction you were going rather
     than snapping to the far end of the slide. */
  function enterScroll(from, to) {
    scrollPos = (to < from) ? overflowOf(to) : 0;
    applyScroll(to, scrollPos);
  }

  /* Returns true when the event was spent inside the slide and the deck
     should not act on it.

     Reaching the edge does NOT swallow the rest of the gesture. That was the
     first cut and it stalled: trackpad inertia keeps firing for a second or
     more after a flick, so the stream never went quiet and nothing advanced
     until you stopped dead — the same "I have to wait" problem the deck
     already had. Instead the edge collects overscroll, and OVER_STEP px
     pushed into it hands off to the deck. That works for a flick, a slow
     drag and a notched mouse wheel alike, and never needs a pause. */
  function scrollWithin(dy, now) {
    var max = overflowOf(cur);
    if (!max) return false;

    if (now - wheelLast >= WHEEL_REARM) overAcc = 0;    // the gesture ended

    var next = Math.max(0, Math.min(max, scrollPos + dy));
    if (next !== scrollPos) {
      scrollPos = next;
      applyScroll(cur, scrollPos);
      overAcc = 0;
      /* Keep the deck's own tracker in step so this event cannot also be
         counted as a slide move. */
      wheelLast = now; wheelPrev = Math.abs(dy);
      wheelArmed = false; wheelAcc = 0;
      return true;
    }

    /* Pinned at an edge and still pushing into it. */
    if ((dy > 0 && scrollPos >= max) || (dy < 0 && scrollPos <= 0)) {
      if (overAcc !== 0 && (overAcc > 0) !== (dy > 0)) overAcc = 0;  // turned around
      overAcc += dy;
      wheelLast = now; wheelPrev = Math.abs(dy);
      if (Math.abs(overAcc) >= OVER_STEP) {
        overAcc = 0;
        wheelArmed = false; wheelAcc = 0;
        go(cur + (dy > 0 ? 1 : -1));
      }
      return true;
    }
    return false;
  }

  addEventListener("resize", function () {
    var max = overflowOf(cur);
    scrollPos = Math.max(0, Math.min(max, scrollPos));
    applyScroll(cur, scrollPos);
  }, { passive: true });

  /* First paint — after SCROLLS exists, since render() seeds the scroll. */
  render(0, 0);

  /* ── 6 · Input ───────────────────────────────────────────── */

  /* Wheel / trackpad — one gesture moves one slide, but a hand that keeps
     scrolling keeps moving.

     Two things have to be told apart, and they arrive as identical events:
     the decaying tail of a flick that has already been counted, and a person
     still actively scrolling. The tell is the shape of the stream — inertia
     only ever decays, so once a move has fired, an event LARGER than the one
     before it means the hand is pushing again.

     Comparing against the previous event matters. Comparing against the
     largest delta of the gesture instead looks similar but strands the user:
     after a hard flick peaking near 110, ordinary continued scrolling around
     40 never beats that peak, so the deck sits there until you stop dead and
     wait. Against the previous event, the next real push re-arms at once. */
  var WHEEL_THRESHOLD = 24;   // delta that counts as a deliberate move
  var WHEEL_REARM = 160;      // quiet time that ends a gesture outright
  var WHEEL_RISE = 6;         // growth over the last event that reads as intent
  var WHEEL_RISE_PCT = 1.15;  // ...and it must be a clear step, not decay jitter
  var WHEEL_FLOOR = 10;       // ignore jitter at the very end of a tail

  var wheelAcc = 0, wheelArmed = true, wheelPrev = 0, wheelLast = -1e9;

  /* Decides what one wheel event means. Driven by the event's own timestamp
     rather than a setTimeout, because background tabs clamp timers to ~1s —
     precisely the case a timer-based lock would need to be accurate in.
     Returns -1, 0 or 1. */
  function wheelStep(dy, now, locked) {
    var abs = Math.abs(dy);
    var gap = now - wheelLast;
    var prev = wheelPrev;
    wheelLast = now;
    wheelPrev = abs;

    if (gap >= WHEEL_REARM) {                 // the stream went quiet: new gesture
      wheelArmed = true;
      wheelAcc = 0;
    }

    if (!wheelArmed) {
      /* Rising again means a fresh push — but never while a slide is still
         moving, because the opening ramp of the flick we just counted is
         itself rising, and re-arming there would spend one flick twice. */
      if (!locked && abs >= WHEEL_FLOOR &&
          abs > prev + WHEEL_RISE && abs > prev * WHEEL_RISE_PCT) {
        wheelArmed = true;
        wheelAcc = 0;
      } else {
        return 0;
      }
    }

    wheelAcc += dy;
    if (Math.abs(wheelAcc) <= WHEEL_THRESHOLD) return 0;

    wheelAcc = 0;
    wheelArmed = false;
    return dy > 0 ? 1 : -1;
  }

  addEventListener("wheel", function (e) {
    e.preventDefault();
    if (!busy && scrollWithin(e.deltaY, e.timeStamp)) return;
    var dir = wheelStep(e.deltaY, e.timeStamp, busy);
    if (dir && !busy) go(cur + dir);
  }, { passive: false });

  /* Touch — a drag scrolls within a tall slide; a swipe changes slide. A
     drag that did any scrolling is spent, so it never does both at once. */
  var touchY = null, touchLastY = null, touchScrolled = false;

  addEventListener("touchstart", function (e) {
    touchY = touchLastY = e.touches[0].clientY;
    touchScrolled = false;
  }, { passive: true });

  addEventListener("touchmove", function (e) {
    if (e.cancelable) e.preventDefault();       // no rubber-banding over the deck
    if (touchLastY === null || busy) return;
    var max = overflowOf(cur);
    if (!max) return;
    var y = e.touches[0].clientY;
    var next = Math.max(0, Math.min(max, scrollPos + (touchLastY - y)));
    touchLastY = y;
    if (next !== scrollPos) {
      scrollPos = next;
      applyScroll(cur, scrollPos);
      touchScrolled = true;
    }
  }, { passive: false });

  addEventListener("touchend", function (e) {
    if (touchY === null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = touchLastY = null;
    if (touchScrolled) return;                  // spent scrolling
    if (Math.abs(dy) > 45) go(cur + (dy > 0 ? 1 : -1));
  }, { passive: true });

  /* Keyboard */
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, to = null;
    if (k === "ArrowDown" || k === "PageDown" || k === " ") to = cur + 1;
    else if (k === "ArrowUp" || k === "PageUp") to = cur - 1;
    else if (k === "Home") to = 0;
    else if (k === "End") to = sections.length - 1;
    if (to === null) return;
    e.preventDefault();
    go(to);
  });

  /* Dots and in-page links */
  function indexOfId(id) {
    for (var i = 0; i < sections.length; i++) if (sections[i].id === id) return i;
    return -1;
  }

  dots.forEach(function (d) {
    if (!d.dataset.go) return;
    d.addEventListener("click", function () { go(indexOfId(d.dataset.go)); });
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute("href");
    if (href === "#") { e.preventDefault(); return; }   // placeholder, goes nowhere
    var i = indexOfId(href.slice(1));
    if (i < 0) return;
    e.preventDefault();
    go(i);
  });

  /* ── 7 · Promo banner ────────────────────────────────────
     Rises 3s after load, sits fixed bottom-left over the slides, and drops
     away when dismissed. Dismissal lasts for this page view only — nothing
     is stored, so a reload shows it again 4s later. */
  var PROMO_DELAY = 3000;

  var promo = document.getElementById("promo");
  var promoClose = document.getElementById("promo-close");

  function hidePromo() {
    if (!promo || promo.hidden) return;
    promo.classList.remove("is-up");
    setTimeout(function () { promo.hidden = true; }, 700);
  }
  window.__grailHidePromo = hidePromo;   // render() calls this on the form slide

  var dismissed = false;

  if (promo && promoClose) {
    var promoTimer = setTimeout(function () {
      if (dismissed) return;
      promo.hidden = false;
      /* The element has to be laid out at its off-screen position before the
         class change can animate away from it. A timer rather than rAF —
         rAF is suspended while the tab is hidden, which would leave the
         banner un-shown with no way back until the tab is looked at. */
      setTimeout(function () { promo.classList.add("is-up"); }, 30);
    }, PROMO_DELAY);

    promoClose.addEventListener("click", function () {
      clearTimeout(promoTimer);          // in case it is dismissed mid-reveal
      dismissed = true;
      hidePromo();
    });
  }

  /* ── 8 · Signup form ─────────────────────────────────────
     Posts to signup.php. Submitted over fetch so the deck is not navigated
     away from; without JS the plain form POST still works and signup.php
     redirects back with ?signup=ok. */
  var joinForm = document.querySelector(".join__form");
  var joinSection = document.getElementById("s9");
  var joinMore = document.querySelector(".join__more");
  var stateForm = document.querySelector(".join__state--form");
  var stateDone = document.querySelector(".join__state--done");
  var againBtn = document.querySelector(".join__again");

  function joinState(name) {
    if (joinSection) joinSection.dataset.state = name;
  }

  /* The three optional questions only appear once there is a usable email —
     five fields on arrival is a lot to face, and the frames show two. */
  if (joinForm && joinMore) {
    var emailField = joinForm.querySelector('input[name="email"]');
    var revealed = false;
    if (emailField) {
      emailField.addEventListener("input", function () {
        if (revealed) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailField.value.trim())) return;
        revealed = true;
        joinMore.hidden = false;
        joinState("extended");
      });
    }
  }

  if (againBtn && stateForm && stateDone && joinForm) {
    againBtn.addEventListener("click", function () {
      stateDone.hidden = true;
      stateForm.hidden = false;
      joinForm.reset();
      if (joinMore) joinMore.hidden = true;
      joinState("form");
      var first = joinForm.querySelector('input[name="name"]');
      if (first) first.focus();
    });
  }

  if (joinForm) {
    var status = joinForm.querySelector(".join__status");
    var submit = joinForm.querySelector(".join__submit");

    function say(text, state) {
      if (!status) return;
      status.textContent = text;
      status.setAttribute("data-state", state);
    }

    /* An error message describes the state of the form at the moment it was
       submitted. As soon as the person edits any field that state is stale, so
       the message clears — otherwise "Please enter a valid email address"
       keeps accusing them after they have typed one. Only errors are cleared;
       the "Thanks" confirmation is left alone. */
    joinForm.addEventListener("input", function () {
      if (status && status.getAttribute("data-state") === "error") say("", "");
    });

    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      say("Sending…", "");
      if (submit) submit.disabled = true;

      fetch(joinForm.action, {
        method: "POST",
        body: new FormData(joinForm),
        headers: { "Accept": "application/json", "X-Requested-With": "fetch" }
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok, message: r.ok ? "Thanks!" : "Something went wrong." }; }); })
        .then(function (d) {
          if (d.ok && stateForm && stateDone) {
            /* swap to the thank-you panel rather than just printing a line */
            stateForm.hidden = true;
            stateDone.hidden = false;
            joinState("done");
            say("", "");
            return;
          }
          say(d.message || "Something went wrong.", d.ok ? "ok" : "error");
        })
        .catch(function () { say("Network error — please try again.", "error"); })
        .then(function () { if (submit) submit.disabled = false; });
    });
  }

  /* Non-JS round trip comes back with ?signup=ok|error */
  var signupParam = new URLSearchParams(location.search).get("signup");
  if (signupParam) {
    var s = document.querySelector(".join__status");
    if (s) {
      s.textContent = signupParam === "ok" ? "Thanks! Check your inbox soon." : "Could not send just now — please try again.";
      s.setAttribute("data-state", signupParam === "ok" ? "ok" : "error");
    }
  }
})();
