import { BoxGeometry, Camera3D, ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, PointLight, PointerEvent3D, Vector3, ColliderComponent, BlendMode, UnLitMaterial } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import dat from "dat.gui";

export default class demo {
    light: PointLight;
    async run() {
        console.log("灯光跟随鼠标");
        //设置阴影 拾取事件类型 初始化引擎

        Engine3D.setting.shadow.type = "HARD";
        // Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0;
        Engine3D.setting.shadow.pointShadowBias = 2;
        Engine3D.setting.pick.mode = "pixel";
        await Engine3D.init();

        //新建一个场景 添加FPS显示
        const scene = new Scene3D();
        scene.addComponent(Stats);

        //新建相机
        const cameraObj = new Object3D();
        const camera = cameraObj.addComponent(Camera3D);
        //设置相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.lookAt(new Vector3(0, 0, 30), new Vector3(0, 0, 0));
        scene.addChild(cameraObj);

        //添加点光源
        const lightObj = new Object3D();
        this.light = lightObj.addComponent(PointLight);
        this.light.intensity = 15;
        this.light.range = 20;
        this.light.radius = 0.5;
        lightObj.z = 5;
        this.light.castShadow = true;
        scene.addChild(lightObj);

        //给点光源添加dat.gui方便调试灯光参数
        const lightColor = {
            color: [255, 255, 255, 255],
        };
        const gui = new dat.GUI();
        const light = gui.addFolder("点光源");
        light.add(this.light, "intensity", 5, 20, 1);
        light.add(this.light, "range", 10, 30, 1);
        light.add(this.light, "radius", 0.1, 1, 0.1);
        light.addColor(lightColor, "color").onChange((v) => {
            this.light.lightColor = new Color(v[0] / 255, v[1] / 255, v[2] / 255);
        });
        light.open();

        //添加一个地面
        const floor = Object3DUtil.GetSingleCube(100, 100, 1, 1, 1, 1);
        floor.z = -3;
        scene.addChild(floor);

        //创建一个Box样本
        const boxObj = new Object3D();
        const boxMr = boxObj.addComponent(MeshRenderer);
        const boxMat = new LitMaterial();
        boxMr.geometry = new BoxGeometry(2, 2, 2);
        boxMr.material = boxMat;
        //两层循环创建100个Box x和y范围在-18到18之间
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const obj = boxObj.clone();
                obj.addComponent(RotateScript);
                obj.x = i * 4 - 18;
                obj.y = j * 4 - 18;
                scene.addChild(obj);
            }
        }

        //创建辅助拾取对象
        const helper = new Object3D();
        const mr = helper.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(100, 100, 1);
        //设置为完全透明
        const mat = new UnLitMaterial();
        mat.baseColor = new Color(1, 1, 1, 0);
        mat.blendMode = BlendMode.ALPHA;
        mr.material = mat;
        helper.z = 5;
        //添加ColliderComponent组件，才可以响应拾取事件。
        helper.addComponent(ColliderComponent);
        //给此对象添加PICK_MOVE事件监听器，当鼠标在对象上移动时，调用onMove方法
        helper.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
        scene.addChild(helper);

        //创建View3D对象 开始渲染
        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }
    private onMove(e: PointerEvent3D) {
        //e.data.pickInfo.worldPos中有点击接触点的世界坐标
        this.light.transform.x = e.data.worldPos.x;
        this.light.transform.y = e.data.worldPos.y;
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
new demo().run();
