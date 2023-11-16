import { Engine3D } from "@orillusion/core"

export default class demo {
    async run() {
        console.log("转动的Box")
        //初始化引擎
        await Engine3D.init();
    }
}