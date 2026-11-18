# MT Hai Yin I 图纸重建记录

目标：按用户提供资料中的最新有效设计重建，单位为米，1 GLB 单位 = 1 m。不是现船实测竣工模型。当前为部分重建，整船、机舱、货油管路尚未完成。

## 可直接查看的成果

- 路由 `/vessels/hai-yin-i`：尺寸、图纸处理状态、部件覆盖范围、3D 舵叶和二维降级轮廓。
- `public/hai-yin-i/audit/drawing-register.csv`：160 份 PDF、782 页的文件名、SHA-256、日期候选、人工复核状态、去重关系。
- `public/hai-yin-i/audit/source-register.json`：116 个按文件名归组的候选图组。图组数不代表零件数，也不等同于经过图号审核的正式图纸目录。
- `data/hai-yin-i.json`：来源页码、已核对尺寸、舱容表、冲突和几何缺项。
- `public/hai-yin-i/audit/machinery-equipment-tables.csv` / `.json`：机械设备明细表原始单元格提取，保留原文件与页码。从 32 页中的 31 页提取到表格行，另有封面。原表行包含跨页续行和子项，**行数不代表设备数量或已完成去重**；JSON 另保留每页原生文字。
- `public/hai-yin-i/models/rudder-blade-envelope.glb`：仅舵叶外形包络，一份定义供两只舵复用，未赋予船上安装位置。

## 版本控制的具体处理

1. 先算整文件 SHA-256，发现三组完全相同的内容，共 157 份唯一内容。重复文件不生成第二个部件定义。
2. `Modification of Cargo Oil  Transfer Pipe System - Cybermarine Rev0.pdf` 与 `Rev3.pdf` 字节完全相同；实际图签是 CT-19-4528-3001 Rev.03，2019-06-24 带意见批准。不能仅凭文件名判断修订。
3. 检出五份盖有 **Not Approved / Non Approvato** 的提交图，包括 Mooring Equipment Arrangement.pdf、两版 Windlass Foundation Structure and Arrangement Plan、两版 Structure Strengthening Plan for Windlass Foundation。这些图均排除为几何依据。
4. 2012 年基座加强图明确引用已批准艏楼甲板图 SHST-9014（Forecastle Deck Structure Rev3.pdf，第 1 页，2012-02-08）。需要读取该图及意见来重建相应结构，不能沿用被拒图。
5. **Filed / For information** 保留其原始状态，不能改称 Approved。Body Line on Frames.pdf 的型线可用于资料重建，但其印章就是 Filed。
6. 已人工核对关键来源的 12 个候选图组；其余仍是候选来源，必须继续核对图号、船号、适用范围与审批意见。自动日期排序不是最终有效性确认。
7. 机械设备明细表的中英文是相同设备的两种语言记录，不能累计设备数量。NT855-M 主机中文第 2 页写 1258 kg/台，英文第 18 页写 3350 kg/台，两者均写 2 台。重量冲突未解决前，不用其计算质量和重心，也不因双语记录生成四台主机。

## 已核对且有来源的尺寸

| 项目 | 值 | 原始来源 |
|---|---:|---|
| LOA / LPP / LWL | 49.90 / 47.00 / 48.08 m | Body Line on Frames.pdf，第 1 页 |
| 型宽 / 型深 | 9.80 / 4.18 m | 同上 |
| 设计吃水 | 几何暂按 3.40 m | 同上；Hull Specification.pdf 第 5 页英文栏列 3.50 m，冲突保留 |
| 肋距 | 0.560 m | Hull Specification.pdf，第 5 页 |
| 双层底高度 | 0.860 m | Hull Specification.pdf，第 6 页 |
| 货油舱 | 四对，共八舱；807.0 m³ | Hull Specification.pdf，第 6 页；分别为 85.6、112.3、104.9、100.7 m³/单舱 |
| 主机 | 2 × NT855-M，201 kW/台 | Hull Specification.pdf，第 5 页；Main Engine and Gearbox Installation.pdf，第 1 页 |
| 螺旋桨 | 2 × MAU，4 叶，D=1.730 m | Propeller Plan.pdf，第 1 页 |
| 舵叶 | 2 只，弦长 1.400 m，高 2.080 m | Rudder Blade Construction.pdf，第 1 页 |

2011-11-16 的 B 版船体规格书覆盖较早 A 版相应数据：货油总容积 807.2 → 807.0 m³，柴油舱 FR8–11 → FR17–20。不能把较早总布置里的局部布置直接当成最终状态。

## 舵叶几何的实际精度范围

轮廓来自 WUT513B-231-02 第 1 页的两条黑色外轮廓矢量链，共 32 点。按标注弦长 1400 mm 校准 PDF 坐标，以另一个标注高度 2080 mm 拉伸。保留原折线，不添加未经来源支持的样条光顺。提取后的最大厚度约 0.251962 m，反映 PDF 轮廓采样值；不把小数位数量当作制造精度。

当前没有法兰、内部隔板、板厚分区、焊缝、孔、舵杆和安装坐标。GLB extras 内带来源页码、哈希和 `drawing_derived_envelope_not_complete_component` 状态。没有用原学习图谱里的示意船冒充 Hai Yin I。

## 完整精确模型仍缺的几何信息

- 2019 年货油改装图注明 **N.T.S.**。它支持系统连接关系和部分管径，不提供可用于精确三维路由的全部坐标、弯头及支架位置。需要对应管路布置图、带尺寸轴测图或施工 CAD。
- 已有 HDMJ 锚机、HDJP 绞车、HDYY/DYD 舵机厂家资料，需逐页核对其中的尺寸图及适用型号；不能仅依据手册封面建模。对主辅机、泵、阀、计量撬等未给全外形尺寸的设备，需要补足厂家尺寸图或可授权 CAD；其内部构造更不能凭代号生成。
- 主机安装图中的部分孔位、垫片和尺寸明确要求现场确定或复核；没有给出的值保持未确认。
- 船壳逐站曲线、艉部轴桨区、舱壁和上层建筑仍需进一步重建和交叉校验。现阶段不提供虚构闭合船壳，不称完整 1:1 模型。

## 生成与验证

```sh
npm run build:hai-yin-rudder
npm test
npm run build
```

如需从原 PDF 重新提取舵叶轮廓，安装 Python 的 PyMuPDF 后运行：

```sh
python scripts/extract-hai-yin-rudder.py "<原始 PDF 所在文件夹>"
npm run build:hai-yin-rudder
```

GLB 构建器使用已提取的 `public/hai-yin-i/geometry/rudder-profile.json`，重建单一舵叶定义。测试检查全部文件记账、重复内容归并、未批准图排除、舱容合计、GLB 单位和实际几何边界。

原始 PDF 保留在用户资料位置，没有作为本次新增内容复制到公开仓库。仓库内包含模型、提取轮廓、来源元数据和处理记录。
