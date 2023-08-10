<template>
  <div>
    <button type="primary" size="mini" @click="drawLineRoad">绘制路线</button>
    <button type="primary" size="mini" @click="startFly">开始飞行</button>
    <button type="primary" size="mini" @click="stopFly">暂停飞行</button>
    <button type="primary" size="mini" @click="continueFly">继续飞行</button>
    <button type="primary" size="mini" @click="exitFly">退出飞行</button>
  </div>
  <div id="map3d" ref="map3dRef" class="map"></div>
  <div id="hawkEyeMap" ref="hawkEyeMapRef" class="eye"></div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import * as Cesium from "cesium";

const map3dRef = ref(null);
const hawkEyeMapRef = ref(null);
let marks = [
  { lng: 108.9423344082, lat: 34.2609052589, height: 6000, flytime: 1 },
  { lng: 116.812948, lat: 36.560074, height: 10, flytime: 5 },
  // height:相机高度(单位米) flytime:相机两个标注点飞行时间(单位秒)
  { lng: 116.812948, lat: 36.560064, height: 10, flytime: 5 },
  { lng: 116.802948, lat: 36.560064, height: 10, flytime: 5 },
  { lng: 116.802948, lat: 36.550064, height: 10, flytime: 5 },
];
let handler;
let activeShapePoints = [];
let floatingPoint;
let drawingMode = "line";
let pitchValue = -15;
let marksIndex = 1;
let Exection = {};
let activeShape;
let flytime = 5;
let changeCameraTime = 5;
let point;

onMounted(() => {
  create();
  init();
  initFly();
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
    fullscreenElement: "map3d",
    fullscreenButton: false,
    shouldAnimate: false,
    infoBox: false,
    selectionIndicator: false,
    sceneModePicker: true,
    shouldAnimate: true,
    // terrainProvider: this.Cesium.createWorldTerrain({
    //   requestWaterMask: true,
    // }),
  };
  map3dRef.value = new Cesium.Viewer("map3d", viewerDefaultProperty);

  //默认显示中国
  map3dRef.value.camera.setView({
    // fromDegrees()方法，将经纬度和高程转换为世界坐标
    destination: Cesium.Cartesian3.fromDegrees(106.26667, 38.46667, 2000000.0),
    orientation: {
      heading: 6.283185307179586,
      // 视角
      pitch: -1.5686521559334161,
      roll: 0,
    },
  });

  map3dRef.value.imageryLayers.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
      name: "天地图影像标注",
      url: "http://t0.tianditu.gov.cn/cia_w/wmts?tk=2dc92d42654bd564ce1fc395f34d591c",
      layer: "cia",
      style: "default",
      tileMatrixSetID: "w",
      format: "tiles",
      maximumLevel: 18,
    })
  );
  map3dRef.value.scene.globe.depthTestAgainstTerrain = true;
};

const init = () => {
  hawkEyeMapRef.value = new Cesium.Viewer("hawkEyeMap", {
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    sceneMode: Cesium.SceneMode.SCENE2D,
  });
  hawkEyeMapRef.value.cesiumWidget.creditContainer.style.display = "none";
  hawkEyeMapRef.value.scene.backgroundColor = Cesium.Color.TRANSPARENT;
  hawkEyeMapRef.value.imageryLayers.removeAll();

  hawkEyeMapRef.value.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      minimumLevel: 3,
      maximumLevel: 18,
    })
  );

  // 引起事件监听的相机变化幅度
  map3dRef.value.camera.percentageChanged = 0.01;
  const point_options = {
    show: true, //是否展示
    pixelSize: 10, //点的大小
    color: Cesium.Color.RED, //颜色
    outlineColor: Cesium.Color.YELLOW, //边框颜色
    outlineWidth: 5, //边框宽度
  };
  point = hawkEyeMapRef.value.entities.add({
    position: Cesium.Cartesian3.fromDegrees(108.9423344082, 34.2609052589),
    point: point_options,
  });
  bindEvent();
};

// 绑定事件
const bindEvent = () => {
  // 监听主图相机变化
  map3dRef.value.camera.changed.addEventListener(syncMap);
};

