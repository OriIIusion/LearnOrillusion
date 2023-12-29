import { BoxGeometry, Camera3D, ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, PointLight, Vector3} from "@orillusion/core";
import { Stats } from '@orillusion/stats';
import dat from "dat.gui";

export default class demo {
    light: PointLight;
    async run() {
        console.log("03.灯光跟随鼠标");
        //设置阴影 初始化引擎
        Engine3D.setting.shadow.pointShadowBias = 0.0001;
        Engine3D.setting.shadow.type = "HARD";
        await Engine3D.init();

        //新建一个场景 添加FPS显示
        let scene = new Scene3D();
        scene.addComponent(Stats);

        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        //设置相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.lookAt(new Vector3(0, 0, 30), new Vector3(0,0,0));
        scene.addChild(cameraObj);

        //添加点光源 
        let lightObj = new Object3D();
        this.light = lightObj.addComponent(PointLight);
        this.light.intensity = 10;
        this.light.range = 20;
        lightObj.z = 5;
        this.light.castShadow = true;
        scene.addChild(lightObj);

        //给点光源添加dat.gui方便调试灯光参数
        let lightColor = {
            color:[255,255,255,255]
        }
        const gui = new dat.GUI();
        let light = gui.addFolder("点光源");
        light.add(this.light,"intensity",5,30,1);
        light.add(this.light,"range",10,30,1);
        light.add(this.light,"radius",0.1,2,0.1);
        light.addColor(lightColor,"color").onChange((v)=>{
            this.light.lightColor = new Color(v[0]/255,v[1]/255,v[2]/255)
        })
        light.open();

        //添加一个地面
        let floor = Object3DUtil.GetSingleCube(100, 100, 1, 1, 1, 1);
        floor.z = -3;
        scene.addChild(floor);

        //创建一个Box样本
        let boxObj = new Object3D();
        let boxMr = boxObj.addComponent(MeshRenderer);
        let boxMat = new LitMaterial();
        boxMr.geometry = new BoxGeometry(2, 2, 2);
        boxMr.material = boxMat;
        //两层循环创建100个Box x和y范围在-18到18之间
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                let obj = boxObj.clone();
                obj.addComponent(RotateScript)
                obj.x = i * 4 - 18;
                obj.y = j * 4 - 18;
                scene.addChild(obj)
            }
        }

        //创建View3D对象 开始渲染
        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }
}
//自旋转组件
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 0.5;
        this.object3D.rotationX += 1;
        this.object3D.rotationZ += 1.5;
    }
}
