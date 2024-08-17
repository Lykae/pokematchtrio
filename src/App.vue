<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from './components/card.vue'
import { useGame } from './core/useGame'
import { basicCannon, schoolPride } from './core/utils'
import PinchZoom from 'pinch-zoom-js';
//import {AndroidFullScreen} from '@awesome-cordova-plugins/android-full-screen'
//import isPlatform from '@ionic/vue';

const containerRef = ref<HTMLElement | undefined>()
const clickAudioRef = ref<HTMLAudioElement | undefined>()
const dropAudioRef = ref<HTMLAudioElement | undefined>()
const winAudioRef = ref<HTMLAudioElement | undefined>()
const loseAudioRef = ref<HTMLAudioElement | undefined>()
const welAudioRef = ref<HTMLAudioElement | undefined>()
//const curLevel = ref(1)

const showTip = ref(false)
//const LevelConfig = [
//  { cardNum: 4, layerNum: 2, trap: false },
//  { cardNum: 9, layerNum: 3, trap: false },
//  { cardNum: 15, layerNum: 6, trap: false },
//]
const LevelConfig = [
  { cardNum: 2, layerNum: 2, trap: false }, 
  { cardNum: 4, layerNum: 2, trap: false }, 
  { cardNum: 6, layerNum: 2, trap: false },
  { cardNum: 6, layerNum: 3, trap: false },
  { cardNum: 9, layerNum: 3, trap: false },
  { cardNum: 9, layerNum: 4, trap: false },
  { cardNum: 12, layerNum: 4, trap: false },
  { cardNum: 12, layerNum: 5, trap: false },
  { cardNum: 15, layerNum: 5, trap: false },
  { cardNum: 15, layerNum: 6, trap: false },
]

const isWin = ref(false)

var imagesLoaded = false;
var theme: string | null | undefined = undefined;

var xDown: number | undefined = undefined;
var yDown: number | undefined = undefined;
var menuActive = ref(false);  
var elm = undefined

//var settingsImageSource:URL = new URL("./assets/images/settings.svg", import.meta.url);
var menuImageSource:URL = new URL("./assets/images/arrow_up.svg", import.meta.url);
var welcomeAudioSource:URL = new URL("./assets/audio/welcome.mp3", import.meta.url);
var winAudioSource:URL = new URL("./assets/audio/win.mp3", import.meta.url);
var loseAudioSource:URL = new URL("./assets/audio/lose.mp3", import.meta.url);
var clickAudioSource:URL = new URL("./assets/audio/click.mp3", import.meta.url);
var dropAudioSource:URL = new URL("./assets/audio/drop.mp3", import.meta.url);

const shouldShowMenu = ref(false);
const shouldShowSettings = ref(false);
const shouldShowCredits = ref(true);
const allowPlaySounds = ref(true);

const highscore = ref(0);

var cacheKey = +new Date;
var zoomElement: HTMLElement | null = null;
let zoomVal: number | null = null;
//const gameScore = ref(0)

const {
  nodes,
  selectedNodes,
  handleSelect,
  handleBack,
  backFlag,
  handleRemove,
  handleHint,
  removeFlag,
  handleReset,
  handleUndo,
  removeList,
  undoHistoryList,
  score,
  curLevel,
  handleSelectRemove,
  handleSeed,
  initData,
} = useGame({
  container: containerRef,
  cardNum: 4,
  layerNum: 2,
  trap: false,
  events: {
    clickCallback: handleClickCard,
    dropCallback: handleDropCard,
    winCallback: handleWin,
    loseCallback: handleLose,
    resetCallback: handleAppReset
  },
})

//function getRandomHue() {
//    return Math.floor(Math.random() * 360);
//}
//
// Function to update the gradient background
//function updateGradient() {
//    const rainbowBackground: HTMLElement | null = document.getElementsByTagName('body')[0];
//    const hue = getRandomHue();
//    const gradient = `linear-gradient(45deg, hsl(${hue}, 100%, 50%), hsl(${hue + 60}, 100%, 50%), hsl(${hue + 120}, 100%, 50%), hsl(${hue + 180}, 100%, 50%), hsl(${hue + 240}, 100%, 50%), hsl(${hue + 300}, 100%, 50%), hsl(${hue + 360}, 100%, 50%), hsl(${hue + 420}, 100%, 50%), hsl(${hue + 480}, 100%, 50%))`;
//
//    if (rainbowBackground) rainbowBackground.style.background = gradient;
//}

