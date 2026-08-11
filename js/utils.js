export function randomBetween(min,max){return Math.floor(Math.random()*(max-min+1))+min}
export function weightedRandom(options){const total=options.reduce((s,o)=>s+o.weight,0);let r=Math.random()*total;for(const o of options){r-=o.weight;if(r<=0)return o.value}return options[options.length-1].value}
export function formatNumber(num){if(num>=1000000)return(num/1000000).toFixed(1)+'M';if(num>=1000)return(num/1000).toFixed(1)+'K';return num.toString()}
export function debounce(func,wait){let timeout;return function(...args){clearTimeout(timeout);timeout=setTimeout(()=>func(...args),wait)}}
