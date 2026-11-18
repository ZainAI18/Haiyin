import Link from "next/link";
import vessel from "@/data/hai-yin-i.json";
import { HaiYinShipViewer } from "@/components/hai-yin-ship-viewer";
import { DrawingIndex } from "@/components/drawing-index";

export const metadata={title:"MT Hai Yin I · 图纸重建"};

export default function HaiYinPage() {
  return <article lang="zh-CN" className="reconstruction">
    <div className="page-heading">
      <p className="eyebrow">VESSEL RECONSTRUCTION / WZ029 / RI 88792</p>
      <h1>MT Hai Yin <span>I</span></h1>
      <p>{vessel.target_cn}</p>
    </div>
    <div className="hyi-vessel-switcher" aria-label="两艘独立船舶"><Link href="/atlas">教学参考船 · 原有图谱 →</Link><span aria-current="page">MT Hai Yin I · 独立按图重建</span></div>
    <p className="warning">已建立 Hai Yin I 整船可视化装配，原有教学船单独保留。图纸标注尺寸、插值外形及设备占位包络在部件说明中分别标明；尚不代表全部细节已经校核完成的 1:1 工程模型。</p>
    <div className="reconstruction-summary" aria-label="资料审核统计">
      <div><strong>{vessel.sources.pdf_count}</strong><span>PDF / {vessel.sources.page_count} 页</span></div>
      <div><strong>{vessel.sources.byte_duplicate_count}</strong><span>份字节重复文件已归并</span></div>
      <div><strong>{vessel.sources.not_approved_count}</strong><span>份 Not Approved 图纸已排除</span></div>
      <div><strong>{vessel.sources.verified_family_count} / {vessel.sources.filename_family_count}</strong><span>候选图组已人工核对关键来源</span></div>
    </div>
    <div className="reconstruction-layout">
      <section className="card station">
        <div className="station-title"><h2>Hai Yin I 整船装配</h2><span>INDEPENDENT VESSEL</span></div>
        <HaiYinShipViewer/>
        <p className="fine">B 版总结构图矢量轮廓、49.90 × 9.80 m 主尺度、最新货油舱肋位与双机布置分别保留依据。每个可点选部件都有精度及来源说明。</p>
      </section>
      <section className="card detail">
        <p className="eyebrow">DIMENSION REGISTER</p><h2>已核对主尺度</h2>
        <dl className="reconstruction-facts">
          {vessel.facts.filter(f=>["loa","lpp","breadth","depth","design-draft","frame-spacing"].includes(f.id)).map(f=><div key={f.id}>
            <dt>{f.label_cn}</dt><dd>{f.value.toFixed(f.id==="frame-spacing"?3:2)} {f.unit}</dd>
          </div>)}
        </dl>
        <p className="fine">来源：Body Line on Frames.pdf 第 1 页；Hull Specification.pdf 第 5 页。吃水 3.40 / 3.50 m 的原文冲突已保留在台账。</p>
        <div className="reconstruction-downloads">
          <a className="text-link" href="/hai-yin-i/audit/drawing-register.csv" download>全部图纸台账 CSV →</a>
          <a className="text-link" href="/hai-yin-i/audit/source-register.json" download>修订与去重记录 JSON →</a>
          <a className="text-link" href="/hai-yin-i/master-data.json" download>尺寸、来源与待补资料 JSON →</a>
          <a className="text-link" href="/hai-yin-i/audit/machinery-equipment-tables.csv" download>机械设备原表提取 CSV →</a>
        </div>
      </section>
    </div>
    <section className="card detail reconstruction-section">
      <p className="eyebrow">MODEL COVERAGE</p><h2>部件与系统的几何精度状态</h2>
      <div className="reconstruction-table-wrap"><table className="reconstruction-table">
        <caption className="fine">几何依据按部件合并。表内状态描述实际完成范围，不表示整船已经重建。</caption>
        <thead><tr><th scope="col">部件 / 系统</th><th scope="col">当前范围</th><th scope="col">原始来源</th></tr></thead>
        <tbody>{vessel.components.map(c=><tr key={c.id}><th scope="row">{c.name_cn}</th><td>{c.note_cn}</td><td>{c.source.file}<br/>第 {c.source.page} 页</td></tr>)}</tbody>
      </table></div>
    </section>
    <div className="reconstruction-layout reconstruction-section">
      <section className="card detail"><p className="eyebrow">REVISION DECISIONS</p><h2>不能直接选修订号最大的文件</h2>
        <ul className="reconstruction-notes">{vessel.conflicts.map(c=><li key={c.id}>{c.text_cn}</li>)}</ul>
        <p className="fine">其余候选图组仍保留复核状态；OCR 日期排序只用于筛选，不等同于确认最新有效版本。“Filed / For information”也不等同于“Approved”。</p>
      </section>
      <section className="card detail"><p className="eyebrow">GEOMETRY GAPS</p><h2>完整精确几何仍缺的资料</h2>
        <ul className="reconstruction-notes">{vessel.required_for_complete_geometry.slice(0,3).map(text=><li key={text}>{text}</li>)}</ul>
        <Link className="text-link" href="/atlas">打开船坞学习图谱 →</Link>
      </section>
    </div>
    <DrawingIndex/>
    <p className="fine">机械设备明细表共 32 页，已从其中 31 页提取原表行并保留页码。跨页续行、子项及适用型号仍待人工归并；表格行数不代表独立设备数量。</p>
  </article>;
}
