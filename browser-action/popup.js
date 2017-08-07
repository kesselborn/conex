var bg = browser.extension.getBackgroundPage();

bg.getImageTags().then(src => {
  document.body.innerHTML = src;
  Array.from(document.getElementsByClassName("thumbnail")).forEach(function(element) {
    element.addEventListener("click", function(event) { 
      bg.activateTab(event.target.dataset.tabId);
    });
  })
});
