//Virus class, used to track which player has control of a square, and how much life is left.
function Virus(player){
	this.player = player;
	this.life = 5;
}

//the canvas used to draw the state of the game
var ctx;
var stats;
var grid;
var stop_running = true;
var winner_declared = false;
//config object used to set the parameters of the game. This object is passed to the worker thread to initialize it
var config = new Object();
config.depth = 2;
config.grid_size = 6;
config.square_size = 33;
config.offset = 5;
config.runTimeout = 0;
config.player = 0;
config.playertype = "";
//create web workers that will do the processing
var player1 = new Worker("virus-worker.js");
var player2 = new Worker("virus-worker.js");
//when the worker sends a message, act on it.
player1.onmessage = function(event) {
	//if it's a move, then redraw the screen
	if(event.data.type == 'move'){
		onMove(event.data);
	}
	//else
	//	console.log(event.data.children);
	//otherwise, it's an error, send it to the console so we can see it in firebug
};
//if the worker reports an error, log it in firebug
player1.onerror = function(error) {  
	//console.log(error.message);
};
//when the worker sends a message, act on it.
player2.onmessage = function(event) {
	//if it's a move, then redraw the screen
	if(event.data.type == 'move'){
		//console.log(event.data);
		onMove(event.data);
	}
	//else
	//	console.log(event.data);
	//otherwise, it's an error, send it to the console so we can see it in firebug
};
//if the worker reports an error, log it in firebug
player2.onerror = function(error) {  
	//console.log(error.message);
};

function init_grid(){
	grid = new Array();
	
	//initialize the game state. empty nodes are "stored" as undefined to save space and time.
	for(var i=0;i<config.grid_size;i++){
		grid[i] = new Array();
	}
	
	//setup the board with players in the corners
	grid[0][0] = new Virus(1);
	grid[config.grid_size-1][config.grid_size-1] = new Virus(1);
	grid[config.grid_size-1][0] = new Virus(2);
	grid[0][config.grid_size-1] = new Virus(2);
}



//This function runs repeatedly. Checks who should move, and notifies them to move.
function run(){
	//check if there are still possible moves:
	for(var i=0;i<config.grid_size;i++){	
		for(var j=0;j<config.grid_size;j++){
			if(grid[i][j] == undefined){
				//find who's move it is, send them a message to move
				if(stats.moves % 2 == 0){
					move(player1);
				}else{
					move(player2);
				}
				stats.moves++;
				clearTimeout(config.runTimeout);
				return;
			}
		}
	}
	clearTimeout(config.runTimeout);
	//no more moves possible, declare a winner.
	declare_winner();
}

function declare_winner(){
	//count number of blocks for each player.
	var p1 = 0;
	var p2 = 0;
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(grid[i][j] != undefined){
				if(grid[i][j].player == 1){
					p1++;
				}
				if(grid[i][j].player == 2){
					p2++;
				}
			}
		}
	}
	//print the result to the screen so we know who won.
	if(p1 == p2){
		document.getElementById('result').innerHTML="Tie Game!";
		return;
	}
	if(p1 > p2){
		document.getElementById('result').innerHTML="Player 1 wins!";
		return;
	}
	if(p1 < p2){
		document.getElementById('result').innerHTML="Player 2 wins!";
		return;
	}
	winner_declared = true;
}

//sends a move message to the worker. The worker will come up with the best move, or a random move, depending on how the worker was initialized.
function move(player){
	var message = new Object();
	message.do = 'move';
	message.grid = grid;
	player.postMessage(message);
}

//when a player comes back with a move, carry it out
function onMove(data){
	if(typeof(data.grid) != "undefined"){
		grid = data.grid;
		if(!stop_running)
			config.runTimeout = setTimeout(run, 100);
	}else{
		declare_winner();
	}
	refresh_view();
}

//start the run loop
function start(){
	init();
	refresh_view();
	document.getElementById('result').innerHTML="";
	clearTimeout(config.runTimeout);
	stop_running = false;
	run();
}

function resume(){
	if(winner_declared) return true;
	clearTimeout(config.runTimeout);
	stop_running = false;
	run();
}
//pause the game
function stop(){
	stop_running = true;
	clearTimeout(config.runTimeout);
}

function init(){
	init_grid();
	
	ctx = document.getElementById('canvas').getContext("2d");
	stats = new Object();
	stats.moves = 0;
	//tell the worker to set itself up
	var message = new Object();
	message.do = 'init';
	message.config = config;
	message.config.playertype = 'H1';
	message.config.player = 1;
	player1.postMessage(message);
	message.config.playertype = 'H2';
	message.config.player = 2;
	player2.postMessage(message);
	refresh_view();
}

//Redraw the screen based on the state of the game
function refresh_view(){
	//draw the board, color tokens as appropriate
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.rect(0, 0, config.square_size*config.grid_size+(config.offset*2), config.square_size*config.grid_size+(config.offset*2));
	ctx.closePath();
	ctx.fill();
	for(var i=0;i<config.grid_size;i++){
		for(var j=0;j<config.grid_size;j++){
			if(grid[i][j] == undefined){
				//empty
				ctx.fillStyle = "#fff";
				ctx.beginPath();
				ctx.rect(i*config.square_size+config.offset, j*config.square_size+config.offset, config.square_size-1, config.square_size-1);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "#000";
				ctx.stroke();
				continue;
			}
			if(grid[i][j].player == 1){
				//player 1
				switch(grid[i][j].life){
					case 5:
						ctx.fillStyle = "#F00";
						break;
					case 4:
						ctx.fillStyle = "#F33";
						break;
					case 3:
						ctx.fillStyle = "#F66";
						break;
					case 2:
						ctx.fillStyle = "#F99";
						break;
					case 1:
						ctx.fillStyle = "#FCC";
						break;
					default:
						ctx.fillStyle = "#FFF";
				}
				ctx.beginPath();
				ctx.rect(i*config.square_size+config.offset, j*config.square_size+config.offset, config.square_size-1, config.square_size-1);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "#000";
				ctx.stroke();
				continue;
			}
			if(grid[i][j].player == 2){
				//player2
				switch(grid[i][j].life){
					case 5:
						ctx.fillStyle = "#0F0";
						break;
					case 4:
						ctx.fillStyle = "#3F3";
						break;
					case 3:
						ctx.fillStyle = "#6F6";
						break;
					case 2:
						ctx.fillStyle = "#9F9";
						break;
					case 1:
						ctx.fillStyle = "#CFC";
						break;
					default:
						ctx.fillStyle = "#FFF";
				}
				ctx.beginPath();
				ctx.rect(i*config.square_size+config.offset, j*config.square_size+config.offset, config.square_size-1, config.square_size-1);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = "#000";
				ctx.stroke();
				continue;
			}
		}
	}
}