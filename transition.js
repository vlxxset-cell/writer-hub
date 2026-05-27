document.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", (e) => {
    const hrefAttr = link.getAttribute("href");
    if (!hrefAttr || hrefAttr.startsWith("#") || hrefAttr.trim() === "") return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:") || hrefAttr.startsWith("javascript:")) return;

    e.preventDefault();

    document.body.style.opacity = "0";

    setTimeout(() => {
      window.location.href = link.href;
    }, 200);
  });
});

