const orbs = document.querySelectorAll(".orb");
const floatingUI = document.querySelectorAll(".floating-ui");
const cards = document.querySelectorAll(".work-card");
const players = document.querySelectorAll("[data-player]");
const galleryMounts = document.querySelectorAll("[data-gallery-manifest]");

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
              <figcaption><strong>${title}</strong><span>${note}</span></figcaption>
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