function handlePokedex() {
  console.log("TODO SHOW POKEDEX"); //TODO
}

function handleAppReset() {
  curLevel.value = 0
  score.value = 0
  initData(LevelConfig[curLevel.value])
  curLevel.value++;
}

function handleImageLoaded() {
  imagesLoaded = !imagesLoaded;
}

function handleClickCard() {
  if (!allowPlaySounds.value) return

  if (clickAudioRef.value?.paused) {
    clickAudioRef.value.play()
  }
  else if (clickAudioRef.value) {
    clickAudioRef.value.load()
    clickAudioRef.value.play()
  }
}

function handleDropCard() {
  if (allowPlaySounds.value) dropAudioRef.value?.play()
  //score.value += curLevel.value * curLevel.value;
  score.value += 1;
  if (score.value >= highscore.value) {
    highscore.value = score.value;
    localStorage.setItem("PMT_highscore", highscore.value + '');
  }
}

function handleWin() {
  if (allowPlaySounds.value) winAudioRef.value?.play()
  // fireworks()
  if (curLevel.value < LevelConfig.length) {
    basicCannon()
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      addLevel();
    }, 2000)
  }
  else {
    isWin.value = true
    schoolPride()
  }
}

function handleLose() {
  if (allowPlaySounds.value) loseAudioRef.value?.play()
  setTimeout(() => {
    alert('You lost, but you can try again! Score: ' + score.value)
    // window.location.reload()
    nodes.value = []
    removeList.value = []
    selectedNodes.value = []
    //welAudioRef.value?.play()
    score.value = 0;
    curLevel.value = 0
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
      undoHistoryList.value = [];
    }, 2000)
  }, 500)
}

function getFilePath(path: string): string {
  //../public/./assets/audio/click.mp3
  return path;
}

function setTheme() {
  //theme = localStorage.getItem("selectedTheme");
  //if (!theme) {
  //  theme = "theme_blue";
  //  localStorage.setItem("selectedTheme", theme);
  //}

  theme = "theme_blue";
}

function getTouches(evt: TouchEvent) {
  return evt.touches;
  //return evt.touches || evt.originalEvent.touches;
}

