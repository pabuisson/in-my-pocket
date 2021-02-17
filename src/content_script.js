console.log("coucou 1")

const links = document.querySelectorAll(".result__a")
console.log(`found ${links.length} links in the page`)
links.forEach(link => {
  link.style.color = "red !important"
})
