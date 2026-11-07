/**
 * Standalone browser processing client. Not connected to production UI.
 * Worker is local, same-origin and receives text only when the user submits.
 */
export function createClarityProcessor({timeoutMs=15000}={}) {
  let worker=null, nextId=0;
  const pending=new Map();
  function start(){
    if(worker) return worker;
    if(typeof Worker==='undefined') throw new Error('Web Workers are unavailable.');
    worker=new Worker(new URL('./clarity-worker.mjs',import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{
      const p=pending.get(data?.id);
      if(!p)return;
      clearTimeout(p.timer);pending.delete(data.id);
      if(data.ok)p.resolve(data);
      else p.reject(new Error(data.error||'Processing failed.'));
    };
    worker.onerror=()=>{
      for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Local worker failed.'));}
      pending.clear();worker?.terminate();worker=null;
    };
    return worker;
  }
  return {
    process(raw){
      if(typeof raw!=='string'||!raw.trim())return Promise.reject(new Error('Enter a note first.'));
      if(raw.length>14000)return Promise.reject(new Error('Input exceeds 14,000 characters.'));
      let instance;try{instance=start();}catch(error){return Promise.reject(error);}
      const id=++nextId;
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{
          pending.delete(id);worker?.terminate();worker=null;
          for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Worker restarted after timeout.'));}
          pending.clear();reject(new Error('Local processing timed out.'));
        },timeoutMs);
        pending.set(id,{resolve,reject,timer});
        try{instance.postMessage({id,raw});}
        catch(error){clearTimeout(timer);pending.delete(id);reject(error);}
      });
    },
    close(){
      for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Processor closed.'));}
      pending.clear();worker?.terminate();worker=null;
    }
  };
}
