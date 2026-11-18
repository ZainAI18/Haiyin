"use client";

import { useState } from "react";

type Drawing={
  source_id:string;file:string;page_count:number;selection:string;
  stamp_status_detected:string;stamp_date_candidate:string;date_review:string;
  selected_family_file:string;duplicate_of:string;
};

const states:Record<string,string>={
  verified_source:"关键来源已核对",verified_latest_in_family:"图组内最新来源已核对",
  candidate_latest_stamp:"日期最新候选 · 待核验",candidate_single_source:"单一来源 · 待核验",
  earlier_stamp_candidate:"较早日期候选",exact_duplicate:"字节重复 · 归并",
  excluded_not_approved:"未获批准 · 排除",revision_review_required:"修订关系待核验",
};

export function DrawingIndex() {
  const [records,setRecords]=useState<Drawing[]>();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  async function load() {
    setLoading(true);setError(false);
    try {
      const response=await fetch("/hai-yin-i/audit/source-register.json");
      if(!response.ok) throw new Error("Register unavailable");
      const value=await response.json();
      if(!Array.isArray(value.source_records) || value.source_records.length!==160) throw new Error("Invalid register");
      setRecords(value.source_records);
    } catch { setError(true); }
    finally { setLoading(false); }
  }
  const needle=query.trim().toLocaleLowerCase();
  const matches=records?.filter(r=>(!needle || `${r.file} ${r.source_id} ${states[r.selection]??""}`.toLocaleLowerCase().includes(needle)) &&
    (filter==="all" || filter==="rejected" && r.selection==="excluded_not_approved" ||
      filter==="duplicates" && r.selection==="exact_duplicate" ||
      filter==="verified" && r.date_review==="visually_verified"));
  return <section className="card detail reconstruction-section" aria-label="全部图纸索引">
    <p className="eyebrow">ALL SOURCE DOCUMENTS</p><h2>全部 160 份资料索引</h2>
    <p className="fine">记录每份文件的页数、候选状态和重复关系。文件已记账不等于其每页几何已重建。</p>
    {!records ? <>
      <button className="primary" type="button" disabled={loading} onClick={load}>{loading ? "正在加载索引…" : error ? "重试加载资料索引" : "打开全部资料索引"}</button>
      {error && <p role="alert">索引加载失败。请重试，或使用上方 JSON 下载链接。</p>}
    </> : <>
      <div className="drawing-index-controls">
        <label className="search"><span>查找</span><input type="search" aria-label="搜索图纸文件名或编号" placeholder="例如 Shaft、Engine、HYI-D…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <label>范围 <select aria-label="筛选图纸状态" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">全部文件</option><option value="rejected">未获批准</option>
          <option value="duplicates">完全重复</option><option value="verified">人工核对关键来源</option>
        </select></label>
      </div>
      <p className="fine" role="status">显示 {matches?.length} / {records.length} 份文件</p>
      <div className="reconstruction-table-wrap drawing-index-scroll"><table className="reconstruction-table">
        <thead><tr><th scope="col">编号 / 文件</th><th scope="col">页数</th><th scope="col">来源状态</th><th scope="col">候选日期 / 归并关系</th></tr></thead>
        <tbody>{matches?.map(r=><tr key={r.source_id}>
          <th scope="row"><small>{r.source_id}</small><br/>{r.file}</th><td>{r.page_count}</td>
          <td>{states[r.selection]??r.selection}<br/><small>{r.stamp_status_detected==="filed" ? "Filed · 不等同于 Approved" : r.stamp_status_detected==="unconfirmed" ? "印章状态未确认" : r.stamp_status_detected==="not_approved" ? "Not Approved" : "Approved（OCR / 人工状态见台账）"}</small></td>
          <td>{r.stamp_date_candidate || "日期待核对"}{r.duplicate_of && <><br/>归并至 {r.duplicate_of}</>}</td>
        </tr>)}</tbody>
      </table>{matches?.length===0 && <p>没有匹配文件。</p>}</div>
    </>}
  </section>;
}
