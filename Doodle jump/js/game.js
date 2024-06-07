$(document).ready(function(e) {
    SiteManager.init();
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var SiteManager = {
    init: function () {
        StartScreen.init();
        TheGame.init();

        //

        StartScreen.showMe();
    }
};

var StartScreen = {
    myVisual:null,
    myStartButton:null,

    init: function () {
        this.myVisual = $('.js-start-screen');
        this.myStartButton = $('.js-start-button');
    },

    showMe: function () {
        this.myVisual.fadeIn();
        this.myStartButton.on("click", this.onStartClicked.bind(this));
    },

    hideMe: function() {
        this.myStartButton.off("click");
        this.myVisual.fadeOut();
    },

    onStartClicked: function () {
        this.hideMe();
        TheGame.showMe();
    }
};

var TheGame = {
    AREA_WIDTH:394,
    AREA_HEIGHT:315,
    MAX_JUMP_HEIGHT:150,
    TARGET_HEIGHT:-1500,

    myVisual:null,
    viewportOffset:{x:0,y:0},
    bLeftIsPressed:false,
    bRightIsPressed:false,
    aActivePlatforms:[],
    aPlatformsPool:[],
    nNextPlatformY:0,
    nPlatformIDCount:0,
    bGameActive:false,

    init: function () {
        Jumper.init();

        this.myVisual = $('.js-game-screen');
    },

    showMe: function() {
        this.setupNewGame();
        this.startGame();

        //

        this.myVisual.fadeIn();
    },

    startGame: function () {
        document.onkeydown = this.onKeyedDown.bind(this);
        document.onkeyup = this.onKeyedUp.bind(this);
        this.bGameActive = true;
        this.onUpdateStage();
    },

    clearGame: function () {
        for(var i=0;i<this.aActivePlatforms.length;i++){
            this.aActivePlatforms[i].hideMe();
            this.aPlatformsPool.push(this.aActivePlatforms[i]);
        }
        this.aActivePlatforms = [];
    },

    setupNewGame: function () {
        Jumper.resetPlayer();

        this.viewportOffset.x = 0;
        this.viewportOffset.y = 0;

        this.bLeftIsPressed = false;
        this.bRightIsPressed = false;

        this.makeNewPlatform(297,"wide");
        this.makeNewPlatform(Math.floor(this.AREA_HEIGHT*0.65), "normal");
        this.makeNewPlatform(Math.floor(this.AREA_HEIGHT*0.4), "normal");
        this.makeNewPlatform(Math.floor(this.AREA_HEIGHT*0.1), "normal");
        this.nNextPlatformY = -20;

        this.renderToScreen();
    },

    makeNewPlatform: function(_y, _version) {
        var pf;

        if(this.aPlatformsPool.length > 0){
            pf = this.aPlatformsPool.pop();
        }else{
            pf = new Platform(this.nPlatformIDCount);
            this.nPlatformIDCount++;
        }

        pf.setVersion(_version);
        pf.setWorldPosY(_y)

        pf.showMe();

        this.aActivePlatforms.push(pf);
    },

    managePlatforms: function () {
        var keepsies = [];
        for(var i=0;i<this.aActivePlatforms.length;i++){
            if(this.aActivePlatforms[i].myWorldPos.y - this.viewportOffset.y > this.AREA_HEIGHT){
                this.aActivePlatforms[i].hideMe();
                this.aPlatformsPool.push(this.aActivePlatforms[i]);
            }else{
                keepsies.push(this.aActivePlatforms[i]);
            }
        }

        this.aActivePlatforms = keepsies;

        if(this.viewportOffset.y < this.nNextPlatformY+20 && this.viewportOffset.y > this.TARGET_HEIGHT+75){
            this.makeNewPlatform(this.nNextPlatformY, "normal");
            this.nNextPlatformY = this.viewportOffset.y - Math.floor(((Math.random()*0.7)+0.3) * this.MAX_JUMP_HEIGHT);
        }
    },

    onKeyedDown: function (e) {
        switch(e.keyCode){
            case 37:
                this.bLeftIsPressed = true;
                e.preventDefault();
                break;

            case 39:
                this.bRightIsPressed = true;
                e.preventDefault();
                break;
        }
    },

    onKeyedUp: function (e) {
        switch(e.keyCode){
            case 37:
                this.bLeftIsPressed = false;
                e.preventDefault();
                break;

            case 39:
                this.bRightIsPressed = false;
                e.preventDefault();
                break;
        }
    },

    checkForPlatformHit: function () {
        if(Jumper.isGoingDown()){
            for(var i=0;i<this.aActivePlatforms.length;i++){
                this.aActivePlatforms[i].checkJumper();
            }
        }
    },

    renderToScreen: function () {
        for(var i=0;i<this.aActivePlatforms.length;i++){
            this.aActivePlatforms[i].renderMe(this.viewportOffset.x, this.viewportOffset.y);
        }

        Jumper.renderMe(this.viewportOffset.x, this.viewportOffset.y);

        if(Jumper.myWorldPos.y - this.viewportOffset.y > this.AREA_HEIGHT+50){
            this.gameOver();
        }
    },

    gameOver: function () {
        this.bGameActive = false;
        document.onkeydown = null;
        document.onkeyup = null;
        window.setTimeout(this.restartGame.bind(this),1500);
    },

    restartGame: function() {
        this.clearGame();
        this.setupNewGame();
        this.startGame();
    },

    handleViewportOffset: function () {
        if(Jumper.isGoingUp()) {
            var dif = this.AREA_HEIGHT *0.4 - (Jumper.myWorldPos.y - this.viewportOffset.y);
            if (dif > 0) {
                dif*=1.2;
                this.viewportOffset.y -= (dif*0.1);
            }
        }
    },

    onUpdateStage: function () {
        if(this.bGameActive) {
            this.managePlatforms();
            Jumper.onUpdateMe();
            this.checkForPlatformHit();
            this.renderToScreen();
            this.handleViewportOffset();
            //
            requestAnimationFrame(this.onUpdateStage.bind(this));
        }
    }
};

var Platform = function(_id) {
    this.myPlatformContainer = $('.js-platforms-container');
    var htmlcode = `<div id='platform${_id}' class='platform'></div>`;
    this.myPlatformContainer.append(htmlcode);
    this.myVisual = $(`#platform${_id}`);
    this.myWorldPos = {x:0,y:0};
}

Platform.prototype.setVersion = function (_version) {
    this.sMyVersion = _version;
    if(this.sMyVersion != "normal"){
        this.nPlatformwidth = 250;
        this.myWorldPos.x = (TheGame.AREA_WIDTH-268)*0.5;
    }else{
        this.nPlatformwidth = 80;
        this.myWorldPos.x = Math.floor(Math.random()*TheGame.AREA_WIDTH*0.8)-25;
    }


    this.myVisual.removeClass('--wide');
    this.myVisual.removeClass('--normal');

    this.myVisual.addClass(`--${this.sMyVersion}`);
}

Platform.prototype.setWorldPosY = function (_y) {
    this.myWorldPos.y = _y;
}

Platform.prototype.showMe = function () {
    this.myVisual.show();
}

Platform.prototype.hideMe = function () {
    this.myVisual.hide();
}

Platform.prototype.renderMe = function (_viewPortOffsetX, _viewPortOffsetY) {
    this.myVisual.css({
        left:`${this.myWorldPos.x - _viewPortOffsetX}px`,
        top:`${this.myWorldPos.y - _viewPortOffsetY}px`
    });
}

Platform.prototype.checkJumper = function () {
    if(Jumper.myWorldPos.x > this.myWorldPos.x){
        if(Jumper.myWorldPos.x < this.myWorldPos.x + this.nPlatformwidth){
            if(Jumper.myWorldPos.y >= this.myWorldPos.y){
                if(Jumper.myWorldPos.y - Jumper.mySpeed.dy < this.myWorldPos.y){
                    Jumper.jumpMe(this.myWorldPos.y);
                }
            }
        }
    }
}

var Jumper = {
    JUMP_FORCE:-12,
    GRAVITY:0.4,
    HOR_SPEED:0.6,

    myVisual:null,
    mySpeed:{dx:0,dy:0},
    myWorldPos:{x:185,y:290},

    init: function () {
        this.myVisual = $('.js-jumper');
    },

    resetPlayer: function () {
        this.mySpeed.dx = 0;
        this.mySpeed.dy = 0;
        this.myWorldPos = {x:185,y:290};
    },

    renderMe: function (_viewPortOffsetX, _viewPortOffsetY) {
        this.myVisual.css({
            left:`${this.myWorldPos.x - _viewPortOffsetX}px`,
            top:`${this.myWorldPos.y - _viewPortOffsetY}px`
        });
    },

    jumpMe: function (_platformY) {
        this.mySpeed.dy = this.JUMP_FORCE;
        this.myWorldPos.y = _platformY;
    },

    isGoingDown: function () {
        return this.mySpeed.dy > 0;
    },

    isGoingUp: function () {
        return this.mySpeed.dy < 0;
    },

    onUpdateMe: function () {
        this.mySpeed.dy += this.GRAVITY;
        this.mySpeed.dx *=0.9;


        if (TheGame.bLeftIsPressed) {
            this.mySpeed.dx -= this.HOR_SPEED;
        }
        if (TheGame.bRightIsPressed) {
            this.mySpeed.dx += this.HOR_SPEED;
        }

        this.myWorldPos.x += this.mySpeed.dx;
        this.myWorldPos.y += this.mySpeed.dy;

        if(this.myWorldPos.x < 0){
            this.myWorldPos.x = TheGame.AREA_WIDTH;
        }else if(this.myWorldPos.x > TheGame.AREA_WIDTH){
            this.myWorldPos.x = 0;
        }
    }
};