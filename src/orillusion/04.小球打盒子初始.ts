import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, AtmosphericComponent, HoverCameraController, DirectLight, SphereGeometry, KelvinUtil } from '@orillusion/core';
import { Stats } from '@orillusion/stats';

export default class demo {
    aim: Object3D;
    view: View3D;
    async run() {
        console.log("04.小球打盒子");
        await Engine3D.init();

        //新建场景 添加天空盒子和性能统计
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //新建相机
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        //开启联级阴影贴图 无需再设置阴影范围(shadowBound)
        camera.enableCSM = true;
        //设置相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let con = cameraObj.addComponent(HoverCameraController);
        con.setCamera(0, -30, 50);
        scene.addChild(cameraObj);

        //添加光源 
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 50;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 140;
        sky.relativeTransform = light.transform;
        scene.addChild(lightObj);

        //添加一个地面 
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.3);
            floor.y = -0.5;
            scene.addChild(floor);
        }
        //添加Box墙
        let mats = [
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial(),
            new LitMaterial()
        ]
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2, 2, 2);
            mats.forEach(element => {
                element.baseColor = Color.random();
            });
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    let b = box.clone();
                    b.x = 2 * i - 9;
                    b.y = 2 * j + 1;
                    b.z = -10;
                    b.getComponent(MeshRenderer).material = mats[Math.floor(Math.random() * 5)]
                    scene.addChild(b)
                }
            }
        }

        //添加瞄准点
        {
            this.aim = new Object3D();
            let aim1 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.6, 0.3, 0.1);
            this.aim.addChild(aim1)
            let aim2 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.6, 0.3, 0.1);
            aim2.rotationZ = 90
            this.aim.addChild(aim2)
            this.aim.z = 10;
            this.aim.y = 10;
            scene.addChild(this.aim)
        }

        //添加小球预制体
        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        Engine3D.res.addPrefab("ball", sphereObj);

        //创建View3D对象 开始渲染
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);
    }
}