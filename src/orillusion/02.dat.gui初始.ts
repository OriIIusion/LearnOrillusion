import { AtmosphericComponent, Camera3D, ComponentBase, DirectLight, Engine3D, HoverCameraController, Object3D, Scene3D, View3D, KelvinUtil, Object3DUtil } from "@orillusion/core";
import { Stats } from '@orillusion/stats';

export default class demo {
    view: View3D;
    light: DirectLight;
    async run() {
        console.log("dat.gui")
        //设置阴影 初始化引擎 
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowSize = 2048;
        await Engine3D.init();

        //新建一个场景 添加天空盒 设置太阳高度 添加FPS显示
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.8
        scene.addComponent(Stats);

        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        //设置相机参数
        camera.perspective(60, window.innerWidth / window.innerHeight, 1, 5000);
        //设置相机控制器
        let controller = cameraObj.addComponent(HoverCameraController);
        controller.setCamera(45, -20, 30);
        //相机添加到场景中
        scene.addChild(cameraObj);

        //添加平行光
        let lightObj = new Object3D();
        this.light = lightObj.addComponent(DirectLight);
        //调整灯光角度以及强度
        lightObj.rotationX = 135;
        lightObj.rotationY = 30;
        this.light.intensity = 30;
        //灯光颜色 开启阴影
        this.light.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        this.light.castShadow = true
        //灯光添加到场景中
        scene.addChild(lightObj);

        //快速添加一个地面
        let floor = Object3DUtil.GetSingleCube(40, 1, 40, 0.6, 0.6, 0.6);
        floor.y = -11;
        scene.addChild(floor)

        //创建View3D对象
        this.view = new View3D();
        //指定渲染的场景和相机
        this.view.scene = scene;
        this.view.camera = camera;
        //开始渲染
        Engine3D.startRenderView(this.view);

        //初始化场景 添加dat.gui
        await this.initscene();
    }

    async initscene() {
        //to do
    }
}
//自旋转组件
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 1;
    }
}