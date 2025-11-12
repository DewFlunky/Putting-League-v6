const teamsDiv = document.getElementById('teams');
const standingsDiv = document.getElementById('standings');
const randomizeBtn = document.getElementById('randomizeTeams');
const submitBtn = document.getElementById('submitScores');
let players = ['Player 1','Player 2','Player 3','Player 4','Player 5','Player 6'];
let teams = [];
function randomizeTeams() {
  const shuffled = [...players].sort(()=>Math.random()-0.5);
  teams = [];
  for(let i=0;i<shuffled.length;i+=2){teams.push(shuffled.slice(i,i+2));}
  renderTeams();
}
function renderTeams(){
  teamsDiv.innerHTML='';
  teams.forEach((t,i)=>{
    const div=document.createElement('div');
    div.className='team';
    div.textContent=`Team ${i+1}: ${t.join(' & ')}`;
    teamsDiv.appendChild(div);
  });
}
submitBtn.onclick=()=>{
  standingsDiv.classList.remove('hidden');
  standingsDiv.innerHTML='<h2>Standings</h2><p>Round results stay visible...</p>';
};
randomizeBtn.onclick=randomizeTeams;
