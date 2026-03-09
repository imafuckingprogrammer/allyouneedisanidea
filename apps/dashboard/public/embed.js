(function(){"use strict";const L=o=>`
  :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  #launcher {
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    width: 56px; height: 56px; border-radius: 50%;
    background: ${o}; border: none; cursor: pointer;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  #launcher:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(0,0,0,0.3); }
  #launcher svg { width: 26px; height: 26px; fill: white; transition: transform 0.2s ease; }
  #launcher.open svg { transform: rotate(90deg); }

  #window {
    position: fixed; bottom: 92px; right: 24px; z-index: 2147483647;
    width: 380px; height: 580px; border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 16px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08);
    display: flex; flex-direction: column; overflow: hidden;
    transform-origin: bottom right;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  }
  #window.hidden { transform: scale(0.85); opacity: 0; pointer-events: none; }

  #header {
    padding: 16px 18px; background: ${o};
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
  }
  #header .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  #header .info { flex: 1; min-width: 0; }
  #header .name { color: white; font-weight: 700; font-size: 15px; }
  #header .status {
    color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 2px;
    display: flex; align-items: center; gap: 5px;
  }
  #header .status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #86efac; flex-shrink: 0;
  }
  #header .status-dot.offline { background: rgba(255,255,255,0.4); }
  #close-btn {
    background: rgba(255,255,255,0.15); border: none; cursor: pointer;
    color: white; width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; line-height: 1; flex-shrink: 0; transition: background 0.15s;
  }
  #close-btn:hover { background: rgba(255,255,255,0.25); }

  #messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 6px;
    display: flex; flex-direction: column; gap: 8px; scroll-behavior: smooth;
  }
  #messages::-webkit-scrollbar { width: 4px; }
  #messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  #messages::-webkit-scrollbar-track { background: transparent; }

  .msg {
    max-width: 82%; padding: 10px 14px; border-radius: 14px;
    font-size: 14px; line-height: 1.55; word-break: break-word;
    animation: fadeUp 0.18s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .msg.user {
    align-self: flex-end; background: ${o}; color: white;
    border-bottom-right-radius: 4px;
  }
  .msg.assistant {
    align-self: flex-start; background: #f4f4f5; color: #111827;
    border-bottom-left-radius: 4px;
  }
  .msg.assistant.streaming::after {
    content: '▋'; animation: blink 0.7s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .action-pill {
    align-self: flex-start; display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; color: #6d28d9; background: #f5f3ff;
    padding: 6px 12px; border-radius: 20px; border: 1px solid #ede9fe;
    animation: fadeUp 0.18s ease;
  }
  .action-pill .spinner {
    width: 12px; height: 12px; border: 2px solid #ddd6fe;
    border-top-color: #7c3aed; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .confirmation {
    align-self: stretch;
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 12px; padding: 14px 16px;
    font-size: 13.5px; color: #92400e;
    animation: fadeUp 0.18s ease;
  }
  .confirmation .conf-label { font-weight: 700; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .confirmation .conf-msg { margin-bottom: 12px; line-height: 1.5; }
  .confirmation .actions { display: flex; gap: 8px; }
  .confirmation button {
    flex: 1; padding: 8px 12px; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer; border: none;
    transition: opacity 0.15s;
  }
  .confirmation button:hover { opacity: 0.85; }
  .confirm-yes { background: #dc2626; color: white; }
  .confirm-no { background: #e5e7eb; color: #374151; }

  #input-area {
    padding: 10px 12px 14px; border-top: 1px solid #f3f4f6;
    display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
  }
  #input {
    flex: 1; border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 10px 14px; font-size: 14px; font-family: inherit;
    resize: none; max-height: 120px; min-height: 42px;
    outline: none; line-height: 1.4; color: #111827;
    transition: border-color 0.15s; background: #fafafa;
  }
  #input:focus { border-color: ${o}; background: white; }
  #input::placeholder { color: #9ca3af; }
  #send-btn {
    width: 42px; height: 42px; border-radius: 12px;
    background: ${o}; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: opacity 0.15s, transform 0.15s;
  }
  #send-btn:hover:not(:disabled) { transform: scale(1.06); }
  #send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  #send-btn svg { width: 18px; height: 18px; fill: white; }

  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #9ca3af; font-size: 14px; text-align: center;
    gap: 8px; padding: 24px;
  }
  .empty-icon {
    width: 52px; height: 52px; background: #f4f4f5; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 4px;
  }
  .empty-title { font-weight: 600; color: #374151; font-size: 15px; }
  .suggestions { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; width: 100%; }
  .suggestion {
    background: white; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 9px 14px; font-size: 13px; color: #374151; cursor: pointer;
    text-align: left; font-family: inherit; transition: border-color 0.15s;
  }
  .suggestion:hover { border-color: ${o}; }
`;function A(o){const a=document.createElement("div");a.id="ai-agent-host";const n=a.attachShadow({mode:"closed"});document.body.appendChild(a),n.innerHTML=`
    <style>${L(o.agentColor)}</style>

    <button id="launcher" aria-label="Open chat">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>

    <div id="window" class="hidden">
      <div id="header">
        <div class="avatar">✨</div>
        <div class="info">
          <div class="name">${o.agentName}</div>
          <div class="status" id="status-row">
            <div class="status-dot offline" id="status-dot"></div>
            <span id="status-text">Connecting...</span>
          </div>
        </div>
        <button id="close-btn" aria-label="Close">×</button>
      </div>

      <div id="messages">
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <div class="empty-title">Hi! I'm ${o.agentName}</div>
          <div>Ask me anything or tell me what to do on this page.</div>
          <div class="suggestions">
            <button class="suggestion">What can you help me with?</button>
            <button class="suggestion">Take me to account settings</button>
          </div>
        </div>
      </div>

      <div id="input-area">
        <textarea id="input" placeholder="Ask anything or give me a task..." rows="1"></textarea>
        <button id="send-btn" disabled aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;const e=n.getElementById("launcher"),s=n.getElementById("window"),i=n.getElementById("close-btn"),c=n.getElementById("messages"),d=n.getElementById("input"),t=n.getElementById("send-btn"),I=n.getElementById("status-text"),$=n.getElementById("status-dot");let v=!1,g=null,l=c.querySelector(".empty-state");function u(){v=!v,s.classList.toggle("hidden",!v),e.classList.toggle("open",v),v&&setTimeout(()=>d.focus(),50)}e.addEventListener("click",u),i.addEventListener("click",u),c.querySelectorAll(".suggestion").forEach(r=>{r.addEventListener("click",()=>{var x;const p=(x=r.textContent)==null?void 0:x.trim();p&&o.onMessage(p)})}),d.addEventListener("input",()=>{d.style.height="auto",d.style.height=Math.min(d.scrollHeight,120)+"px"}),d.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),m())}),t.addEventListener("click",m);function m(){const r=d.value.trim();!r||t.disabled||(d.value="",d.style.height="auto",o.onMessage(r))}function C(){l&&(l.remove(),l=null)}function w(){c.scrollTop=c.scrollHeight}return{appendUserMessage(r){C();const p=document.createElement("div");p.className="msg user",p.textContent=r,c.appendChild(p),w()},appendAssistantChunk(r){C(),g||(g=document.createElement("div"),g.className="msg assistant streaming",c.appendChild(g)),g.textContent=(g.textContent||"")+r,w()},finalizeAssistantMessage(){g&&(g.classList.remove("streaming"),g=null)},showActionIndicator(r){var x;(x=n.getElementById("action-indicator"))==null||x.remove();const p=document.createElement("div");p.id="action-indicator",p.className="action-pill",p.innerHTML=`<div class="spinner"></div><span>${r}</span>`,c.appendChild(p),w()},hideActionIndicator(){var r;(r=n.getElementById("action-indicator"))==null||r.remove()},showConfirmation(r,p,x){C();const k=document.createElement("div");k.className="confirmation",k.innerHTML=`
        <div class="conf-label">⚠️ Confirm action</div>
        <div class="conf-msg">${r}</div>
        <div class="actions">
          <button class="confirm-no">Cancel</button>
          <button class="confirm-yes">Yes, continue</button>
        </div>
      `,k.querySelector(".confirm-yes").addEventListener("click",()=>{k.remove(),p()}),k.querySelector(".confirm-no").addEventListener("click",()=>{k.remove(),x()}),c.appendChild(k),w()},setStatus(r){t.disabled=r!=="connected";const p=r==="error",x=r==="connected";$.className="status-dot"+(x?"":" offline"),I.textContent=x?"Online · ready":p?"Connection error":"Connecting..."}}}function O(o,a){var e;const n=(e=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o),"value"))==null?void 0:e.set;n?n.call(o,a):o.value=a,o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0}))}function z(o,a=5e3){return new Promise(n=>{const e=document.querySelector(o);if(e)return n(e);const s=new MutationObserver(()=>{const i=document.querySelector(o);i&&(s.disconnect(),n(i))});s.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{s.disconnect(),n(null)},a)})}function T(o){const a=history.pushState.bind(history),n=history.replaceState.bind(history);history.pushState=function(...e){a(...e),o(window.location.href)},history.replaceState=function(...e){n(...e),o(window.location.href)},window.addEventListener("popstate",()=>o(window.location.href))}function S(){const o=[];return document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [onclick]').forEach(n=>{var c;const e=n.getBoundingClientRect();if(e.width===0&&e.height===0)return;const s={tag:n.tagName.toLowerCase()};n.id&&(s.id=n.id),n.className&&typeof n.className=="string"&&(s.class=n.className.slice(0,80));const i=(c=n.textContent)==null?void 0:c.trim().slice(0,60);i&&(s.text=i),n instanceof HTMLInputElement&&(s.type=n.type,s.name=n.name,s.placeholder=n.placeholder),n instanceof HTMLAnchorElement&&n.href&&(s.href=n.href),o.push(s)}),{url:window.location.href,title:document.title,interactiveElements:o.slice(0,40)}}async function N(o,a){var n;try{switch(o){case"navigate_to":{const e=a.url;return window.location.href=e,{success:!0}}case"click_element":{const e=a.selector,s=await z(e,4e3);return s?(s.click(),await new Promise(i=>setTimeout(i,100)),{success:!0}):{success:!1,error:`Element not found: ${e}`}}case"scroll_to":{const e=a.target;if(e==="top")window.scrollTo({top:0,behavior:"smooth"});else if(e==="bottom")window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});else{const s=document.querySelector(e);if(!s)return{success:!1,error:`Element not found: ${e}`};s.scrollIntoView({behavior:"smooth",block:"center"})}return{success:!0}}case"fill_input":{const e=a.selector,s=a.value,i=await z(e,4e3);return i?!(i instanceof HTMLInputElement)&&!(i instanceof HTMLTextAreaElement)?{success:!1,error:`Element is not an input: ${e}`}:(O(i,s),{success:!0}):{success:!1,error:`Input not found: ${e}`}}case"extract_text":{const e=a.selector,s=e==="body"?document.body:document.querySelector(e);return s?{success:!0,data:(n=s.textContent)==null?void 0:n.trim().slice(0,2e3)}:{success:!1,error:`Element not found: ${e}`}}case"get_page_state":return{success:!0,data:S()};case"wait":{const e=Math.min(a.ms||1e3,5e3);return await new Promise(s=>setTimeout(s,e)),{success:!0,data:S()}}default:return{success:!1,error:`Unknown action: ${o}`}}}catch(e){return{success:!1,error:String(e)}}}let h="#6366f1",y=null,b=null,f=null,E=null;function B(o){h=o,U()}async function j(o,a){M();const n=document.querySelector(o);if(!n)return;n.scrollIntoView({behavior:"smooth",block:"nearest"}),await new Promise(I=>setTimeout(I,250));const e=n.getBoundingClientRect();if(e.width===0&&e.height===0)return;const i=window.getComputedStyle(n).borderRadius||"6px",c=5;y=document.createElement("div"),y.id="__ai_agent_overlay__",Object.assign(y.style,{position:"fixed",top:`${e.top-c}px`,left:`${e.left-c}px`,width:`${e.width+c*2}px`,height:`${e.height+c*2}px`,borderRadius:i,border:`2px solid ${h}`,background:_(h,.06),pointerEvents:"none",zIndex:"2147483646",animation:"ai_agent_pulse 1.8s ease-in-out infinite",transition:"opacity 0.15s ease"}),b=document.createElement("div"),b.id="__ai_agent_label__";const d=e.top-c-36,t=d<8?e.bottom+c+6:d;Object.assign(b.style,{position:"fixed",top:`${t}px`,left:`${Math.max(8,e.left-c)}px`,background:h,color:"#fff",padding:"5px 11px",borderRadius:"7px",fontSize:"12px",fontWeight:"600",fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',whiteSpace:"nowrap",pointerEvents:"none",zIndex:"2147483647",boxShadow:`0 3px 12px ${_(h,.4)}`,letterSpacing:"0.01em",animation:"ai_agent_fadein 0.15s ease",maxWidth:"280px",overflow:"hidden",textOverflow:"ellipsis"}),b.textContent=a,document.body.appendChild(y),document.body.appendChild(b)}function R(){f==null||f.remove(),f=document.createElement("div"),f.id="__ai_agent_scan__",Object.assign(f.style,{position:"fixed",top:"0",left:"0",width:"100%",height:"4px",background:`linear-gradient(90deg, transparent 0%, ${h} 50%, transparent 100%)`,backgroundSize:"200% 100%",pointerEvents:"none",zIndex:"2147483647",animation:"ai_agent_scan 1.2s ease-in-out infinite"}),document.body.appendChild(f)}function M(){y==null||y.remove(),b==null||b.remove(),f==null||f.remove(),y=null,b=null,f=null}function U(){E&&E.remove(),E=document.createElement("style"),E.id="__ai_agent_styles__",E.textContent=`
    @keyframes ai_agent_pulse {
      0%, 100% {
        box-shadow:
          0 0 0 0 ${_(h,.3)},
          0 0 16px ${_(h,.2)};
      }
      50% {
        box-shadow:
          0 0 0 5px ${_(h,0)},
          0 0 28px ${_(h,.45)};
      }
    }
    @keyframes ai_agent_scan {
      0%   { background-position: 200% 0; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { background-position: -200% 0; opacity: 0; }
    }
    @keyframes ai_agent_fadein {
      from { opacity: 0; transform: translateY(3px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,document.head.appendChild(E)}function _(o,a){const n=o.replace("#",""),e=n.length===3?n.split("").map(d=>d+d).join(""):n,s=parseInt(e.slice(0,2),16)||99,i=parseInt(e.slice(2,4),16)||102,c=parseInt(e.slice(4,6),16)||241;return`rgba(${s}, ${i}, ${c}, ${a})`}(function(){const o=document.currentScript,a=o==null?void 0:o.dataset.siteId,n=(o==null?void 0:o.dataset.server)||"wss://agent.yourdomain.com";if(!a){console.error("[AIAgent] Missing data-site-id on script tag.");return}function e(){const l=`ai_agent_fp_${a}`;let u=localStorage.getItem(l);return u||(u=Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(l,u)),u}const s=e();let i=null,c=null,d=1e3,t=null;function I(){const l=`${n}?siteId=${a}&fp=${s}&url=${encodeURIComponent(window.location.href)}`;i=new WebSocket(l),i.addEventListener("open",()=>{d=1e3,t==null||t.setStatus("connected"),i.send(JSON.stringify({type:"page_context",data:S()}))}),i.addEventListener("message",async u=>{const m=JSON.parse(u.data);await v(m)}),i.addEventListener("close",()=>{t==null||t.setStatus("connecting"),t==null||t.hideActionIndicator(),$()}),i.addEventListener("error",()=>{t==null||t.setStatus("error")})}function $(){c||(c=setTimeout(()=>{c=null,d=Math.min(d*2,16e3),I()},d))}async function v(l){switch(l.type){case"config":{const u=l.data;B(u.agentColor),t||(t=A({agentName:u.agentName,agentColor:u.agentColor,onMessage:g}),t.setStatus("connecting"));break}case"text_chunk":{t==null||t.appendAssistantChunk(l.chunk);break}case"text_done":{t==null||t.finalizeAssistantMessage();break}case"action":{const u=l.action,m=l.params||{},C=l.actionId,w=l.label||u;if(t==null||t.showActionIndicator(w),u==="get_page_state")R();else{const p=m.selector??m.target;p&&p!=="top"&&p!=="bottom"&&await j(p,w)}const r=await N(u,m);M(),t==null||t.hideActionIndicator(),i==null||i.send(JSON.stringify({type:"action_result",actionId:C,result:r})),i==null||i.send(JSON.stringify({type:"page_context",data:S()}));break}case"confirm":{const u=l.message,m=l.confirmId;t==null||t.showConfirmation(u,()=>i==null?void 0:i.send(JSON.stringify({type:"confirm_result",confirmId:m,confirmed:!0})),()=>i==null?void 0:i.send(JSON.stringify({type:"confirm_result",confirmId:m,confirmed:!1})));break}case"error":{t==null||t.finalizeAssistantMessage(),t==null||t.hideActionIndicator(),t==null||t.appendAssistantChunk(l.message||"Something went wrong."),t==null||t.finalizeAssistantMessage();break}}}function g(l){!i||i.readyState!==WebSocket.OPEN||(t==null||t.appendUserMessage(l),i.send(JSON.stringify({type:"user_message",text:l,pageContext:S()})))}T(l=>{i==null||i.send(JSON.stringify({type:"page_context",data:{...S(),url:l}}))}),I()})()})();
