import { Camera3D, Engine3D, Object3D, Scene3D, View3D, Vector3, AtmosphericComponent, DirectLight, KelvinUtil, Object3DUtil, HoverCameraController, FlyCameraController, CameraUtil, MeshRenderer, BoxGeometry, LitMaterial, SphereGeometry, TorusGeometry, Color } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import dat from "dat.gui";

export default class demo {
    view: View3D;
    scene: Scene3D;
    transformCamera: Camera3D;
    lookatCamera: Camera3D;
    flyCamera: Camera3D;
    hoverCamera: Camera3D;
    flyController: FlyCameraController;
    hoverController: HoverCameraController;
    async run() {
        console.log("相机与控制器");
        await Engine3D.init();
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBias = 0.01;

        //新建场景 添加天空盒子和性能统计
        this.scene = new Scene3D();
        const sky = this.scene.addComponent(AtmosphericComponent);
        this.scene.addComponent(Stats);

        //新建transform相机 通过改变相机的位置和旋转来控制相机
        this.transformCamera = CameraUtil.createCamera3DObject(this.scene);
        this.transformCamera.perspective(60, Engine3D.aspect, 1, 5000);
        this.transformCamera.transform.localPosition = new Vector3(0, 10, 30);
        this.transformCamera.transform.rotationY = 180;
        this.transformCamera.transform.rotationX = 30;

        //新建lookat相机 通过改变相机的位置和目标点来控制相机
        this.lookatCamera = CameraUtil.createCamera3DObject(this.scene);
        this.lookatCamera.perspective(60, Engine3D.aspect, 1, 5000);
        this.lookatCamera.lookAt(new Vector3(0, 10, 30), new Vector3(0, 0, 0));

        //新建fly相机并添加fly控制器 通过wasdqe控制相机的位置 通过鼠标控制相机的旋转
        this.flyCamera = CameraUtil.createCamera3DObject(this.scene);
        this.flyCamera.perspective(60, Engine3D.aspect, 1, 5000);
        this.flyController = this.flyCamera.object3D.addComponent(FlyCameraController);
        this.flyController.setCamera(new Vector3(0, 10, 30), new Vector3(0, 0, 0));

        //新建hover相机并添加hover控制器 通过鼠标控制相机的位置和旋转
        this.hoverCamera = CameraUtil.createCamera3DObject(this.scene);
        this.hoverCamera.perspective(60, Engine3D.aspect, 1, 5000);
        this.hoverController = this.hoverCamera.object3D.addComponent(HoverCameraController);
        this.hoverController.setCamera(0, -30, 30, new Vector3(0, 0, 0));

        //禁用fly和hover控制器
        this.flyController.enable = false;
        this.hoverController.enable = false;

        //添加光源
        const lightObj = new Object3D();
        const light = lightObj.addComponent(DirectLight);
        light.intensity = 2;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 50;
        sky.relativeTransform = light.transform;
        light.lightColor = KelvinUtil.color_temperature_to_rgb(3434);
        this.scene.addChild(lightObj);

        //创建View3D
        this.view = new View3D();
        this.view.scene = this.scene;
        //可通过改变view的camera来改变生效的相机
        this.view.camera = this.transformCamera;
        Engine3D.startRenderView(this.view);

        await this.initScene();
        await this.initUI();
    }
    private async initScene() {
        //添加地面
        {
            const floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.6, 0.4, 0.1);
            floor.y = -0.5;
            this.scene.addChild(floor);
        }

        //创建共用材质
        const mat = new LitMaterial();
        mat.baseColor = new Color(0.4, 0.7, 0.2);
        mat.metallic = 0.2;
        mat.roughness = 0;

