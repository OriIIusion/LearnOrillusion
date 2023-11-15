import { Engine3D, Scene3D, Object3D, Camera3D, LitMaterial, BoxGeometry, MeshRenderer, DirectLight, HoverCameraController, View3D, AtmosphericComponent } from '@orillusion/core'
export default class demo {
    async run() {
        // 初始化引擎
        await Engine3D.init()
        // 创建一个场景，作为所有物体的根节点
        let scene3D: Scene3D = new Scene3D()
        // 添加一个天空背景
        scene3D.addComponent(AtmosphericComponent)
        // 创建一个相机
        let cameraObj: Object3D = new Object3D()
        let camera = cameraObj.addComponent(Camera3D)
        // 调整相机参数
        camera.perspective(60, Engine3D.aspect, 1, 5000.0)
        // 添加相机控制器，以及设置相机初始的位置 旋转
        let controller = cameraObj.addComponent(HoverCameraController)
        controller.setCamera(0, 0, 15)
        // 相机添加到场景中
        scene3D.addChild(cameraObj)
        // 创建平行光
        let light: Object3D = new Object3D()
        let component: DirectLight = light.addComponent(DirectLight)
        // 调节灯光参数
        light.rotationX = 45
        light.rotationY = 30
        component.intensity = 1
        // 灯光添加到场景中
        scene3D.addChild(light)
        // 创建一个物体，设置它的网格以及材质还有旋转
        const obj: Object3D = new Object3D()
        let mr: MeshRenderer = obj.addComponent(MeshRenderer)
        mr.geometry = new BoxGeometry(5, 5, 5)
        mr.material = new LitMaterial()
        obj.rotationY = 45
        // 物体添加到场景中
        scene3D.addChild(obj)
        // 创建一个view 设置view的场景以及相机
        let view = new View3D()
        view.scene = scene3D
        view.camera = camera
        // 开始渲染
        Engine3D.startRenderView(view)
    }
}