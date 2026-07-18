export const widgetHtml = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:light;background:#f3f0e8;color:#1f2923;font:14px system-ui,sans-serif}body{margin:0;padding:16px}main{background:#fffdf8;border:1px solid #d8d4c9;border-radius:14px;padding:16px}h1{font-size:16px;margin:0 0 8px}p{color:#657068;line-height:1.45}button{background:#174f3b;border:0;border-radius:8px;color:white;min-height:44px;padding:0 14px;margin:4px 4px 0 0}button.secondary{background:#e4eee8;color:#174f3b}
</style></head><body><main><h1>LifeThread proposals</h1><p>Review the suggested changes in your web workspace. Nothing is confirmed automatically.</p><button class="secondary" data-action="reject">Reject</button><button data-action="accept">Accept</button></main><script>
for(const button of document.querySelectorAll('button'))button.addEventListener('click',()=>window.parent.postMessage({type:'lifethread-proposal-decision',action:button.dataset.action},'*'));
</script></body></html>`;