function handleTouchStart(evt: TouchEvent) {
  const firstTouch = getTouches(evt)[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
  elm = firstTouch.target;
};

function removeMenu() {
  document.querySelector('.phone-screen')?.classList.remove('active');
  //document.querySelector('.button-settings')?.classList.remove('button-settings-show');
}

function addMenu() {
  document.querySelector('.phone-screen')?.classList.add('active');
  //document.querySelector('.button-settings')?.classList.add('button-settings-show');
}

function toggleShowSettings() {
  shouldShowSettings.value = !shouldShowSettings.value;
}

function handleSettingsClicked() {
  removeMenu();
  toggleShowSettings();
}

function handleTouchMove(evt: TouchEvent) {
  if ( ! xDown || ! yDown ) {
    return;
  }

  var xUp = evt.touches[0].clientX;
  var yUp = evt.touches[0].clientY;
  var yDiff = yDown- yUp;
  //console.log("yDiff", yDiff);

  /*var xDiff = xDown - xUp;*/

  if ( yDiff > 0 ) {
    addMenu();
  } else {
    removeMenu();
  }

  xDown = undefined;
  yDown = undefined;
};

function handleMenu() {
  //console.log("menuActive", menuActive);
  menuActive.value = !menuActive.value;
  cacheKey = +new Date;
  cacheKey = +new Date;
  if (menuActive.value) {
  addMenu();
  } else {
    removeMenu();
  }
}

function handleSpecial() {
  handleWin();
}

function handleShowCredits() {
  shouldShowCredits.value = !shouldShowCredits.value;
}

function handleShowTutorial() {
  alert(`Match three Pokemon with the same type! \n
        Pokemon with two types only count as one of their types, you will have to figure it out~ \n
        Click the arrow to enable/disable menu.\n
        Move - Moves the first three tiles in the collection box back onto the field.\n
        Hint - Click on a tile to show info about the Pokemon\n
        Special - Advance to next stage (cheat)\n
        Sound - Turn sound on or off\n
        Seed - Give your seed to someone else and they will get the same puzzle\n
        Fullscreen - Turn fullscreen on or off`)
}

function handleFullscreen() {
  if (isInFullScreen()) {
    const cancellFullScreen = document.exitFullscreen;
    cancellFullScreen.call(document);
  } else {
  var el = document.documentElement,
    rfs = el.requestFullscreen;
  if(typeof rfs!="undefined" && rfs){
    rfs.call(el);
  } else {
    alert("Can't go fullscreen")
  }
  }
}

function isInFullScreen() {
  const document: any = window.document;
  return (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);
}

function handleToggleSound() {
  allowPlaySounds.value = !allowPlaySounds.value;
  localStorage.setItem("allowPlaySounds", allowPlaySounds.value ? 'true' : 'false');
}

function loadSettings() {
  var allowSoundsSetting = localStorage.getItem("PMT_allowPlaySounds");
  if (allowSoundsSetting != null) {
    allowPlaySounds.value = allowSoundsSetting === 'true';
  } else {
    allowPlaySounds.value = true;
  }

  var highscoreSetting = localStorage.getItem("PMT_highscore");
  if (highscoreSetting != null) {
    highscore.value = Number(highscoreSetting);
  }
}

function initMenu() {
  var menuSwipeArea = document.querySelector(".button-menu");
  menuSwipeArea?.addEventListener('touchstart', handleTouchStart as EventListener, {passive: true});
  menuSwipeArea?.addEventListener('touchmove', handleTouchMove as EventListener,  {passive: true});
}

//function zoom() {
//  if (zoomElement === null) return;
//  zoomElement.style['transform'] = `scale(${zoomVal})`
//}
//
//function initZoom() {
//  zoomElement = document.querySelector(".phone-screen");
//  if (zoomElement === null) return;
//  zoomVal = zoomElement.getBoundingClientRect().width / zoomElement.offsetWidth;
//}

function initZoom() {
  zoomElement = document.querySelector("#zoomArea");
  if (zoomElement === null) return;
  let pz = new PinchZoom(zoomElement, {
    tapZoomFactor: 1,
    verticalPadding: 50,
    maxZoom: 1,
    minZoom: 1,
  });
}

function initCursor() {

}

const hideStatusBar = async () => {
    //AndroidFullScreen.isImmersiveModeSupported()
    //  .then(() => AndroidFullScreen.immersiveMode())
    //  .catch(console.warn);
};

function addLevel() {

  //if (curLevel.value >= LevelConfig.length) {
  //  var lvlBefore = LevelConfig[curLevel.value - 1];
  //  var layerNum = lvlBefore.layerNum * 2;
  //  var cardNum = lvlBefore.cardNum * 3;
  //  LevelConfig.push({cardNum, layerNum, trap: false});
  //}
//
  //var level = LevelConfig[curLevel.value];
  //console.log("level val:" + curLevel.value);
  //console.log("level:" + level);

  initData(LevelConfig[curLevel.value])
  curLevel.value++
}

function closeMenus() {
  //shouldShowSettings.value = false;
  //shouldShowCredits.value = false;
  //shouldShowMenu.value = false;
}

onMounted(() => {
  hideStatusBar();

  setTheme();

  loadSettings();

  //setInterval(updateGradient, 20)

  //initMenu();

  //console.log(LevelConfig[curLevel.value])
  initData(LevelConfig[curLevel.value])
  curLevel.value++;

  initZoom();

  handleMenu();
})
</script>

<template>
  <div flex flex-col w-full h-full :class="theme">
    <div class="phone-screen">
    
      <div class="levelDiv">
        <div class="scoreDiv">Highscore {{ highscore }}</div>
        <div class="scoreDiv">Score {{ score }}</div>
        <div class="stageDiv">Stage {{ curLevel }}</div>
        </div>
    
    <div class="overlay"></div>

    <img @click="handleMenu" class="button-menu button-menu1" :src="menuImageSource.toString()" :key="`${cacheKey}`"/>
    <!--tton-m
    <img @click="handleSettingsClicked" class="button-settings button-settings1" :src="settingsImageSource.toString()" :key="`${cacheKey}`"/>
    -->

    <!--
    <svg class="button-menu button-menu1" onclick="document.querySelector('.phone-screen').classList.toggle('active')">
      <circle class="bg" r="12" cx="12" cy="12" />
      <path class="line line1" d="M 6,8 H 18" />
      <path class="line line2" d="M 6,12 H 18" />
      <path class="line line3" d="M 6,16 H 18" />
    </svg>
    -->
    <div class="menu" @click="handleMenu">
      <div class="option" @click="handleRemove">
        <!--
        <svg class="food" xmlns="http://www.w3.org/2000/svg" height="100" width="100" viewBox="0 0 100 100" data-name="Camada 1">
          <title>Sushi</title>
          <path d="M96.697 25.12a21.525 20.56 0 0 0 .774-3.23C99.147 10.54 88.228 2.11 76.69.53 59.07-1.9 40.142 4.1 24.773 17 9.07 30.1-.197 48.36.003 65.81.108 75.25 6.965 95.1 17.8 99.19a11.715 11.19 0 0 0 4.345.81 12.69 12.12 0 0 0 6.523-1.81l46.064-19.85a43.018 41.09 0 0 0 21.965-53.22zm-76.55 68.49c-7.832-2.95-13.78-20.08-13.873-27.87a53.393 51 0 0 1 3.643-18.57L31.61 55l2.22-5.61-21.39-7.72a69.997 66.86 0 0 1 16.47-20.2c.344-.29.7-.56 1.045-.84l26.864 9.7 2.22-5.61-23.21-8.38C46.182 9.6 57.7 6 68.9 6a48.975 46.78 0 0 1 6.9.46c7.16 1 16.75 6.17 15.453 14.59-1.047 7.33-8.02 12.15-14.73 16.81-1.3.9-2.576 1.79-3.78 2.67A152.85 146 0 0 0 48.1 63.11a106.786 102 0 0 0-9.005 13c-3.235 5.27-6.28 10.25-10.343 14.33a15.16 14.48 0 0 1-3.005 2.4l-2.094.92a5.12 4.89 0 0 1-3.507-.15zm52-20.73L39.534 86.93c1.748-2.54 3.36-5.16 4.952-7.73a98.944 94.51 0 0 1 8.438-12.29 145.825 139.29 0 0 1 23.65-21.62c1.162-.86 2.387-1.71 3.643-2.58 4.324-3 8.972-6.25 12.396-10.39a36.768 35.12 0 0 1-20.468 40.56z" />
        </svg>
        -->
        <div class="japanese">移動</div>
        <div class="roman">Move</div>
      </div>
      <div class="option" @click="handleReset">
        <!--
        <svg class="food" xmlns="http://www.w3.org/2000/svg" height="100" width="100" viewBox="0 0 100 100" data-name="Camada 1">
          <title>Sushi_2</title>
          <path d="M71.945 28.205L50 16.26 28.05 28.204a10.902 11.493 0 0 0-1 3.533 10.522 11.092 0 0 0 1 3.606L50 47.3l22.005-11.946a10.902 11.493 0 0 0 1-3.532 10.522 11.092 0 0 0-1.06-3.617zM34.59 31.79L50 23.355l15.424 8.435L50 40.183z" />
          <path d="M98.77 37.62a28.755 30.314 0 0 0-2.76-8.824c-2.76-5.778-7.352-10.882-13.893-15.426C72.735 6.77 61.563.095 50.06 0h-.12c-11.5.095-22.673 6.77-32.094 13.37-6.55 4.555-11.162 9.67-13.912 15.468a28.865 30.43 0 0 0-1.18 2.815 29.165 30.747 0 0 0-1.52 5.968c-2.24 14.404-1.43 26.288 2.45 35.334 4 9.385 11.87 14.636 19.743 18.906 10 5.4 18.623 8.056 26.514 8.14h.12c7.893-.084 16.564-2.74 26.516-8.14 7.87-4.218 15.712-9.49 19.743-18.906 3.87-9.046 4.69-20.93 2.45-35.333zM21.155 18.643C29.818 12.612 40 6.442 49.91 6.326h.18c9.913.116 20.095 6.327 28.756 12.326 5.69 3.965 9.642 8.32 11.922 13.202-2.28 4.83-6.2 9.13-11.852 13.074-8.66 6.032-18.853 12.21-28.765 12.316H50c-9.94-.106-20.132-6.327-28.794-12.326-5.72-3.975-9.65-8.33-11.922-13.223 2.32-4.818 6.24-9.11 11.872-13.043zm69.692 51.666c-3.27 7.613-10.112 12.136-17.003 15.89-9.06 4.913-16.833 7.38-23.734 7.38h-.18c-6.9-.084-14.67-2.52-23.733-7.38-6.91-3.754-13.752-8.277-17.003-15.89-3.25-7.613-4-17.925-2.16-30.578a43.207 45.55 0 0 0 10.922 10.44C27.306 56.737 38.46 63.443 50 63.57h.19c11.503-.126 22.655-6.832 32.007-13.37A43.447 45.803 0 0 0 93.01 39.92c1.84 12.568 1.11 22.796-2.162 30.43z" />
        </svg>
        -->
        <div class="japanese">リセット</div>
        <div class="roman">Reset</div>
      </div>
      <div class="option" @click="handleHint">
        <!--
        <svg class="food" xmlns="http://www.w3.org/2000/svg" height="100" width="100" viewBox="0 0 100 100" data-name="Camada 1">
          <title>Tempura_1</title>
          <path d="M99.877 77.004a11.048 11.047 0 0 0-5.64-7.848l-13.566-7.588-.55-.56c-1.3-1.71-2.34-2.95-3.228-3.998-.89-1.05-1.65-1.78-2.39-2.54l-1.36-1.42a57.317 57.312 0 0 1-3.79-4.528l-.06-.08a57.217 57.213 0 0 1-4.288-6.428 59.667 59.662 0 0 0-4.79-7.138 61.986 61.98 0 0 0-5.607-6.488l-.6-.56a50.92 50.914 0 0 1-4-4.608l-.58-.75a54.048 54.043 0 0 1-4.418-6.528 61.037 61.03 0 0 0-4.79-7.128 16.656 16.655 0 0 0-6.32-4.578c-.47-.23-.93-.46-1.37-.7l-1.318-.75c-2.1-1.2-4.47-2.55-7.3-2.76-2.828-.21-5.358.84-7.587 1.74q-.72.3-1.44.57c-.47.18-1 .34-1.45.51l-.42.18a16.086 16.085 0 0 0-9.997 9.997l-.14.41c-.17.49-.33 1-.51 1.45-.18.45-.37 1-.57 1.44-.92 2.238-1.95 4.768-1.78 7.597.17 2.83 1.54 5.208 2.74 7.298.25.45.51.9.75 1.35.24.45.47.9.7 1.37a16.656 16.655 0 0 0 4.58 6.317 61.037 61.03 0 0 0 7.147 4.758 55.218 55.213 0 0 1 6.54 4.39 54.538 54.533 0 0 1 4.398 3.668l-1.36 1.45c-.74.76-1.49 1.53-2.39 2.54-.9 1.01-1.93 2.25-3.23 3.998l-.54.55-13.576 7.548A10.998 10.997 0 0 0 .15 77.004 10.578 10.577 0 0 0 10.815 89.2a10.588 10.587 0 0 0 12.197 10.677 10.998 10.997 0 0 0 7.84-5.64l7.597-13.565.55-.55a61.097 61.09 0 0 0 6.5-5.618 52.25 52.244 0 0 1 4.508-3.998 52.25 52.244 0 0 1 4.51 3.998 61.097 61.09 0 0 0 6.487 5.62l.55.548 7.598 13.566a10.998 10.997 0 0 0 7.85 5.64A10.588 10.587 0 0 0 89.198 89.2a10.588 10.587 0 0 0 10.677-12.196zm-92.51 4.868a4.56 4.56 0 0 1-1.35-3.87 4.63 4.63 0 0 1 2.33-3.408l13.357-7.477 3.48 3.48-11.28 11.275a4.62 4.62 0 0 1-6.537 0zm18.086 9.767a4.59 4.59 0 0 1-3.44 2.358 4.54 4.54 0 0 1-3.898-1.31 4.62 4.62 0 0 1 0-6.537l11.337-11.346 3.48 3.48zM41.31 70.215a50.46 50.455 0 0 1-4.2 3.79L26.013 62.907c1.58-1.94 2.66-3.06 3.78-4.21.46-.47.93-.95 1.43-1.488.998.83 2.128 1.79 3.688 3a58.987 58.982 0 0 0 7.1 4.797c.94.55 1.85 1.09 3 1.84-1.61 1.34-2.67 2.37-3.7 3.37zm17.396 0c-1-1-2.08-2-3.72-3.4-.77-.65-1.68-1.37-2.78-2.21-.81-.598-1.54-1.158-2.198-1.598a58.507 58.502 0 0 0-4.93-3.16 55.758 55.753 0 0 1-6.528-4.378c-1.48-1.13-2.57-2-3.46-2.82-.89-.82-1.72-1.638-2.49-2.358-.588-.57-1.178-1.15-1.878-1.8-1.12-1-2.53-2.22-4.62-3.82a62.376 62.37 0 0 0-7.088-4.787 54.048 54.043 0 0 1-6.528-4.39 11.787 11.786 0 0 1-2.86-4.217c-.26-.52-.51-1-.78-1.54l-.83-1.48c-1-1.69-1.91-3.24-2-4.738-.09-1.5.59-3.15 1.31-4.95.22-.518.43-1.048.63-1.578s.38-1.07.57-1.62a11.727 11.726 0 0 1 2.27-4.568 11.727 11.726 0 0 1 4.57-2.27c.55-.19 1.09-.37 1.62-.57.53-.2 1.06-.41 1.578-.63a12.607 12.606 0 0 1 5-1.31c1.45.09 3 1 4.728 2l1.48.83c.5.27 1 .52 1.54.78a11.787 11.786 0 0 1 4.22 2.86 55.298 55.293 0 0 1 4.348 6.527 59.757 59.752 0 0 0 4.79 7.13c.48.63.93 1.2 1.348 1.72a55.608 55.603 0 0 0 4 4.487l.27.28a56.648 56.643 0 0 1 5.148 5.998 55.758 55.753 0 0 1 4.38 6.528 62.376 62.37 0 0 0 4.788 7.128l.33.42c1.62 2.1 2.82 3.47 3.86 4.59.5.54 1 1 1.43 1.49A54.558 54.553 0 0 1 74 62.907L62.905 74.005a50.46 50.455 0 0 1-4.2-3.79zM81.87 92.65A4.54 4.54 0 0 1 78 93.997a4.59 4.59 0 0 1-3.408-2.32l-7.498-13.395 3.47-3.48L81.87 86.112a4.62 4.62 0 0 1 0 6.54zM92.65 81.87a4.62 4.62 0 0 1-6.538 0L74.802 70.566l3.48-3.48 13.356 7.478a4.62 4.62 0 0 1 1 7.308zM54.717 19.49a42.8 42.797 0 0 0 2.93 3.47c1.1-1.61 1.798-2.81 2.488-4a55.298 55.293 0 0 1 4.39-6.527 11.787 11.786 0 0 1 4.218-2.86c.52-.26 1-.51 1.54-.78l1.49-.768c1.68-1 3.23-1.91 4.73-2a12.607 12.606 0 0 1 4.998 1.31c.52.22 1 .43 1.58.63.58.2 1.07.38 1.62.57a11.727 11.726 0 0 1 4.57 2.27 11.727 11.726 0 0 1 2.268 4.567c.19.55.37 1.09.57 1.62.2.53.41 1.06.63 1.58.72 1.8 1.41 3.498 1.31 4.948-.1 1.45-1 3.05-2 4.738l-.83 1.48c-.27.5-.52 1-.78 1.54a11.787 11.786 0 0 1-2.86 4.218 54.048 54.043 0 0 1-6.577 4.39 62.536 62.53 0 0 0-7.118 4.777l.14.18.16.21a49.04 49.035 0 0 0 3.31 4l.24.26a52.988 52.984 0 0 1 6.348-4.3 61.037 61.03 0 0 0 7.13-4.788 16.656 16.655 0 0 0 4.577-6.318c.23-.47.46-.93.7-1.37.24-.44.5-.9.75-1.35 1.2-2.09 2.55-4.468 2.74-7.297.19-2.83-.84-5.36-1.74-7.588q-.3-.72-.57-1.44c-.18-.47-.34-1-.51-1.45l-.16-.39A16.086 16.085 0 0 0 87 3.027l-.41-.14c-.49-.17-1-.33-1.45-.51l-1.44-.57c-2.24-.92-4.77-1.95-7.598-1.78-2.83.17-5.2 1.54-7.3 2.74-.448.25-.898.51-1.348.75-.45.24-.9.47-1.37.7a16.656 16.655 0 0 0-6.32 4.578 61.037 61.03 0 0 0-4.758 7.148c-.42.71-.83 1.4-1.31 2.18.17.22.34.46.53.7z" />
        </svg>
        -->
        <div class="japanese">ヒント</div>
        <div class="roman">Hint</div>
      </div>
        <!--
      <div class="option" @click="handleUndo">
        <div class="japanese">元に戻す</div>
        <div class="roman">Undo</div>
      </div>
        -->

      <div class="option" @click="handleSpecial">
        <div class="japanese">特別</div>
        <div class="roman">Special</div>
      </div>

      <div class="option" @click="handleSeed">
        <div class="japanese">シード</div>
        <div class="roman">Seed</div>
      </div>

      <div class="option" @click="handleToggleSound">
        <div class="japanese">サウンド</div>
        <div class="roman">Sound</div>
      </div>

      <div class="option" @click="handleShowTutorial">
        <div class="japanese">チュートリアル</div>
        <div class="roman">Tutorial</div>
      </div>
      
      <div class="option" @click="handleFullscreen">
        <div class="japanese">全画面表示</div>
        <div class="roman">Fullscreen</div>
      </div>
      <!--
      <div class="option" @click="handleShowCredits">
        <div class="japanese">帰属</div>
        <div class="roman">Credits</div>
      </div>
      -->

    </div>


    <!--<div text-44px text-center w-full fw-600 h-60px flex items-center justify-center mt-10px>
      You're a pokemon.
    </div>-->
    <div id="zoomArea" ref="containerRef" flex-1 flex>
      <div w-full relative flex-1>
        <template v-for="item in nodes" :key="item.id">
          <transition name="slide-fade">
            <Card
              v-if="[0, 1].includes(item.state)"
              :node="item"
              @click-card="handleSelect"
            />
          </transition>
        </template>
      </div>
      <transition name="bounce">
        <div v-if="isWin" flex items-center justify-center w-full text-28px fw-bold>
          YOU WON!
        </div>
      </transition>
      <transition name="bounce">
        <div class="showTip" v-if="showTip" flex items-center justify-center w-full text-28px fw-bold z-index>
          STAGE {{ curLevel + 1 }}
        </div>
      </transition>
    </div>

    <div text-center h-50px flex justify-center>
      <Card
        v-for="item in removeList" :key="item.id" :node="item" class="removedTile"
        is-dock
        @click-card="handleSelectRemove"
        @image-loaded="handleImageLoaded"
      />
    </div>
    <div w-full flex items-center justify-center>
      <div border="~ 4px dashed" w-295px h-54px flex class="collectionBox">
        <template v-for="item in selectedNodes" :key="item.id">
          <transition name="bounce">
            <Card
              v-if="[2, 3].includes(item.state)"
              :node="item"
              is-dock
              @click-card="handleSelect"
              :class="{aboutToBeDroppedTile: item.state === 3}"
              class="collectedTile"
            />
          </transition>
        </template>
      </div>
    </div>
    <!--
    <div h-50px flex items-center w-full justify-center>
      <button :disabled="removeFlag" mr-10px @click="handleRemove">
        Move out the first three
      </button>
      <button :disabled="backFlag" @click="handleBack">
        regression
      </button>
    </div>
    -->
    <div class="spacer"></div>
    
    <div class="credits" v-if="!menuActive">
      <a href="https://github.com/Lykae/pokematchtrio" target="_blank" class="dev">@Lykae</a>
      <a href="https://sprites.pmdcollab.org" target="_blank" class="sprites">@Sprites</a>
    </div>
    <audio
      ref="clickAudioRef"
      style="display: none;"
      controls
      :src="clickAudioSource.toString()"
    />
    <audio
      ref="dropAudioRef"
      style="display: none;"
      controls
      :src="dropAudioSource.toString()"
    />
    <audio
      ref="winAudioRef"
      style="display: none;"
      controls
      :src="winAudioSource.toString()"
    />
    <audio
      ref="loseAudioRef"
      style="display: none;"
      controls
      :src="loseAudioSource.toString()"
    />
    <audio
      ref="welAudioRef"
      style="display: none;"
      controls
      :src="welcomeAudioSource.toString()"
    />
  </div>

  <!--
<div v-if="shouldShowSettings" class="settingsMenu">
    <SettingsMenu></SettingsMenu>
</div>
-->
  
</div>
</template>

<style src="./assets/styles/main.css"></style>
<style src="./assets/styles/themes.css"></style>
<style src="./assets/styles/menu.css"></style>