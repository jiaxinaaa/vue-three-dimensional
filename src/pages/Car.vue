<template>
  <div ref="viewerRef" id="container" @click="move"></div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import * as Cesium from "cesium";

const viewerRef = ref(null);

const position = [
  new Cesium.Cartesian3(
    -1252492.374857966,
    5282251.464885515,
    3336845.5068931477
  ),
  new Cesium.Cartesian3(
    -1176185.330737473,
    5043445.985198041,
    3710548.117493697
  ),
  new Cesium.Cartesian3(
    -1887710.6597177486,
    4819612.395722013,
    3714186.8163375147
  ),
  new Cesium.Cartesian3(
    -1920313.6557340797,
    5081226.940468545,
    3331720.015745332
  ),
  new Cesium.Cartesian3(
    -1253546.3783522293,
    5283607.259303481,
    3334439.1692195353
  ),
];

const start = Cesium.JulianDate.fromDate(new Date());
const stop = Cesium.JulianDate.addSeconds(start, 40, new Cesium.JulianDate());

let handler;
onMounted(() => {
  create();
  createOutLine();
  createCar();
});

const create = () => {
  Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYzk5YmU0NS0xZmU3LTQ5NGItYTA0Zi03ODI5ZjY4MjdkYmEiLCJpZCI6Mjc4NDUsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyIsInByIl0sImlhdCI6MTU5Nzk5OTI0OH0.Bpi8AHBuQ1XKAc9fRWgrv6m72Lc6WoZwabzMhj1qWww";
  let viewerDefaultProperty = {
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: true,
    navigationHelpButton: true,
    baseLayerPicker: false,
    fullscreenElement: "container",
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    sceneModePicker: true,
    shouldAnimate: true,
    projectionPicker: true,
  };
  viewerRef.value = new Cesium.Viewer("container", viewerDefaultProperty);
  handler = new Cesium.ScreenSpaceEventHandler(viewerRef.value.canvas);

  //默认显示车
  viewerRef.value.camera.setView({
    // fromDegrees()方法，将经纬度和高程转换为世界坐标
    destination: new Cesium.Cartesian3(
      -1939286.0643429346,
      6101641.412838072,
      4274813.58790891
    ),
    orientation: {
      heading: 6.283185307179586,
      // 视角
      pitch: -1.5699800095154952,
      roll: 0,
    },
  });

  handler.setInputAction(function (click) {
    console.log(
      viewerRef.value.camera.position,
      viewerRef.value.camera.heading,
      viewerRef.value.camera.pitch,
      viewerRef.value.camera.roll
    );
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

//绘制轨迹线
const createOutLine = () => {
  viewerRef.value.entities.add({
    polyline: {
      positions: position,
      // 宽度
      width: 2,
      // 线的颜色
      material: Cesium.Color.WHITE,
      // 线的顺序,仅当`clampToGround`为true并且支持地形上的折线时才有效。
      zIndex: 10,
      show: true,
      clampToGround: true,
    },
  });
};

const createCar = () => {
  viewerRef.value.clock.startTime = start.clone();
  viewerRef.value.clock.stopTime = stop.clone();
  viewerRef.value.clock.currentTime = start.clone();
  viewerRef.value.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
  viewerRef.value.clock.multiplier = 10;
  viewerRef.value.zoomTo(
    viewerRef.value.entities,
    new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90))
  );
  viewerRef.value.projectionPicker.viewModel.switchToOrthographic();
  const positionCar = computeCirclularFlight();
  viewerRef.value.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: start,
        stop: stop,
      }),
    ]),
    orientation: new Cesium.VelocityOrientationProperty(positionCar), //转向的功能
    position: positionCar,
    model: {
      uri: "../../public/CesiumMilkTruck.glb",
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });
};

const computeCirclularFlight = () => {
  const property = new Cesium.SampledPositionProperty();
  position.forEach((item, key) => {
    const time = Cesium.JulianDate.addSeconds(
      start,
      10 * key,
      new Cesium.JulianDate()
    );
    property.addSample(time, item);
  });
  return property;
};
</script>

<style scoped></style>
