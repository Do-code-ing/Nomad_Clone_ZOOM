"use strict";

const images = [
  "puppy.jpg",
  "cat.jpg",
  "lion.jpg",
  "penguin.jpg",
  "polar_bear.jpg",
];

const bgImg = document.getElementById("bgImg");
let currentBackgroundImg = "url(public/img/puppy.jpg)";
bgImg.style.backgroundImage = currentBackgroundImg;
const backgroundSelect = document.getElementById("background-img-change");

function handleBgImgChange() {
  const selected =
    backgroundSelect.options[backgroundSelect.selectedIndex].text;
  currentBackgroundImg = `url(public/img/${selected}.jpg)`;
  bgImg.style.backgroundImage = currentBackgroundImg;
}

backgroundSelect.addEventListener("input", handleBgImgChange);

images.forEach((img) => {
  const option = document.createElement("option");
  option.value = img;
  option.innerText = img.slice(0, -4);
  if (bgImg.style.backgroundImage === `url(public/img/${img})`) {
    option.selected = true;
  }
  backgroundSelect.appendChild(option);
});
