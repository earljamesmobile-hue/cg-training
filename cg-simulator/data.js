// Demo content for the CG Practice Simulator. All song lyrics are original demo lyrics written for this
// simulator. Scripture is from the World English Bible (public domain).
window.SIM_SEED = function(){
  let n = 0; const id = p => p + (++n);
  const G = {
    'Stage Display':'#2f9e57','Verse 1':'#2f6fd6','Verse 2':'#2f6fd6','Verse 3':'#2f6fd6','Pre-Chorus':'#b5379a',
    'Chorus':'#d23a4f','Bridge':'#7b45d1','Tag':'#d9822b','Intro':'#2aa198','Ending':'#b59a1f','Blank':'#5d6266'
  };
  const presentations = {};
  function song(name, theme, sections, opts={}){
    const pid = id('p');
    const groups = {}; const slides = [];
    const addGroup = gname => { if(!Object.values(groups).some(g=>g.name===gname)){ const gid=id('g'); groups[gid]={name:gname,color:G[gname]||G[gname.replace(/ \d+$/,'')]||'#5d6266'}; } return Object.keys(groups).find(k=>groups[k].name===gname); };
    const sd = addGroup('Stage Display');
    slides.push({id:id('s'), group:sd, text:'', actions:[{type:'macro', macro:'mac_worship_open'}]});
    const order = [sd];
    sections.forEach(([gname, ...slideTexts]) => {
      const gid = addGroup(gname);
      if(!order.includes(gid)) order.push(gid);
      slideTexts.forEach(t => slides.push({id:id('s'), group:gid, text:t, actions:[]}));
    });
    const arrangement = (opts.arrangement||[]).length ? ['Stage Display',...opts.arrangement].map(nm=>Object.keys(groups).find(k=>groups[k].name===nm)) : order.slice();
    presentations[pid] = {id:pid, name, kind:'song', theme, groups, slides, arrangement};
    return pid;
  }
  function pres(name, slides, extra={}){
    const pid = id('p');
    presentations[pid] = Object.assign({id:pid, name, kind:'slides', theme:'plain', groups:{}, slides:slides.map(s=>Object.assign({id:id('s'), actions:[], text:''}, s)), arrangement:null}, extra);
    return pid;
  }

  const media = {
    img_welcome:{id:'img_welcome', type:'image', name:'Welcome to Sanctus.png', bg:'#DEEBE4', color:'#03393B', title:'Welcome to<br><em>Sanctus Church</em>', sub:'We’re so glad you’re here'},
    img_connect:{id:'img_connect', type:'image', name:'New Here.png', bg:'#1f7a4d', color:'#fff', title:'New to Sanctus?<br><em>Let’s get connected</em>', sub:'sanctuschurch.link/connectcard'},
    img_give:{id:'img_give', type:'image', name:'Ways To Give.png', bg:'#EEF0EA', color:'#03393B', title:'Ways to <em>Give</em>', sub:'Online · Text · E-transfer'},
    img_groups:{id:'img_groups', type:'image', name:'Connect Groups.png', bg:'#F2F1EC', color:'#03393B', title:'Join a<br><em>Connect Group</em>', sub:'sanctuschurch.com/connectgroups'},
    img_social:{id:'img_social', type:'image', name:'Follow Us.png', bg:'#1f7a4d', color:'#fff', title:'Follow us<br><em>on socials</em>', sub:'@sanctuschurch'},
    img_baptism:{id:'img_baptism', type:'image', name:'Considering Baptism.png', bg:'#154547', color:'#fff', title:'Considering<br><em>Baptism?</em>', sub:'sanctuschurch.com/baptism'},
    img_thanks:{id:'img_thanks', type:'image', name:'Thanks For Joining.png', bg:'#123634', color:'#DEEBE4', title:'Thanks for<br><em>joining us!</em>', sub:'Watch on demand at youtube.com/sanctuschurch'},
    img_prayer:{id:'img_prayer', type:'image', name:'Need Prayer.png', bg:'#EEF0EA', color:'#03393B', title:'Need <em>prayer?</em>', sub:'We’d love to support you'},
    img_series:{id:'img_series', type:'image', name:'Series Art - Ordinary Holy.png', bg:'linear-gradient(135deg,#0d3b3d,#2a6f7a)', color:'#fff', title:'Ordinary<br><em>Holy</em>', sub:'A sermon series'},
    vid_countdown:{id:'vid_countdown', type:'video', name:'Meet & Greet Countdown.mp4', duration:20, bg:'linear-gradient(135deg,#0d3b3d,#1e5c63)', title:'Meet & Greet', countdown:true},
    vid_announce:{id:'vid_announce', type:'video', name:'Announcements Video.mp4', duration:15, bg:'linear-gradient(135deg,#2b2140,#5a3d6e)', title:'This Week at Sanctus'},
    vid_bumper:{id:'vid_bumper', type:'video', name:'Sermon Bumper.mp4', duration:8, bg:'linear-gradient(135deg,#0d3b3d,#2a6f7a)', title:'Ordinary Holy'},
    vid_preloop:{id:'vid_preloop', type:'video', name:'Pre-Service Ambient Loop.mp4', duration:12, bg:'linear-gradient(135deg,#133b3c,#3a7c80)', title:'Service starts soon'}
  };

  // ---------- songs (original demo lyrics) ----------
  const sMorning = song('Morning Light - [ Sanctus ]', 'song-bottom', [
    ['Verse 1','Before the sun is rising\nI lift my eyes to You','In every quiet moment\nYour mercy meets me new'],
    ['Chorus','Morning light\nbreaking through','Every heart\nawakes to You','Sing it loud\nlet it rise','You are faithful\nall our lives'],
    ['Verse 2','When shadows try to hold me\nand doubt is at the door','Your voice breaks through the silence\nYou’re calling me once more'],
    ['Bridge','Here we are\nhands open wide','Nothing held back\nnowhere to hide','Here we are\nhearts on fire','You are our\none desire']
  ], {arrangement:['Verse 1','Chorus','Verse 2','Chorus','Bridge','Chorus']});

  const sOpen = song('Open Doors', 'song-bottom', [
    ['Verse 1','You make a way through the desert\nYou make a road in the sea','Every door that was closed before\nYou open wide for me'],
    ['Pre-Chorus','So we lift our voices higher','We lift our voices higher'],
    ['Chorus','Open doors\nopen hearts','This is where\nthe new life starts','Every chain\nis falling down','Freedom is\nthe only sound'],
    ['Verse 2','You speak and mountains are moving\nYou breathe and dry bones stand','Every promise You have spoken\nis written in Your hand'],
    ['Bridge','Let it rise\nlet it rise','Hope is burning\nin our eyes'],
    ['Tag','Freedom is\nthe only sound']
  ]);

  // Off-brand + badly flowed on purpose: students fix it with Themes and Reflow
  const sSteady = song('Steady Ground', 'old-style', [
    ['Verse 1','When the waves are crashing all around\nme','I will stand on what You’ve\nsaid','You are the rock beneath my feet\nYou hold my hand'],
    ['Chorus','Steady ground steady ground in Your love I am found every storm will fade away','On steady ground I’ll\nstay'],
    ['Verse 2','When the night is long and I am\nweary','You are the light that leads me\nhome']
  ]);

  const sHere = song('Here In This Place', 'song-bottom', [
    ['Verse 1','Here in this place\nwe come as we are','Here in this place\nYou meet every heart'],
    ['Chorus','Holy, holy\nall the earth will bow','Holy, holy\nYou are with us now'],
    ['Ending','You are with us now']
  ]);

  // ---------- service elements ----------
  const pGood = pres('GOOD MORNING TEAM!', [{text:'GOOD MORNING TEAM!\nGOD’S GOT IT!\nYOU’VE GOT THIS!\nDON’T FORGET TO WORSHIP :)', style:{pos:'middle', size:4, bold:true}, solid:true}]);
  const pTimer = pres('Pre-Service Timer', [{text:'', actions:[{type:'macro', macro:'mac_soundcheck'}], notes:'Sets the service start timer'}]);
  const loopImgs = ['img_welcome','img_connect','img_give','img_groups','img_social','img_baptism'];
  const pLoop = pres('Pre-Service Loop', loopImgs.map((m,i)=>({text:'', actions:[{type:'media', media:m, behavior: i===3?'background':'foreground', playback:'stop'}].concat(i===0?[{type:'macro',macro:'mac_preservice'}]:[]), timer:{sec:5, loop:i===loopImgs.length-1}})));
  const pWelcome = pres('WELCOME', [
    {text:'', actions:[{type:'macro', macro:'mac_host_open'}], notes:'Welcome everyone\n• Next Gen vision\n• Giving\n• Prayer', timer:{sec:10, loop:false}, label:'Welcome to Sanctus'},
    {text:'', notes:'Host on camera', label:'Name key', l3name:'Jordan Lee', l3role:'Campus Pastor', timer:{sec:10,loop:false}},
    {text:'', label:'Transparent'}
  ]);
  const pTransition = pres('Transition', [
    {text:'', actions:[{type:'media', media:'img_prayer', behavior:'foreground', playback:'stop'}], label:'Prompting'},
    {text:'', label:'Transparent'}
  ]);
  const pMeet = pres('2026 Meet & Greet', [
    {text:'', actions:[{type:'media', media:'vid_countdown', behavior:'foreground', playback:'stop'}, {type:'macro', macro:'mac_meet'}]}
  ]);
  const pHost = pres('HOSTING', [
    {text:'', actions:[{type:'macro', macro:'mac_host_mid'}], notes:'Announcements\n• Baptism Sunday\n• Connect Groups', label:'Host open'},
    {text:'', label:'Name key', l3name:'Jordan Lee', l3role:'Campus Pastor', timer:{sec:10,loop:false}},
    {text:'', actions:[{type:'media', media:'vid_announce', behavior:'foreground', playback:'loop'}], label:'Announcements video'},
    {text:'', label:'Transparent'}
  ]);
  const pSermon = pres('Sermon - Ordinary Holy', [
    {text:'', actions:[{type:'media', media:'vid_bumper', behavior:'foreground', playback:'stop'}, {type:'macro', macro:'mac_sermon'}], label:'Bumper'},
    {text:'', actions:[{type:'media', media:'img_series', behavior:'foreground', playback:'stop'}], label:'Series art'},
    {text:'God is our refuge and strength,\na very present help in trouble.', ref:'Psalm 46:1', style:{}, themeOverride:'scripture-l3'},
    {text:'Blessed are the poor in spirit,\nfor theirs is the Kingdom of Heaven.', ref:'Matthew 5:3', themeOverride:'scripture-l3'},
    {text:'Ordinary days become holy\nwhen we notice God in them.', ref:'Pastor’s quote', themeOverride:'quote-l3'},
    {text:'He has shown you, O man, what is good.\nWhat does Yahweh require of you,\nbut to act justly, to love mercy,\nand to walk humbly with your God?', ref:'Micah 6:8', themeOverride:'scripture-fs'},
    {text:'', label:'Transparent'}
  ], {theme:'scripture-l3'});
  const pClose = pres('CLOSE', [
    {text:'', actions:[{type:'macro', macro:'mac_host_close'}], label:'Host close', notes:'Thank everyone for coming'},
    {text:'', label:'Transparent'}
  ]);
  const pPost = pres('Post-Service Loop', ['img_thanks','img_connect','img_give'].map((m,i,a)=>({text:'', actions:[{type:'media', media:m, behavior:'foreground', playback:'stop'}].concat(i===0?[{type:'macro',macro:'mac_post'}]:[]), timer:{sec:5, loop:i===a.length-1}})));

  const libraries = [
    {id:'lib_worship', name:'Worship', items:[sMorning, sOpen, sSteady, sHere]},
    {id:'lib_sunday', name:'Sunday Elements', items:[pGood, pTimer, pLoop, pWelcome, pTransition, pMeet, pHost, pSermon, pClose, pPost]},
    {id:'lib_youth', name:'Young Adults', items:[]}
  ];
  const playlists = [
    {id:'pl_sunday', name:'Sunday', entries:[
      {type:'item', pres:pGood},{type:'item', pres:pTimer},
      {type:'header', name:'Pre Loop'},{type:'item', pres:pLoop},
      {type:'header', name:'Welcome'},{type:'item', pres:pWelcome},
      {type:'header', name:'Worship'},{type:'item', pres:sMorning},{type:'item', pres:sOpen},{type:'item', pres:sSteady},
      {type:'header', name:'Transition'},{type:'item', pres:pTransition},
      {type:'header', name:'Meet & Greet'},{type:'item', pres:pMeet},
      {type:'header', name:'Host'},{type:'item', pres:pHost},
      {type:'header', name:'Sermon'},{type:'item', pres:pSermon},
      {type:'header', name:'Response'},{type:'item', pres:sHere},
      {type:'header', name:'Close'},{type:'item', pres:pClose},
      {type:'header', name:'Post Loop'},{type:'item', pres:pPost}
    ]},
    {id:'pl_practice', name:'Practice Playlist', entries:[]}
  ];

  const timers = [
    {id:'t_service', name:'Service Start', duration:300},
    {id:'t_worship', name:'Worship', duration:1200},
    {id:'t_host', name:'Host', duration:420},
    {id:'t_meet', name:'Meet & Greet', duration:120},
    {id:'t_sermon', name:'Sermon', duration:2280},
    {id:'t_response', name:'Response', duration:300},
    {id:'t_sound', name:'Soundcheck', duration:600}
  ].map(t=>Object.assign(t,{running:false, elapsed:0, startedAt:0}));

  const stageLayouts = [
    {id:'st_service', name:'Service Starts', els:[
      {type:'clock', x:3,y:4,w:30,h:14, size:5},
      {type:'text', text:'SERVICE STARTS IN', x:10,y:34,w:80,h:12, size:5, align:'center'},
      {type:'timer', timer:'t_service', x:10,y:48,w:80,h:34, size:15, align:'center'}]},
    {id:'st_worship', name:'Worship', els:[
      {type:'clock', x:2,y:2,w:20,h:12, size:5},
      {type:'timer', timer:'t_worship', x:72,y:2,w:26,h:12, size:5, align:'right'},
      {type:'current', x:4,y:18,w:92,h:44, size:6.5, align:'center'},
      {type:'next', x:4,y:64,w:92,h:32, size:5, align:'center'}]},
    {id:'st_host', name:'Host Notes', els:[
      {type:'clock', x:2,y:2,w:20,h:12, size:5},
      {type:'timer', timer:'t_host', x:72,y:2,w:26,h:12, size:5, align:'right'},
      {type:'notes', x:4,y:18,w:92,h:74, size:5}]},
    {id:'st_sermon', name:'Sermon Countdown', els:[
      {type:'clock', x:2,y:2,w:20,h:12, size:5},
      {type:'timer', timer:'t_sermon', x:10,y:22,w:80,h:40, size:16, align:'center'},
      {type:'current', x:4,y:66,w:92,h:30, size:4, align:'center'}]},
    {id:'st_video', name:'Video Countdown', els:[
      {type:'clock', x:2,y:2,w:20,h:12, size:5},
      {type:'text', text:'VIDEO PLAYING', x:10,y:30,w:80,h:12, size:5, align:'center'},
      {type:'video', x:10,y:44,w:80,h:34, size:14, align:'center'}]},
    {id:'st_blank', name:'Blank', els:[]}
  ];

  const macros = [
    {id:'mac_soundcheck', name:'Soundcheck', color:'#c2185b', actions:[{type:'stage', layout:'st_service'},{type:'timer', timer:'t_sound'}]},
    {id:'mac_preservice', name:'PreService Loop', color:'#7b45d1', actions:[{type:'clear', what:'all'},{type:'stage', layout:'st_service'},{type:'timer', timer:'t_service'}]},
    {id:'mac_host_open', name:'Host Open', color:'#c9a227', actions:[{type:'clear', what:'all'},{type:'stage', layout:'st_host'},{type:'timer', timer:'t_host'}]},
    {id:'mac_worship_open', name:'Worship Open', color:'#2f9e57', actions:[{type:'clear', what:'media'},{type:'stage', layout:'st_worship'},{type:'timer', timer:'t_worship'}]},
    {id:'mac_meet', name:'Meet & Greet', color:'#2f6fd6', actions:[{type:'stage', layout:'st_video'},{type:'timer', timer:'t_meet'}]},
    {id:'mac_host_mid', name:'Host Mid (Open)', color:'#c9a227', actions:[{type:'clear', what:'all'},{type:'stage', layout:'st_host'},{type:'timer', timer:'t_host'}]},
    {id:'mac_sermon', name:'Sermon Start', color:'#d9822b', actions:[{type:'clear', what:'slide'},{type:'stage', layout:'st_sermon'},{type:'timer', timer:'t_sermon'}]},
    {id:'mac_host_close', name:'Host Close', color:'#c9a227', actions:[{type:'clear', what:'all'},{type:'stage', layout:'st_host'}]},
    {id:'mac_post', name:'PostService Loop', color:'#7b45d1', actions:[{type:'clear', what:'all'},{type:'stage', layout:'st_blank'}]}
  ];

  const props = [
    {id:'pr_jordan', name:'Jordan Lee', role:'Campus Pastor'},
    {id:'pr_sam', name:'Sam Rivera', role:'Worship Leader'},
    {id:'pr_alex', name:'Alex Chen', role:'Guest Speaker'}
  ];

  return {v:1, presentations, libraries, playlists, media, timers, stageLayouts, macros, props,
    messages:[{id:'msg_kids', name:'Kids Call', template:'KIDS: {code}', code:'C3H3', autoClear:30}],
    missions:{}, nextId:n+1000};
};