// 同步主图与鹰眼地图
const syncMap = () => {
  // hawkEyeMapRef.value.camera.flyTo({
  //   destination: map3dRef.value.camera.position,
  //   orientation: {
  //     heading: map3dRef.value.camera.heading,
  //     pitch: map3dRef.value.camera.pitch,
  //     roll: map3dRef.value.camera.roll,
  //   },
  //   duration: 0.0,
  // });

  new Cesium.ScreenSpaceEventHandler(map3dRef.value.canvas).setInputAction(
    () => {
      isMainMapTrigger = true;
      isEyeMapTrigger = false;
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
  );
  // 但当鹰眼图为二维地图时，则不能直接设置
  let viewCenter = new Cesium.Cartesian2(
    // Math.floor取整函数
    Math.floor(map3dRef.value.canvas.clientWidth / 2),
    Math.floor(map3dRef.value.canvas.clientHeight / 2)
  );
  // pickEllipsoid用于将屏幕坐标转换为世界坐标
  let viewCenterPos = map3dRef.value.scene.camera.pickEllipsoid(viewCenter);

  if (!viewCenterPos) {
    return false;
  }

  // postionWC：标准世界坐标系坐标
  let distance = Cesium.Cartesian3.distance(
    viewCenterPos,
    map3dRef.value.scene.camera.positionWC
  );
  hawkEyeMapRef.value.scene.camera.lookAt(
    viewCenterPos,
    new Cesium.Cartesian3(0.0, 0.0, distance)
  );
};

const initFly = () => {
  map3dRef.value.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      marks[0].lng,
      marks[0].lat,
      marks[0].height
    ), //定位坐标点，建议使用谷歌地球坐标位置无偏差
    duration: 1, //定位的时间间隔
  });
  handler = new Cesium.ScreenSpaceEventHandler(map3dRef.value.canvas);
};
// 设置飞行的时间到viewer的时钟里
const setExtentTime = (time) => {
  const startTime = Cesium.JulianDate.fromDate(new Date());
  const stopTime = Cesium.JulianDate.addSeconds(
    startTime,
    time,
    new Cesium.JulianDate()
  );
  map3dRef.value.clock.startTime = startTime.clone(); // 开始时间
  map3dRef.value.clock.stopTime = stopTime.clone(); // 结速时间
  map3dRef.value.clock.currentTime = startTime.clone(); // 当前时间
  map3dRef.value.clock.clockRange = Cesium.ClockRange.CLAMPED; // 行为方式-达到终止时间后停止
  map3dRef.value.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; // 时钟设置为当前系统时间; 忽略所有其他设置。
};
/** 相机视角飞行 结束 **/
/** 飞行时 camera的方向调整(heading) 开始 **/

// 角度转弧度
const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

// 弧度转角度
const toDegrees = (radians) => {
  return (radians * 180) / Math.PI;
};

//计算俯仰角
const bearing = (startLat, startLng, destLat, destLng) => {
  startLat = toRadians(startLat);
  startLng = toRadians(startLng);
  destLat = toRadians(destLat);
  destLng = toRadians(destLng);

  let y = Math.sin(destLng - startLng) * Math.cos(destLat);
  let x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  let brngDgr = toDegrees(brng);

  return (brngDgr + 360) % 360;
};

const flyExtent = () => {
  // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
  const pitch = Cesium.Math.toRadians(pitchValue);
  // 时间间隔2秒钟
  setExtentTime(marks[marksIndex].flytime);
  Exection = function TimeExecution() {
    let preIndex = marksIndex - 1;
    if (marksIndex == 0) {
      preIndex = marks.length - 1;
    }
    //计算俯仰角
    let heading = bearing(
      marks[preIndex].lat,
      marks[preIndex].lng,
      marks[marksIndex].lat,
      marks[marksIndex].lng
    );

    heading = Cesium.Math.toRadians(heading);

    // 当前已经过去的时间，单位s
    const delTime = Cesium.JulianDate.secondsDifference(
      map3dRef.value.clock.currentTime,
      map3dRef.value.clock.startTime
    );
    const originLat =
      marksIndex == 0 ? marks[marks.length - 1].lat : marks[marksIndex - 1].lat;
    const originLng =
      marksIndex == 0 ? marks[marks.length - 1].lng : marks[marksIndex - 1].lng;
    const endPosition = Cesium.Cartesian3.fromDegrees(
      originLng +
        ((marks[marksIndex].lng - originLng) / marks[marksIndex].flytime) *
          delTime,
      originLat +
        ((marks[marksIndex].lat - originLat) / marks[marksIndex].flytime) *
          delTime,
      marks[marksIndex].height
    );
    map3dRef.value.scene.camera.setView({
      destination: endPosition,
      orientation: {
        heading: heading,
        pitch: pitch,
      },
    });
    if (
      Cesium.JulianDate.compare(
        map3dRef.value.clock.currentTime,
        map3dRef.value.clock.stopTime
      ) >= 0
    ) {
      map3dRef.value.clock.onTick.removeEventListener(Exection);
      //有个转向的功能
      changeCameraHeading();
    }
  };

  map3dRef.value.clock.onTick.addEventListener(Exection);
};

