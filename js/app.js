import {gameState} from '../engine/gameState.js';
import {Algorithm} from '../engine/algorithm.js';
import {EventSystem} from '../engine/events.js';
import {renderHeader} from '../components/header.js';
import {progress} from '../components/dashboard.js';
import {eventCard} from '../components/eventCard.js';

class App {
    constructor(){this.init()}
    async init(){
        const saved=gameState.load();
        if(saved)this.startGame();else this.showCharacterCreation();
    }
    showCharacterCreation(){
        document.getElementById('loading-screen').style.display='none';
        document.getElementById('game-container').style.display='block';
        document.getElementById('main-content').innerHTML=`
        <div class="card">
          <h2>🎬 Crea tu Personaje</h2>
          <div style="margin-top:20px">
            <label>Nombre del creador:</label>
            <input type="text" id="creator-name" placeholder="Ej: Alex Gaming" style="width:100%;padding:10px;margin:10px 0;border:2px solid #667eea;border-radius:5px">
            <label>Elige tu nicho:</label>
            <select id="creator-niche" style="width:100%;padding:10px;margin:10px 0;border:2px solid #667eea;border-radius:5px">
              <option value="gaming">🎮 Gaming</option><option value="tech">💻 Tecnología</option><option value="lifestyle">🌟 Lifestyle/Vlogs</option><option value="education">📚 Educación</option><option value="comedy">😂 Comedia</option>
            </select>
            <label>Plataforma principal:</label>
            <select id="creator-platform" style="width:100%;padding:10px;margin:10px 0;border:2px solid #667eea;border-radius:5px">
              <option value="youtube">YouTube</option><option value="twitch">Twitch</option><option value="tiktok">TikTok</option>
            </select>
            <button class="btn btn-primary" id="start-game-btn" style="width:100%;margin-top:20px">🚀 Comenzar Carrera</button>
          </div>
        </div>`;
        document.getElementById('start-game-btn').addEventListener('click',()=>{
            gameState.creator.name=document.getElementById('creator-name').value.trim()||'Creador Anónimo';
            gameState.creator.niche=document.getElementById('creator-niche').value;
            gameState.creator.platform=document.getElementById('creator-platform').value;
            gameState.save();this.startGame();
        });
    }
    startGame(){
        document.getElementById('loading-screen').style.display='none';
        document.getElementById('game-container').style.display='block';
        this.renderDashboard();
    }
    renderDashboard(){this.renderHeader();this.renderMainContent()}
    renderHeader(){document.getElementById('game-header').innerHTML=renderHeader(gameState.creator,n=>this.formatNumber(n))}
    renderMainContent(){
        const c=gameState.creator;
        document.getElementById('main-content').innerHTML=`
        <div class="dashboard-grid">
          <div class="card"><h3>⚡ Energía</h3>${progress('',c.energy)}<div class="value">${Math.round(c.energy)}%</div></div>
          <div class="card"><h3>🧠 Salud Mental</h3>${progress('',c.mentalHealth)}<div class="value">${Math.round(c.mentalHealth)}%</div></div>
          <div class="card"><h3>💡 Inspiración</h3>${progress('',c.inspiration)}<div class="value">${Math.round(c.inspiration)}%</div></div>
          <div class="card"><h3>🔥 Hype</h3>${progress('',c.hype)}<div class="value">${Math.round(c.hype)}%</div></div>
        </div>
        <div class="card"><h3>📈 Habilidades</h3><div style="margin-top:15px">${progress('Carisma',c.charisma)}${progress('Edición',c.editing)}${progress('SEO',c.seo)}${progress('Creatividad',c.creativity)}</div></div>
        <div class="action-buttons">
          <button class="btn btn-primary" id="create-video-btn">🎬 Crear Nuevo Video</button>
          <button class="btn btn-secondary" id="train-btn">📚 Entrenar Habilidades</button>
          <button class="btn btn-secondary" id="rest-btn">😴 Descansar</button>
          <button class="btn btn-secondary" id="advance-week-btn">⏭️ Avanzar Semana</button>
        </div>`;
        document.getElementById('create-video-btn').onclick=()=>this.createVideo();
        document.getElementById('train-btn').onclick=()=>this.train();
        document.getElementById('rest-btn').onclick=()=>this.rest();
        document.getElementById('advance-week-btn').onclick=()=>this.advanceWeek();
    }
    createVideo(){
        if(gameState.creator.energy<30)return this.showNotification('No tienes suficiente energía para crear contenido','error');
        const idea={clickbait:50+Math.random()*30,script:50+Math.random()*30,controversial:Math.random()>.7};
        const result=Algorithm.calculateVideoSuccess(idea,80);
        gameState.addSubscribers(Math.floor(result.views*.01));gameState.addMoney(result.revenue);
        gameState.updateStats({energy:-30,creativity:-5,videosPublished:1,hype:result.viral?20:5});
        if(result.hate>100)gameState.updateStats({mentalHealth:-10,reputation:-5});
        gameState.save();
        let msg=`📹 Video publicado!\n\n👁️ Vistas: ${this.formatNumber(result.views)}\n👍 Likes: ${this.formatNumber(result.likes)}\n💰 Ingresos: $${result.revenue}`;
        if(result.viral)msg+='\n\n🎉 ¡VIDEO VIRAL!';
        this.showNotification(msg,'success');this.renderDashboard();this.checkForRandomEvent();
    }
    train(){
        if(gameState.creator.energy<20)return this.showNotification('No tienes suficiente energía para entrenar','error');
        const skills=['charisma','editing','seo','creativity'],skill=skills[Math.floor(Math.random()*skills.length)],gain=Algorithm.calculateSkillGain(50);
        gameState.updateStats({[skill]:gain,energy:-20});gameState.save();
        this.showNotification(`📚 Entrenaste ${skill} (+${gain})`,'success');this.renderDashboard();
    }
    rest(){gameState.updateStats({energy:40,mentalHealth:10,inspiration:20});gameState.save();this.showNotification('😴 Descansaste y recuperaste energía','success');this.renderDashboard()}
    advanceWeek(){gameState.advanceWeek();gameState.save();this.showNotification(`⏭️ Semana ${gameState.creator.week} del ${gameState.creator.year}`,'success');this.renderDashboard();this.checkForRandomEvent()}
    checkForRandomEvent(){const type=Algorithm.triggerRandomEvent();if(type)setTimeout(()=>this.showEvent(type),600)}
    showEvent(type){
        const event=EventSystem.getEvent(type);if(!event)return;
        const modal=document.getElementById('event-modal');
        document.getElementById('event-card').innerHTML=eventCard(event);
        modal.style.display='flex';
        document.querySelectorAll('.event-option').forEach(el=>el.onclick=()=>this.handleEventChoice(type,Number(el.dataset.optionIndex)));
    }
    handleEventChoice(type,index){
        const event=EventSystem.getEvent(type),option=event.options[index],messages=EventSystem.applyEventEffects(option);
        document.getElementById('event-modal').style.display='none';
        this.showNotification(`${option.message}\n\n${messages.join('\n')}`,'success');
        gameState.save();this.renderDashboard();
    }
    showNotification(message,type='success'){
        const n=document.createElement('div');n.className=`notification ${type}`;n.textContent=message;document.body.appendChild(n);
        setTimeout(()=>n.remove(),4500);
    }
    formatNumber(num){if(num>=1000000)return(num/1000000).toFixed(1)+'M';if(num>=1000)return(num/1000).toFixed(1)+'K';return Math.floor(num).toString()}
}
new App();
