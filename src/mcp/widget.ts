export const widgetHtml = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:light;background:#f3f0e8;color:#1f2923;font:14px system-ui,sans-serif}body{margin:0;padding:16px}main{background:#fffdf8;border:1px solid #d8d4c9;border-radius:14px;padding:16px}h1{font-size:16px;margin:0 0 8px}p{color:#657068;line-height:1.45}.proposal{border-top:1px solid #e5e0d6;padding:12px 0}.proposal:first-child{border-top:0}.proposal p{margin:0 0 8px;color:#1f2923}button{background:#174f3b;border:0;border-radius:8px;color:white;min-height:40px;padding:0 14px;margin:4px 4px 0 0}button.secondary{background:#e4eee8;color:#174f3b}button:disabled{opacity:.55}#status{min-height:20px;margin-top:8px}
</style></head><body><main><h1>LifeThread proposals</h1><p>Review the suggested changes in your web workspace. Nothing is confirmed automatically.</p><section id="proposals"></section><p id="status" role="status"></p></main><script>
const host=window.openai;
const output=host?.toolOutput?.structuredContent||host?.toolOutput||{};
const proposals=Array.isArray(output.proposals)?output.proposals:[];
const threadId=output.thread_id;
const expectedVersion=output.resulting_version;
const list=document.getElementById('proposals');
const status=document.getElementById('status');
if(!proposals.length){status.textContent='No proposals are available.';}
for(const proposal of proposals){
  const item=document.createElement('article');item.className='proposal';
  const text=document.createElement('p');text.textContent=proposal.content;item.appendChild(text);
  for(const action of ['reject','accept']){
    const button=document.createElement('button');button.textContent=action==='accept'?'Accept':'Reject';if(action==='reject')button.className='secondary';
    button.addEventListener('click',async()=>{
      if(!host?.callTool||!threadId||typeof expectedVersion!=='number'){status.textContent='This review card is missing its decision context.';return;}
      for(const sibling of item.querySelectorAll('button'))sibling.disabled=true;
      status.textContent=action==='accept'?'Accepting…':'Rejecting…';
      try{
        const result=await host.callTool(action==='accept'?'accept_lifethread_proposal':'reject_lifethread_proposal',{thread_id:threadId,proposal_id:proposal.id,expected_version:expectedVersion});
        const outcome=result?.structuredContent?.outcome||result?.outcome;
        status.textContent=outcome==='accepted'?'Accepted.':outcome==='rejected'?'Rejected.':('Result: '+(outcome||'updated'));
      }catch(error){status.textContent='Could not update this proposal. Please retry from the workspace.';for(const sibling of item.querySelectorAll('button'))sibling.disabled=false;}
    });item.appendChild(button);
  }
  list.appendChild(item);
}
</script></body></html>`;
