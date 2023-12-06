import { AtmosphericComponent, BoxGeometry, Camera3D, ComponentBase, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, KelvinUtil, Object3DUtil } from "@orillusion/core";
import { Stats } from '@orillusion/stats';
import dat from "dat.gui";

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
        controller.setCamera(45, -20, 60);
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

        //添加dat.gui
        await this.initscene();
    }
    async initscene() {
        //新建一个Box并添加网格渲染组件
        let boxObj = new Object3D();
        let mr = boxObj.addComponent(MeshRenderer);
        //设置网格渲染组件的几何形状和材质
        let mat = new LitMaterial();
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = mat;


        let list: Object3D[] = [];
        let buttons = {
            add: async () => {
                let box = boxObj.clone();
                box.addComponent(RotateScript)
                box.x = Math.random() * 20 - 10;
                box.y = Math.random() * 20 - 10;
                box.z = Math.random() * 20 - 10;
                this.view.scene.addChild(box);
                list.push(box);
            },
            remove: async () => {
                let index = Math.floor(list.length * Math.random());
                let box = list[index]
                if (box) {
                    this.view.scene.removeChild(box);
                    box.destroy(true);
                    list.splice(index, 1);
                }
            }
        }
        await buttons.add();
        let properties = {
            Scale: 1,
            color: new Color(0.6, 0.4, 0.2)
        }
        let lightTrans = this.light.transform;
        console.log(lightTrans);

        const gui = new dat.GUI();
        let button = gui.addFolder("Add Remove");
        button.add(buttons, "add")
        button.add(buttons, "remove")
        let property = gui.addFolder("property");
        property.add(properties, "Scale", 0.5, 5).onChange((value) => {
            for (let index = 0; index < list.length; index++) {
                let box = list[index];
                box.scaleX = box.scaleY = box.scaleZ = value;
            }
        })
        property.addColor(properties, "color").onChange((value) => {
            mat.baseColor = new Color(value.r / 255, value.g / 255, value.b / 255)
        })
        let light = gui.addFolder("Light");
        light.add(lightTrans, "rotationX", -180, 180, 1)
        light.add(lightTrans, "rotationY", -180, 180, 1)
        light.add(lightTrans, "rotationZ", -180, 180, 1)
        light.add(this.light, "castShadow")
    }
}
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 1;
    }
}