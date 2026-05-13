const orbs = document.querySelectorAll(".orb");
const floatingUI = document.querySelectorAll(".floating-ui");
const cards = document.querySelectorAll(".work-card");
const players = document.querySelectorAll("[data-player]");
const galleryMounts = document.querySelectorAll("[data-gallery-manifest]");
const quoteModules = document.querySelectorAll("[data-random-quote]");
const noemaHighlights = document.querySelectorAll("[data-noema-highlight]");

const japaneseQuotes = [
  {
    text: "静けさの中に信号がある",
    translation: "There is a signal inside stillness."
  },
  {
    text: "夢は古い機械のように光る",
    translation: "Dreams glow like old machines."
  },
  {
    text: "忘れた場所にも音は残る",
    translation: "Sound remains even in forgotten places."
  },
  {
    text: "余白は入口になる",
    translation: "Empty space becomes an entrance."
  },
  {
    text: "記憶は水面のコード",
    translation: "Memory is code on the water."
  }
];

document.addEventListener("mousemove", (event) => {
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;

  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 22;
    orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });

  floatingUI.forEach((item, index) => {
    const speed = (index + 1) * 8;
    item.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
});

cards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;

    card.style.transform = `
      perspective(900px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateY(-14px)
      scale(1.015)
    `;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

quoteModules.forEach((module) => {
  const quote = japaneseQuotes[Math.floor(Math.random() * japaneseQuotes.length)];
  const text = module.querySelector("[data-quote-text]");
  const translation = module.querySelector("[data-quote-translation]");

  if (text) {
    text.textContent = quote.text;
  }

  if (translation) {
    translation.textContent = quote.translation;
  }
});

players.forEach((player) => {
  const trackButtons = Array.from(player.querySelectorAll(".player-track"));
  const title = player.querySelector("[data-player-title]");
  const status = player.querySelector("[data-player-status]");
  const progress = player.querySelector(".player-progress span");
  const actions = player.querySelectorAll("[data-action]");
  const audio = new Audio();
  let activeIndex = 0;

  const playActive = () => {
    if (!audio.getAttribute("src")) {
      status.textContent = "No audio file connected yet.";
      return;
    }

    audio.play()
      .then(() => {
        status.textContent = "Playing.";
      })
      .catch(() => {
        status.textContent = "File missing or blocked.";
      });
  };

  const selectTrack = (index) => {
    if (!trackButtons.length || !title || !status || !progress) {
      return;
    }

    activeIndex = (index + trackButtons.length) % trackButtons.length;
    const activeTrack = trackButtons[activeIndex];

    trackButtons.forEach((button, buttonIndex) => {
      button.classList.toggle("is-active", buttonIndex === activeIndex);
    });

    const source = activeTrack.dataset.src || "";

    title.textContent = activeTrack.dataset.track;
    audio.pause();
    audio.removeAttribute("src");

    if (source) {
      audio.src = source;
    }

    status.textContent = source ? "Loaded. Press play." : "Empty slot.";
    progress.style.width = `${18 + activeIndex * 12}%`;
  };

  trackButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      selectTrack(index);
      playActive();
    });
  });

  actions.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "previous") {
        selectTrack(activeIndex - 1);
        return;
      }

      if (action === "next") {
        selectTrack(activeIndex + 1);
        return;
      }

      if (action === "play") {
        playActive();
        return;
      }

      audio.pause();
      status.textContent = "Playback paused.";
    });
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || !progress) {
      return;
    }

    progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  });

  selectTrack(0);
});

galleryMounts.forEach((mount) => {
  const manifestPath = mount.dataset.galleryManifest;

  if (!manifestPath) {
    return;
  }

  fetch(manifestPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Gallery manifest unavailable.");
      }

      return response.json();
    })
    .then((galleryData) => {
      const groups = Array.isArray(galleryData.groups)
        ? galleryData.groups
        : [{ title: "image cache", note: "", images: Array.isArray(galleryData) ? galleryData : galleryData.images }];

      if (!groups.some((group) => Array.isArray(group.images) && group.images.length)) {
        mount.innerHTML = '<p class="noema-empty">No images are listed in this cache yet.</p>';
        return;
      }

      const manifestUrl = new URL(manifestPath, window.location.href);
      const siteRoot = new URL(window.location.origin);

      mount.innerHTML = groups.map((group, groupIndex) => {
        const items = Array.isArray(group.images) ? group.images : [];
        const groupTitle = group.title || `cache ${String(groupIndex + 1).padStart(2, "0")}`;
        const groupNote = group.note || "";
        const countLabel = `${items.length} ${items.length === 1 ? "image" : "images"}`;

        const images = items.map((item, index) => {
          const source = item.src || "";
          const imageUrl = source.startsWith("/")
            ? new URL(source, siteRoot).href
            : new URL(source, manifestUrl).href;
          const title = item.title || `signal ${String(index + 1).padStart(2, "0")}`;
          const alt = item.alt || title;
          const note = item.note || "open detail";

          return `
            <figure class="noema-art">
              <a class="noema-image-link" href="${imageUrl}" target="_blank" rel="noopener" aria-label="Open ${alt}">
                <img src="${imageUrl}" alt="${alt}" loading="lazy">
                <span class="noema-zoom-icon" aria-hidden="true"></span>
              </a>
              <figcaption><strong>${title}</strong><span>${note}</span><em>via unknown source</em></figcaption>
            </figure>
          `;
        }).join("");

        return `
          <article class="noema-group">
            <header class="noema-group-head">
              <span>${countLabel}</span>
              <strong>${groupTitle}</strong>
              ${groupNote ? `<p>${groupNote}</p>` : ""}
            </header>
            <div class="noema-group-grid">
              ${images}
            </div>
          </article>
        `;
      }).join("");
    })
    .catch(() => {
      mount.innerHTML = '<p class="noema-empty">Gallery manifest could not be loaded. Serve the site locally or check images/work/noema/gallery.json.</p>';
    });
});

noemaHighlights.forEach((highlight) => {
  fetch("images/work/noema/gallery.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Noema gallery unavailable.");
      }

      return response.json();
    })
    .then((galleryData) => {
      const groups = Array.isArray(galleryData.groups) ? galleryData.groups : [];
      const images = groups.flatMap((group) => {
        const groupImages = Array.isArray(group.images) ? group.images : [];

        return groupImages.map((image) => ({
          ...image,
          groupTitle: group.title || "noema"
        }));
      });

      if (!images.length) {
        return;
      }

      const image = images[Math.floor(Math.random() * images.length)];
      const source = image.src || "";
      const imageUrl = source.startsWith("/")
        ? new URL(source, window.location.origin).href
        : new URL(source, new URL("images/work/noema/gallery.json", window.location.href)).href;
      const title = highlight.querySelector("[data-highlight-title]");
      const note = highlight.querySelector("[data-highlight-note]");

      highlight.style.setProperty("--highlight-image", `url("${imageUrl}")`);
      highlight.classList.add("has-highlight-image");

      if (title) {
        title.textContent = image.groupTitle;
      }

      if (note) {
        note.textContent = image.title ? `${image.title} / ${image.note || "open cache"}` : image.note || "open cache";
      }
    })
    .catch(() => {
      const title = highlight.querySelector("[data-highlight-title]");
      const note = highlight.querySelector("[data-highlight-note]");

      if (title) {
        title.textContent = "noema";
      }

      if (note) {
        note.textContent = "Open the image cache.";
      }
    });
});
