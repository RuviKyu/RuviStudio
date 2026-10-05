#!/usr/bin/env python3
"""
MAKE LINK RESOLVER — RUNG 3 of the WIKIMEDIA ACCESS LADDER.

Reads the FULL breakdown, collects every REF / MAP / CHAR / HOOK image link's
File: title (VIDEO LINKs are skipped; both File-page and upload URLs are
understood), and writes [Subject]_link_resolver.html. The user opens that page
in any browser and clicks once; the page queries the live Commons imageinfo API
(origin=*, chunks of 15 titles) for each file's canonical download URL, marks
each link EXISTS or NOT FOUND, and downloads [Subject]_resolved_links.json.
Upload that JSON back: every url in it came verbatim from the API, and it must
still pass the /x/xy/ = md5(filename) gate before being written anywhere.

Optional argv[1] = the working folder.
"""
import re, glob, os, sys, json
from urllib.parse import unquote

OUT=(sys.argv[1] if len(sys.argv)>1 else "/mnt/user-data/outputs")
hdr=re.compile(r'^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$')
linkre=re.compile(r'^\s*(VIDEO LINK|REF/MAP LINK \d+|ALT LINK \d+|LINK|REFERENCE)\s*:\s*(\S+)')

def is_breakdown(p):
    try: return len(re.findall(r'(?m)^SECTION\s+\d+\s*\|\s*\d+\s*words\s*\|', open(p,encoding="utf-8",errors="ignore").read()))
    except Exception: return 0
def is_special(p):
    try: return "SPECIAL" in open(p,encoding="utf-8",errors="ignore").read(1500).upper().replace("SPECIAL:FILEPATH","")
    except Exception: return False

cands=[p for p in glob.glob(f"{OUT}/*.txt") if is_breakdown(p) and not is_special(p)
       and "special" not in os.path.basename(p).lower()
       and "_original" not in os.path.basename(p).lower()]   # (r8) the pristine review copy is never the FULL
if not cands: sys.exit("No FULL breakdown found in the folder.")
FULL=max(cands,key=is_breakdown); subj=re.sub(r'(_breakdown)?.txt$','',os.path.basename(FULL))
L=open(FULL,encoding="utf-8").read().split('\n'); heads=[i for i,l in enumerate(L) if hdr.match(l)]

def title_of(u):
    m=re.search(r'/wiki/(File:[^?#]+)', u)
    if m: return unquote(m.group(1))
    m=re.search(r'/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?#]+)', u)
    if m: return "File:"+unquote(m.group(1))
    return None

entries=[]
for k,hi in enumerate(heads):
    end=heads[k+1] if k+1<len(heads) else len(L); m=hdr.match(L[hi])
    for j in range(hi+1,end):
        lm=linkre.match(L[j])
        if not lm or lm.group(1)=="VIDEO LINK": continue
        t=title_of(lm.group(2))
        if t: entries.append({"section":int(m.group(1)),"label":lm.group(1),"title":t})
if not entries: sys.exit("No Wikimedia image links found to resolve.")

