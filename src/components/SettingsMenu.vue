<script setup lang="ts">
import { ref } from 'vue'

</script>

<template>
  <div class="parentDiv">
    <a class="link" style="margin-top: 15%;">
      <div class="cyber-cta">
        <div class="cyber-cta--background">
          <div></div>
        </div>
        <div class="cyber-cta--foreground"></div>
        <div class="cyber-cta--text">RESUME</div>
      </div>
    </a>
    <br>
    <a class="link" style="margin-top: 40%;">
      <div class="cyber-cta">
        <div class="cyber-cta--background">
          <div></div>
        </div>
        <div class="cyber-cta--foreground"></div>
        <div class="cyber-cta--text">SOUND</div>
      </div>
    </a>
    <br>
    <a class="link" style="margin-top: 65%;">
      <div class="cyber-cta">
        <div class="cyber-cta--background">
          <div></div>
        </div>
        <div class="cyber-cta--foreground"></div>
        <div class="cyber-cta--text">TUTORIAL</div>
      </div>
    </a>
    <br>
    <a class="link" style="margin-top: 90%;">
      <div class="cyber-cta">
        <div class="cyber-cta--background">
          <div></div>
        </div>
        <div class="cyber-cta--foreground"></div>
        <div class="cyber-cta--text">QUIT</div>
      </div>
    </a>
    <!-- partial -->
  </div>
</template>

<style scoped>
/* AUTHOR : ALIPASKAL */

.parentDiv {
  height: 50vh;
  display: flex;
  flex-direction: column;
  /*justify-content: center;*/
  align-items: center;
  background: linear-gradient(90deg, rgb(0, 41, 48), rgb(61, 49, 63), rgb(79, 75, 136), rgb(1, 15, 12));
  border-radius: 1em;
}

.link {
  position: absolute;
  /*margin-right: 66%;
  margin-bottom: 35%;*/
  width:  33vh;
  height: 8vh;
  background-color: #000;
  -webkit-clip-path: polygon(
    10% 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
  clip-path: polygon(
    10% 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
}

.cyber-cta,
.cyber-cta * {
  box-sizing: border-box;
}

.cyber-cta {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  cursor: none;
}
.cyber-cta--background,
.cyber-cta--background div,
.cyber-cta--foreground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.cyber-cta--background {
  z-index: -1;
  filter: drop-shadow(5px 8px 30px rgba(219, 43, 48, 0.15));
}
.cyber-cta--background > div {
  content: "";
  background: #02090d;
  border: 1px solid #8f2f82;
  -webkit-clip-path: polygon(
    10% 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
  clip-path: polygon(
    10% 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
}
.cyber-cta--foreground {
  -webkit-clip-path: polygon(
    20px 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
  clip-path: polygon(
    20px 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%,
    0 20px
  );
  transform: translateX(-5px) translateY(-5px);
  will-change: transform;
  transition: 0.2s transform;
}
.cyber-cta--background:after,
.cyber-cta--background:before,
.cyber-cta--foreground:after,
.cyber-cta--foreground:before {
  content: "";
  position: absolute;
  width: 1px;
  height: 28px;
  background: #faf600;
}
.cyber-cta--background:after,
.cyber-cta--foreground:after {
  top: calc(28.28px / -2);
  left: 0;
  transform: rotate(45deg) translateX(13.5px) translateY(1px);
}
.cyber-cta--background:before,
.cyber-cta--foreground:before {
  bottom: calc(28.28px / -2);
  right: 0;
  transform: rotate(45deg) translateX(-13.5px) translateY(-0.5px);
}
.cyber-cta--text {
  margin: auto;
  font-family: aileron, sans-serif;
  font-size: 32px;
  font-weight: 900;
  font-size: 32px;
  color: #fff;
  text-align: center;
  -webkit-animation: glow 1s ease-in-out infinite alternate;
  -moz-animation: glow 1s ease-in-out infinite alternate;
  animation: glow 1s ease-in-out infinite alternate;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #eef4f6;
  text-shadow: 4px 4px 30px rgba(238, 244, 246, 0.1);
  will-change: letter-spacing;
  transition: 0.2s letter-spacing;
}

@-webkit-keyframes glow {
  from {
    text-shadow: 0 0 10px #fff, 0 0 20px rgb(157, 255, 0), 0 0 30px #e60073,
      0 0 40px #ff0000, 0 0 50px #2f00ff, 0 0 60px #ffe600, 0 0 70px #00fff2;
  }
  to {
    text-shadow: 0 0 10px #00fff2, 0 0 20px #ffe600, 0 0 30px #2f00ff,
      0 0 40px #ff0000, 0 0 50px #e60073, 0 0 60px rgb(157, 255, 0),
      0 0 70px #fff;
  }
}
.cyber-cta--text::-moz-selection {
  background: none;
}
.cyber-cta--text::selection {
  background: none;
}
.cyber-cta:hover .cyber-cta--text {
  letter-spacing: 0.08em;
}
.cyber-cta:hover .cyber-cta--foreground {
  transform: translateX(-8px) translateY(-8px);
}
.cyber-cta:active .cyber-cta--foreground {
  transform: translateX(0px) translateY(0px);
}

</style>
