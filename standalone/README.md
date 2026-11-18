# Hai Yin I 独立 HTML

双击 **Hai_Yin_I_Atlas.html**，使用 Chrome 或 Edge 打开。无需启动 Next.js、安装 Node.js、配置数据库或联网；可以只复制这一份 HTML 到其他电脑。

已内嵌：

- 160 份 PDF、782 页的来源台账，支持文件名、中文部位词、来源状态检索和分页。
- 机械设备表的 519 个原表行及 32 页原生提取文字，保留页码。原表行包括子项、续行和双语记录，不等于独立设备数量。
- 已核对尺寸、八个货油舱的肋位和容量、修订依据、数据冲突与未完成范围。
- 独立 Hai Yin I 整船 GLB：闭合船壳、艏楼、艉楼、八个货油舱、双舷压载包络、双机双轴双桨双舵及主要甲板设备。默认显示整船，提供透视、货油舱、机舱、32 个部件定位、旋转、四种视角及网格显示。静止时停止渲染，切回二维释放 GPU 资源。
- CSV、JSON 和 GLB 的本地下载，直接从 HTML 内嵌数据生成。
- 二维轮廓降级、移动端布局及 Three.js 的 MIT 许可。

**整船可浏览不等于全部 1:1 工程细节已经完成。** 甲板及艏楼轮廓来自较新 B 版总结构图，主尺度用米标定；肋骨曲面采用插值，机舱设备和部分甲板设备仍为包络或示意。点选部件可看精度和来源。原始 PDF 未嵌入。

网站中的原教学船 `/atlas` 与 Hai Yin I `/vessels/hai-yin-i` 分开；此 HTML 仅包含独立 Hai Yin I，不将教学船已有部件从 Hai Yin I 中省略。资料去重仅针对重复文件。

## 重新生成

在项目根目录运行：

```sh
npm ci
npm run export:html
```

整船 GLB 可用 `npm run build:hai-yin-ship` 重新生成。HTML 输出为 `standalone/Hai_Yin_I_Atlas.html`。也可指定目标文件：

```sh
node scripts/export-hai-yin-html.mjs "<目标目录>/Hai_Yin_I_Atlas.html"
```

`template.html`、`style.css` 和 `app.js` 为可维护源码。导出器将 Three.js、控件、模型、轮廓、资料和样式一并打包，无 CDN、iframe 或运行时 fetch。数据沿用 `public/hai-yin-i` 中已记录的来源快照。

## 已验证

在 Chrome 中以 `file://` 直接打开并断网验证：图纸搜索及拒绝/重复筛选、分页、来源详情、原页文字、CSV/GLB 下载内容逐字节一致、真实 GLB 渲染、静止停止渲染、旋转、四种视角、复位保持同一 Canvas、网格切换、二维资源释放、WebGL 上下文丢失后的降级与无 WebGL 降级。移动端另检查 390 px 视口无页面横向溢出。