HTML="""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>__SUBJ__ - Wikimedia link resolver</title>
<style>
 body{font-family:Georgia,serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#222;background:#faf8f4}
 h1{font-size:1.2rem} p{line-height:1.45}
 button{font-size:1rem;padding:.5rem 1rem;cursor:pointer;background:#2d5a3d;color:#fff;border:0;border-radius:4px}
 button:disabled{background:#999}
 table{border-collapse:collapse;width:100%;margin-top:1rem;font-size:.8rem;font-family:system-ui,sans-serif}
 th,td{border:1px solid #ccc;padding:.3rem .45rem;text-align:left;vertical-align:top;word-break:break-all}
 th{background:#eee} .ok{color:#1a7a1a;font-weight:bold}.miss{color:#b00020;font-weight:bold}
 textarea{width:100%;height:8rem;margin-top:1rem;font-family:monospace;font-size:.72rem}
 #dl{margin-left:.6rem;display:none}
 .note{background:#fff6dc;border:1px solid #e5d28a;padding:.55rem .75rem;border-radius:4px;font-size:.88rem}
</style></head><body>
<h1>__SUBJ__ - resolve Wikimedia download URLs</h1>
<p class="note">This page asks the <b>live Wikimedia Commons API</b> for the canonical
<code>upload.wikimedia.org</code> download URL of every image link in the breakdown
(<code>action=query&nbsp;prop=imageinfo&nbsp;iiprop=url|mime|size</code>). Nothing is guessed
or constructed. When it finishes, download the JSON and upload it back into the chat.</p>
<p><button id="go">Resolve all __N__ links</button>
<a id="dl" download="__SUBJ___resolved_links.json"><button type="button">Download JSON</button></a>
<span id="prog"></span></p>
<table id="tbl"><thead><tr><th>#</th><th>Sec</th><th>Label</th><th>File title</th><th>Status</th><th>Canonical download URL (from API)</th></tr></thead><tbody></tbody></table>
<h3>Result JSON (also downloadable above)</h3>
<textarea id="out" readonly placeholder="Run the resolver first."></textarea>
<script>
const ENTRIES=__ENTRIES__;
const API="https://commons.wikimedia.org/w/api.php";
const tbody=document.querySelector("#tbl tbody"),out=document.getElementById("out"),
      prog=document.getElementById("prog"),dl=document.getElementById("dl");
ENTRIES.forEach((e,i)=>{const tr=document.createElement("tr");
 tr.innerHTML="<td>"+(i+1)+"</td><td>S"+e.section+"</td><td>"+e.label+"</td><td>"+
  e.title.replace(/^File:/,"")+"</td><td id='st"+i+"'>-</td><td id='u"+i+"'></td>";
 tbody.appendChild(tr);});
function chunks(a,n){const o=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o;}
document.getElementById("go").onclick=async()=>{
 const btn=document.getElementById("go");btn.disabled=true;prog.textContent=" querying Commons...";
 const results=ENTRIES.map(e=>({...e,url:null,mime:null,missing:true}));
 try{
  for(const grp of chunks([...results.keys()],15)){
   const titles=grp.map(i=>results[i].title).join("|");
   const q=API+"?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cmime%7Csize&titles="
          +encodeURIComponent(titles);
   const data=await (await fetch(q)).json();
   const norm={};(data.query.normalized||[]).forEach(n=>norm[n.to]=n.from);
   const byAsked={};
   Object.values(data.query.pages).forEach(pg=>{const a=(norm[pg.title]||pg.title);
    byAsked[a]=pg;byAsked[a.replace(/ /g,"_")]=pg;});
   for(const i of grp){
    const e=results[i];const pg=byAsked[e.title]||byAsked[e.title.replace(/_/g," ")];
    const st=document.getElementById("st"+i),u=document.getElementById("u"+i);
    if(pg&&!("missing" in pg)&&pg.imageinfo&&pg.imageinfo[0]&&pg.imageinfo[0].url){
     e.url=pg.imageinfo[0].url;e.mime=pg.imageinfo[0].mime||null;e.missing=false;
     st.innerHTML='<span class="ok">EXISTS</span>';u.textContent=e.url;
    }else{st.innerHTML='<span class="miss">NOT FOUND</span>';u.textContent="(no such file on Commons)";}
   }
  }
  const payload={generated_by:"__SUBJ___link_resolver.html",
   api:"commons.wikimedia.org imageinfo url|mime|size",
   generated_at:new Date().toISOString(),links:results};
  const txt=JSON.stringify(payload,null,1);out.value=txt;
  dl.href=URL.createObjectURL(new Blob([txt],{type:"application/json"}));dl.style.display="inline";
  const miss=results.filter(r=>r.missing).length;
  prog.textContent=" done - "+(results.length-miss)+" resolved, "+miss+" not found.";
 }catch(err){prog.textContent=" ERROR: "+err+" - check your connection and try again.";btn.disabled=false;}
};
</script></body></html>
"""
html=(HTML.replace("__ENTRIES__", json.dumps(entries, ensure_ascii=False))
          .replace("__SUBJ__", subj).replace("__N__", str(len(entries))))
dest=f"{OUT}/{subj}_link_resolver.html"
open(dest,"w",encoding="utf-8").write(html)
print(f"Link resolver: {dest}")
print(f"  image links embedded: {len(entries)}")
print("  Hand this file to the user; ask them to open it, click Resolve, and upload")
print(f"  the downloaded {subj}_resolved_links.json back into the chat.")
