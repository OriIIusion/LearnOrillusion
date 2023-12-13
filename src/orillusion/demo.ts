import { AtmosphericComponent, BoxGeometry, Camera3D, ComponentBase, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, KelvinUtil, Object3DUtil } from "@orillusion/core";
import { Stats } from '@orillusion/stats';
import dat from "dat.gui";

export default class demo {
    //将可能在多个方法或者类的外部使用到的属性声明出来
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
        //新建一个Box并添加网格渲染组件
        let boxObj = new Object3D();
        let mr = boxObj.addComponent(MeshRenderer);
        //设置网格渲染组件的几何形状和材质
        let mat = new LitMaterial();
        mr.geometry = new BoxGeometry(1, 1, 1);
        mr.material = mat;

        //新建一个数组，来存储生成的Box
        let list: Object3D[] = [];

        //定义一个Object，属性是两个方法，add方法可创建一个Box，remove方法可从中随机删除一个Box
        let buttons = {
            add: async () => {
                let box = boxObj.clone();
                box.addComponent(RotateScript)
                //设置生成的box的xyz位置为-10到10之间的随机值
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
                    list.splice(index, 1);
                    this.view.scene.removeChild(box);
                    box.destroy(true);
                }
            }
        }
        //默认先添加一个Box
        await buttons.add();
        //创建一个dat.gui
        const gui = new dat.GUI();
        //添加一个列表，列表中包含了两个按钮，点击按钮可触发对应的方法
        let button = gui.addFolder("Add Remove");
        button.add(buttons, "add")
        button.add(buttons, "remove")
        //添加Light列表，可调整灯光三个轴旋转 光的强度 是否开启阴影
        let light = gui.addFolder("Light");
        light.add(this.light.transform, "rotationX", -180, 180, 1)
        light.add(this.light.transform, "rotationY", -180, 180, 1)
        light.add(this.light.transform, "rotationZ", -180, 180, 1)
        light.add(this.light, "intensity", 10, 60, 1)
        light.add(this.light, "castShadow")

        //定义一个Object，包含两个属性,scale是缩放，color是颜色
        let Boxs = {
            scale: 1,
            color: [255, 255, 255, 255]
        }
        //添加一个列表，当scale和color的值变化时，再onChange方法中，设置所有box的缩放和材质的颜色
        let boxs = gui.addFolder("box");
        boxs.add(Boxs, "scale", 0.5, 2).onChange((value) => {
            for (let index = 0; index < list.length; index++) {
                let box = list[index];
                box.scaleX = box.scaleY = box.scaleZ = value;
            }
        })
        boxs.addColor(Boxs, "color").onChange((value) => {
            mat.baseColor = new Color(value[0] / 255, value[1] / 255, value[2] / 255)
        })
        //展开所有列表
        button.open();
        light.open();
        boxs.open();
    }
}
//自旋转组件
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 1;
    }
}