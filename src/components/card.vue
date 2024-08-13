<script setup lang="ts">
import { StyleValue, computed, ref, vModelCheckbox } from 'vue'
const props = defineProps<Props>()
const emit = defineEmits(['clickCard'])

// Load Image Resources
//const modules = import.meta.glob('../assets/tutu2/*.png', {as: 'url', import: 'default', eager: true})
//const IMG_MAP = Object.keys(modules).reduce((acc, cur) => {
//  const key = cur.replace('../assets/tutu2/', '').replace('.png', '')
//  acc[key] = modules[cur]
//  return acc
//}, {} as Record<string, string>)

var cacheKey = +new Date;
const imageLoaded = ref(false);

interface Props {
  node: CardNode
  isDock?: boolean
}
const isFreeze = computed(() => {
  return props.node.parents.length > 0 ? props.node.parents.some(o => o.state < 2) : false
},
)

function handleClick() {
  if (!isFreeze.value)
    emit('clickCard', props.node)
}

function getCardSpecificCss(node: CardNode, isDock?: boolean) {
  const specialStyle: StyleValue = getBoxShadow(node);
  const style: StyleValue = isDock ? {...specialStyle} : { ...specialStyle, position: 'absolute', zIndex: node.zIndex, top: `${node.top}px`, left: `${node.left}px` }
  return style;
}

function getBoxShadow(node: CardNode) {
    //console.log("imgnode", node);
  
  if (!node.pokemon) {
    return {};
  }

  if (!node.pokemon.imageSource) {
    return {};
  }

  var img: HTMLImageElement = new window.Image();
  img.src = node.pokemon.imageSource.toString();
  var canvas = document.createElement('canvas');
  //var image = new Image(node.pokemon.imageSource);
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")?.drawImage(img, 0, 0, img.width, img.height)

  var pixelData = canvas.getContext("2d")?.getImageData(0, 0, 1, 1);
  //console.log("pixelData", pixelData);

  var red = pixelData?.data[0];
  var green = pixelData?.data[1];
  var blue = pixelData?.data[2];
  var alpha = pixelData?.data[3];

  if (red == 0 && green == 0 && blue == 0) {
    return {};
  }

  if (red == undefined || green == undefined || blue == undefined || alpha == undefined) {
    return {};
  }

  var color = `rgb(${red}, ${green}, ${blue})`;
  var color2 = `rgb(${red*0.9}, ${green*0.9}, ${blue*0.9})`;
  var color3 = `rgb(${red*0.8}, ${green*0.8}, ${blue*0.8})`;
  var color4 = `rgb(${red*0.7}, ${green*0.7}, ${blue*0.7})`;
  var color5 = `rgb(${red*0.6}, ${green*0.6}, ${blue*0.6})`;
  var color6 = `rgb(${red*0.5}, ${green*0.5}, ${blue*0.5})`;
  var color7 = `rgb(${red*0.4}, ${green*0.4}, ${blue*0.4})`;
  var color8 = `rgb(${red*0.3}, ${green*0.3}, ${blue*0.3})`;
  var color9 = `rgb(${red*0.2}, ${green*0.2}, ${blue*0.2})`;

  const specialStyle: StyleValue = {boxShadow : `
    inset -3px -3px 6px 1px ${color},
    inset 3px 3px 3px 1px  ${color},
    1px 1px 0px 1px  ${color},
    2px 2px 0px 1px  ${color2},
    3px 3px 0px 1px  ${color3},
    4px 4px 0px 1px  ${color4},
    5px 5px 0px 1px  ${color5},
    6px 6px 0px 1px  ${color6},
    7px 7px 0px 1px  ${color7},
    8px 8px 0px 1px  ${color8},
    9px 9px 0px 1px  ${color9},
    10px 10px 10px 4px rgba(0,0,0,0.25)`};

    return specialStyle;
}

function onImageLoad() {
  props.node.imageLoaded = true;
  cacheKey = +new Date;
  imageLoaded.value = true;
}

</script>

<template>
  <div
    class="card"
    v-bind:class="{'hideCard': !imageLoaded, 'showCard': imageLoaded}"
    :style="getCardSpecificCss(node, isDock)"
    @click="handleClick"
  >
    <!-- {{ node.zIndex }}-{{ node.type }} -->
    <!-- {{ node.id }} -->
    <img v-bind:class="{'highlight': node.hintHighlight}" :key="`${cacheKey}-${imageLoaded}`" :src="node.pokemon.imageSource?.toString()" width="40" height="40" :alt="`${node.id}`" @load="onImageLoad">    <div v-if="isFreeze" class="mask" />
  </div>
</template>

<style scoped>

.hideCard {
  opacity: 0;
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.showCard {
  opacity: 1;
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.card{
  user-select: none;
  width: 40px;
  height: 40px;
  scale: 1.5;
  /* border: 1px solid red; */
  background: #f9f7e1;
  color:#000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 4px;
  /*border: 1px solid #000;
  /*box-shadow: 1px 5px 5px -1px #000;*/
  box-shadow:
    inset -3px -3px 6px 1px #b5b5aabb,
    inset 3px 3px 3px 1px #f9f4f0,
    1px 1px 0px 1px #bfbab4,
    2px 2px 0px 1px #bfbab4,
    3px 3px 0px 1px #bfbab4,
    4px 4px 0px 1px #bfbab4,
    5px 5px 0px 1px #bbb7b0,
    6px 6px 0px 1px #b5b5aa,
    7px 7px 0px 1px #b5b5aa,
    8px 8px 0px 1px #5f5f5f,
    9px 9px 0px 1px #303030,
    10px 10px 10px 4px rgba(0,0,0,0.25);
  /*transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0);
  transition: transform 0.3s ease-in-out; MAKES TRANSITION NOT WORK ANYMORE*/
  /*cursor: pointer;*/
}

.highlight {
  opacity: 0.5;
}

.card:hover {
  /*transform: perspective(800px) rotateX(15deg) rotateY(5deg) translateZ(5px);*/
}

img{
  border-radius: 4px;
}
.mask {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.55);
  width: 40px;
  height: 40px;
  pointer-events: none;
  border-radius: 4px;
  box-shadow:
    inset -3px -3px 6px 1px rgba(0,0,0,0.25),
    inset 3px 3px 3px 1px rgba(0,0,0,0.25),
    1px 1px 0px 1px rgba(0,0,0,0.05),
    2px 2px 0px 1px rgba(0,0,0,0.05),
    3px 3px 0px 1px rgba(0,0,0,0.05),
    4px 4px 0px 1px rgba(0,0,0,0.15),
    5px 5px 0px 1px rgba(0,0,0,0.15),
    6px 6px 0px 1px rgba(0,0,0,0.15),
    7px 7px 0px 1px rgba(0,0,0,0.25),
    8px 8px 0px 1px rgba(0,0,0,0.25),
    9px 9px 0px 1px rgba(0,0,0,0.25),
    10px 10px 10px 4px rgba(0,0,0,0.25);
}

</style>