// 相机原地定点转向
const changeCameraHeading = () => {
  let nextIndex = marksIndex + 1;
  if (marksIndex == marks.length - 1) {
    nextIndex = 0;
  }
  // 计算两点之间的方向
  const heading = bearing(
    marks[marksIndex].lat,
    marks[marksIndex].lng,
    marks[nextIndex].lat,
    marks[nextIndex].lng
  );
  // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
  const pitch = Cesium.Math.toRadians(pitchValue);
  // 给定飞行一周所需时间，比如10s, 那么每秒转动度数
  const angle =
    (heading - Cesium.Math.toDegrees(map3dRef.value.camera.heading)) /
    changeCameraTime;
  // 时间间隔2秒钟
  setExtentTime(changeCameraTime);
  // 相机的当前heading
  const initialHeading = map3dRef.value.camera.heading;
  Exection = function TimeExecution() {
    // 当前已经过去的时间，单位s
    const delTime = Cesium.JulianDate.secondsDifference(
      map3dRef.value.clock.currentTime,
      map3dRef.value.clock.startTime
    );
    const heading = Cesium.Math.toRadians(delTime * angle) + initialHeading;
    map3dRef.value.scene.camera.setView({
      orientation: {
        heading: heading,
        pitch: pitch,
      },
    });
    if (
      Cesium.JulianDate.compare(
        map3dRef.value.clock.currentTime,
        map3dRef.value.clock.stopTime
      ) >= 0
    ) {
      map3dRef.value.clock.onTick.removeEventListener(Exection);
      marksIndex = marksIndex >= marks.length ? 0 : marksIndex;
      if (marksIndex != 0) {
        flyExtent();
      }
    }
  };
  map3dRef.value.clock.onTick.addEventListener(Exection);
};

//绘制点
const createPoint = (worldPosition) => {
  let point = map3dRef.value.entities.add({
    position: worldPosition,
    point: {
      color: Cesium.Color.YELLOW,
      pixelSize: 7,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
  return point;
};

//初始化为线
const drawShape = (positionData) => {
  let shape;
  if (drawingMode === "line") {
    shape = map3dRef.value.entities.add({
      polyline: {
        positions: positionData,
        clampToGround: true,
      },
    });
  }
  return shape;
};

/** 飞行时 camera的方向调整(heading) 结束 **/
/**绘制路线 */
const drawLineRoad = () => {
  //鼠标左键
  handler.setInputAction(function (event) {
    let ray = map3dRef.value.camera.getPickRay(event.position);
    // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
    let earthPosition = map3dRef.value.scene.globe.pick(
      ray,
      map3dRef.value.scene
    );
    if (Cesium.defined(earthPosition)) {
      if (activeShapePoints.length === 0) {
        floatingPoint = createPoint(earthPosition);
        activeShapePoints.push(earthPosition);
        let dynamicPositions = new Cesium.CallbackProperty(function () {
          //记录点的集合
          return activeShapePoints;
        }, false);
        activeShape = drawShape(dynamicPositions); //绘制动态图
      }
      activeShapePoints.push(earthPosition);
      createPoint(earthPosition);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  //鼠标移动
  handler.setInputAction(function (event) {
    if (Cesium.defined(floatingPoint)) {
      let newPosition = map3dRef.value.scene.pickPosition(event.endPosition);
      if (Cesium.defined(newPosition)) {
        floatingPoint.position.setValue(newPosition);
        activeShapePoints.pop();
        activeShapePoints.push(newPosition);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  //鼠标右键
  handler.setInputAction(function () {
    terminateShape();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

const terminateShape = () => {
  activeShapePoints.pop(); //去除最后一个动态点
  if (activeShapePoints.length) {
    marks = [];
    for (const position of activeShapePoints) {
      const latitude = toDegrees(
        Cesium.Cartographic.fromCartesian(position).latitude
      );
      const longitude = toDegrees(
        Cesium.Cartographic.fromCartesian(position).longitude
      );
      marks.push({
        lat: latitude,
        lng: longitude,
        flytime,
        height: 1000,
      });
    }
    drawShape(activeShapePoints); //绘制最终图
  }
  map3dRef.value.entities.remove(floatingPoint); //去除动态点图形（当前鼠标点）
  map3dRef.value.entities.remove(activeShape); //去除动态图形
  floatingPoint = null;
  activeShape = null;
  activeShapePoints = [];
  handler = null;
};

//开始飞行
const startFly = () => {
  if (Object.keys(Exection).length > 0) {
    exitFly();
  }
  flyExtent();
};

//停止飞行
const stopFly = () => {
  map3dRef.value.clock.shouldAnimate = false;
};
//继续飞行
const continueFly = () => {
  map3dRef.value.clock.shouldAnimate = true;
};
//退出飞行
const exitFly = () => {
  map3dRef.value.clock.onTick.removeEventListener(Exection);
  // 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
  const pitch = Cesium.Math.toRadians(pitchValue);
  const marksIndex = 1;
  let preIndex = marksIndex - 1;
  //计算俯仰角
  let heading = bearing(
    marks[preIndex].lat,
    marks[preIndex].lng,
    marks[marksIndex].lat,
    marks[marksIndex].lng
  );
  heading = Cesium.Math.toRadians(heading);
  const endPosition = Cesium.Cartesian3.fromDegrees(
    marks[0].lng,
    marks[0].lat,
    marks[0].height
  );
  map3dRef.value.scene.camera.setView({
    destination: endPosition,
    orientation: {
      heading: heading,
      pitch: pitch,
    },
  });
};
</script>
<style scoped>
.map {
  width: 100%;
  height: 100vh;
  position: relative;
}
.eye {
  /* width: 300px; */
  /* height: 300px; */
  position: absolute;
  bottom: 1%;
  right: 1%;

  border: 2px solid #002fa7;
  overflow: hidden;
}
</style>