        //添加目标点1 box
        {
            const box = new Object3D();
            const mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(5, 5, 5);
            mr.material = mat;
            box.y = 2.5;
            box.x = box.z = -15;
            this.scene.addChild(box);
        }
        //添加目标点2 sphere
        {
            const sphere = new Object3D();
            const mr = sphere.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(2.5, 20, 20);
            mr.material = mat;
            sphere.y = 2.5;
            sphere.x = 15;
            sphere.z = -15;
            this.scene.addChild(sphere);
        }
        //添加目标点3 Torus
        {
            const torus = new Object3D();
            const mr = torus.addComponent(MeshRenderer);
            mr.geometry = new TorusGeometry(5, 0.5);
            mr.material = mat;
            torus.y = 2;
            torus.x = -15;
            torus.z = 15;
            this.scene.addChild(torus);
        }
        //添加目标点4 box
        {
            const box = new Object3D();
            const mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(5, 2, 3);
            mr.material = mat;
            box.y = 1;
            box.x = box.z = 15;
            this.scene.addChild(box);
        }
    }
    private async initUI() {
        const gui = new dat.GUI();
        //通过四个按钮改变生效的相机
        const changeCamera = {
            transformCamera: () => {
                this.view.camera = this.transformCamera;
                this.flyController.enable = false;
                this.hoverController.enable = false;
            },
            lookatCamera: () => {
                this.view.camera = this.lookatCamera;
                this.flyController.enable = false;
                this.hoverController.enable = false;
            },
            flyCamera: () => {
                this.view.camera = this.flyCamera;
                this.flyController.enable = true;
                this.hoverController.enable = false;
            },
            hoverCamera: () => {
                this.view.camera = this.hoverCamera;
                this.flyController.enable = false;
                this.hoverController.enable = true;
                this.hoverController.setCamera(0, -30, 30, new Vector3(0, 0, 0));
            },
        };
        const ChangeCamera = gui.addFolder("ChangeCamera");
        ChangeCamera.add(changeCamera, "transformCamera");
        ChangeCamera.add(changeCamera, "lookatCamera");
        ChangeCamera.add(changeCamera, "flyCamera");
        ChangeCamera.add(changeCamera, "hoverCamera");
        ChangeCamera.open();

        //当transformCamera生效时，直接改变相机的位置和旋转来控制相机
        const transformCamera = gui.addFolder("transformCamera");
        transformCamera.add(this.transformCamera.transform, "x", -30, 30, 0.1);
        transformCamera.add(this.transformCamera.transform, "y", -30, 30, 0.1);
        transformCamera.add(this.transformCamera.transform, "z", -30, 30, 0.1);
        transformCamera.add(this.transformCamera.transform, "rotationX", -180, 180, 1);
        transformCamera.add(this.transformCamera.transform, "rotationY", -180, 180, 1);
        transformCamera.open();

        //当lookatCamera生效时，直接改变相机的位置和目标点来控制相机
        const lookatCamera = gui.addFolder("lookatCamera");
        const LookatCamera = {
            positionX: 0,
            positionY: 10,
            positionZ: 30,
            targetX: 0,
            targetY: 0,
            targetZ: 0,
        };
        lookatCamera.add(LookatCamera, "positionX", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.add(LookatCamera, "positionY", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.add(LookatCamera, "positionZ", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.add(LookatCamera, "targetX", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.add(LookatCamera, "targetY", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.add(LookatCamera, "targetZ", -30, 30, 0.1).onChange(() => {
            this.lookatCamera.lookAt(new Vector3(LookatCamera.positionX, LookatCamera.positionY, LookatCamera.positionZ), new Vector3(LookatCamera.targetX, LookatCamera.targetY, LookatCamera.targetZ));
        });
        lookatCamera.open();

        //可调整fly控制器的移动速度和按下shift速度的倍数
        const flyCamera = gui.addFolder("flyCamera");
        flyCamera.add(this.flyController, "moveSpeed", 0, 10, 0.1);
        flyCamera.add(this.flyController.config, "shiftMoveScale", 0, 10, 1);
        flyCamera.add({ tip: "移动时按下shift加速" }, "tip");
        flyCamera.open();

        //可通过按钮切换相机的视角 三个smooth属性可调整过渡时间更快或者更慢
        const hoverCamera = gui.addFolder("hoverCamera");
        const HoverCamera = {
            resetView: () => {
                this.hoverController.setCamera(0, -30, 30, new Vector3(0, 0, 0));
            },
            view1: () => {
                this.hoverController.setCamera(0, -30, 20, new Vector3(-15, 0, -15));
            },
            view2: () => {
                this.hoverController.setCamera(0, -30, 20, new Vector3(15, 0, -15));
            },
            view3: () => {
                this.hoverController.setCamera(0, -30, 20, new Vector3(-15, 0, 15));
            },
            view4: () => {
                this.hoverController.setCamera(0, -30, 20, new Vector3(15, 0, 15));
            },
        };
        hoverCamera.add(HoverCamera, "resetView");
        hoverCamera.add(HoverCamera, "view1");
        hoverCamera.add(HoverCamera, "view2");
        hoverCamera.add(HoverCamera, "view3");
        hoverCamera.add(HoverCamera, "view4");
        hoverCamera.add(this.hoverController, "dragSmooth", 1, 30, 0.1);
        hoverCamera.add(this.hoverController, "wheelSmooth", 1, 30, 0.1);
        hoverCamera.add(this.hoverController, "rollSmooth", 1, 30, 0.1);
        hoverCamera.open();
    }
}
new demo().run();
