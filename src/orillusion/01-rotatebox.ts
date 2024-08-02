import { AtmosphericComponent, BoxGeometry, Camera3D, ComponentBase, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D } from "@orillusion/core"
import { Stats } from '@orillusion/stats';

export default class demo {
    async run() {
        console.log("转动的Box")
        //初始化引擎
        await Engine3D.init();

        //新建一个场景 并且给场景添加一个天空盒 添加FPS显示
        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        //设置相机参数
        camera.perspective(60,window.innerWidth/window.innerHeight,1,5000);
        //设置相机控制器
        let controller = cameraObj.addComponent(HoverCameraController);
        controller.setCamera(45,-20,30);
        //相机添加到场景中
        scene.addChild(cameraObj);

        //添加平行光
        let lightObj = new Object3D();
        let dirLight = lightObj.addComponent(DirectLight);
        //调整灯光角度以及强度
        lightObj.rotationX = 135;
        lightObj.rotationY = 30;
        dirLight.intensity = 5;
        //灯光添加到场景中
        scene.addChild(lightObj);

        //新建一个Box并添加网格渲染组件
        let boxObj = new Object3D();
        let mr = boxObj.addComponent(MeshRenderer);
        //设置网格渲染组件的几何形状和材质
        mr.geometry = new BoxGeometry(5,5,5);
        mr.material = new LitMaterial();
        //添加自动旋转组件
        boxObj.addComponent(RotateScript);
        //将物体添加到场景中
        scene.addChild(boxObj);

        //创建View3D对象
        let view = new View3D();
        //指定渲染的场景和相机
        view.scene = scene;
        view.camera = camera;
        //开始渲染
        Engine3D.startRenderView(view);
    }
}
class RotateScript extends ComponentBase
{
    onUpdate() {
        this.object3D.rotationY += 1;
    }
}
new demo().run();