// SongSelect-style demo catalog (original lyrics, demo catalog numbers)
window.SIM_CATALOG = [
  {title:'Ever Faithful', authors:'Demo Writers', ccli:'DEMO-1001', sections:[
    ['Verse 1',['Through every season','Your love remains','Through every valley','You stay the same']],
    ['Chorus',['Ever faithful','ever true','All my hope','is found in You']],
    ['Verse 2',['When I am weak','You make me strong','When I am lost','You lead me home']]]},
  {title:'River of Grace', authors:'Demo Writers', ccli:'DEMO-1002', sections:[
    ['Verse 1',['There is a river','running deep and wide','Washing over every heart','that comes inside']],
    ['Chorus',['River of grace','flow over me','River of grace','set my spirit free']],
    ['Bridge',['Deeper still','deeper still','Draw me in','deeper still']]]},
  {title:'Light of the City', authors:'Demo Writers', ccli:'DEMO-1003', sections:[
    ['Verse 1',['On every street','in every home','Let Your light shine','let Your love be known']],
    ['Chorus',['You are the light','of the city','You are the hope','for the world']]]},
  {title:'Higher Still', authors:'Demo Writers', ccli:'DEMO-1004', sections:[
    ['Verse 1',['Above the mountains','above the sky','Your name is lifted','Your name is high']],
    ['Chorus',['Higher still','higher still','We will praise You','higher still']],
    ['Tag',['We will praise You','higher still']]]},
  {title:'Lanterns', authors:'Demo Writers', ccli:'DEMO-1005', sections:[
    ['Verse 1',['We carry lanterns','down the winding road','Every little flame','is a story told']],
    ['Chorus',['Shine on','we will shine on','Till the night is gone','we will shine on']]]},
  {title:'Kingdom Song', authors:'Demo Writers', ccli:'DEMO-1006', sections:[
    ['Verse 1',['We are the people','of Your kingdom','We are the voices','of Your song']],
    ['Chorus',['Sing a kingdom song','all day long','Sing a kingdom song','we belong']]]}
];
