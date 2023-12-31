let game;

class Game {
    constructor() {
        this.canvas = document.getElementById('screen');
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.ctx = this.canvas.getContext('2d');
        // アンチエイリアスの解除
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;

        this.mode = GAMEMODE.STANDBY;
        this.level = GAMELEVEL.LOW;
        this.level_timer = new LevelTimer();
        this.message = this.createStartMessage();

        this.createBackgroundObjects()
        this.currentScore = new ScoreBoard(this.ctx, 10, 25, 0, 0, 'SCORE');
        this.highScore = new ScoreBoard(this.ctx, 10, 50, 0, 0, '  HIGH');

        this.canvas.addEventListener('click', e => this.clickEvent(e));
    }

    static startup() {
        game = new Game();
        game.run();
    }

    createStartMessage() {
        const textbox = new TextBox(this.ctx, this.canvas.width/2, this.canvas.height/2, 200, 200, 'TOUCH TO START');
        textbox.text_align = 'center';
        textbox.blink_interval = 50;
        textbox.blink_timer = textbox.blink_interval;
        textbox.isPrinted = true;
        textbox.blink = function() {
            if(this.blink_timer-- <= 0) {
                this.blink_timer = this.blink_interval;
                this.isPrinted = !this.isPrinted;
            }
        };

        return textbox;
    }

    createGameoverMessage() {
        const textbox = new TextBox(this.ctx, this.canvas.width/2, this.canvas.height/2, 200, 200, 'GAMEOVER');
        textbox.text_align = 'center';

        return textbox;
    }

    clickEvent(e) {
        this.mode.clickEvent(game);
    }

    clearScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    hitTestEnemy() {
        this.spowner.enemies.forEach(e => {
            if(this.ruka.hitTest(e)) {
                this.message = this.createGameoverMessage();
                this.ruka.image.stopInterval();
                this.spowner.enemies.forEach(e1 => {e1.image.stopInterval();});
                this.level_timer.stop();
                this.level_timer.reset();
                this.mode = GAMEMODE.GAMEOVER;
            }
        })
    }

    createBackgroundObjects() {
        this.backgroundsky = Array.from({length:10}, (_, i) => {return Array.from(
                                        {length:5}, (_, j) => {return new BackgroundSky(this.ctx, i*64, j*64);})}
                                        ).flat();
        this.backgroundwaves = Array.from({length:10}, (_, i) => {return new BackgroundWave(this.ctx, i*64);});
        this.backgroundseas = Array.from({length:10}, (_, i) => {return Array.from(
                                        {length:2}, (_, j) => {return new BackgroundSea(this.ctx, i*64, 300 + 64 + j*64);})}
                                        ).flat();
        this.cloudSpowner = new CloudSpowner(this.ctx);
    }

    drawBackground() {
        game.backgroundsky.forEach(w => {w.draw();});
        game.backgroundwaves.forEach(w => {w.draw();});
        game.backgroundseas.forEach(w => {w.draw();});
        game.cloudSpowner.clouds.forEach(e => {e.draw();});
    }

    run() {
        game.clearScreen();
        game.mode.run(game);
        requestAnimationFrame(game.run);
    }

}

class LevelTimer {
    count = 0;
    start() {
        this.timer = setInterval(() => {
            this.count++;
            if(game.level.NEXT_LEVEL && this.count > game.level.CHANGE_LEVEL_THRESHOLD) {
                game.level = GAMELEVEL[game.level.NEXT_LEVEL];
            }
        }, 1000);
    }
    stop() {
        clearInterval(this.timer);
    }
    reset() {
        this.count = 0;
    }
}

SCENE_STANDBY = {
    clickEvent: (game) => {
        game.level = GAMELEVEL.LOW;
        game.ruka = new Player(game.ctx);
        game.splash = new BackgroundSplash(game.ctx);
        game.spowner = new EnemySpowner(game.ctx);
        game.level_timer.start();
        game.mode = GAMEMODE.PLAY;
    },

    run: (game) => {
        game.cloudSpowner.update();
        game.drawBackground();
        game.message.blink();
        if(game.message.isPrinted) {
            game.message.draw();
        }
        game.currentScore.draw();
        game.highScore.draw();
    }
}
SCENE_PLAY = {
    clickEvent: (game) => {
        game.ruka.jump();
    },

    run: (game) => {
        game.cloudSpowner.update();
        game.drawBackground();
        game.ruka.update();
        if(game.ruka.isLanding()){
            game.splash.draw();
        }
        game.highScore.update(
            game.currentScore.increase()
        );
        game.currentScore.draw();
        game.highScore.draw();
        game.spowner.update();
        game.hitTestEnemy();
    }
}
SCENE_GAMEOVER = {
    clickEvent: (game) => {
        game.message = game.createStartMessage();
        game.currentScore.reset();
        game.mode = GAMEMODE.STANDBY;
    },

    run: (game) => {
        game.cloudSpowner.update();
        game.drawBackground();
        game.ruka.draw();
        game.spowner.enemies.forEach(e => {
            e.draw();
        });
        game.currentScore.draw();
        game.highScore.draw();
        game.message.draw();
    }
}

const GAMEMODE = {
    STANDBY: SCENE_STANDBY,
    PLAY: SCENE_PLAY,
    GAMEOVER: SCENE_GAMEOVER
};
const GAMELEVEL = {
    LOW: {
        ENEMY_SPEED: -5,
        ENEMY_SPOWN_THRESHOLD: 400,
        ENEMY_SPOWN_INTERVAL: 100,
        CHANGE_LEVEL_THRESHOLD: 20,
        NEXT_LEVEL: 'MIDDLE'
    },
    MIDDLE: {
        ENEMY_SPEED: -6,
        ENEMY_SPOWN_THRESHOLD: 350,
        ENEMY_SPOWN_INTERVAL: 80,
        CHANGE_LEVEL_THRESHOLD: 40,
        NEXT_LEVEL: 'HIGH'
    },
    HIGH: {
        ENEMY_SPEED: -7,
        ENEMY_SPOWN_THRESHOLD: 300,
        ENEMY_SPOWN_INTERVAL: 55,
        CHANGE_LEVEL_THRESHOLD: 60,
        NEXT_LEVEL: 'VERYHIGH'
    },
    VERYHIGH: {
        ENEMY_SPEED: -9,
        ENEMY_SPOWN_THRESHOLD: 200,
        ENEMY_SPOWN_INTERVAL: 25
    }
}


class Player extends Object {
    constructor(ctx) {
        super(ctx, 64, 256, 64, 64);
        this.setAcceleration(0, 0.2);
        this.setImage('./images/ruka01.png');
        this.setImage('./images/ruka02.png');
        this.image.changeInterval(250);
        this.hitboxes.add(new HitBoxCircle(34, 16, 18));
        this.hitboxes.add(new HitBoxCircle(54, 30, 8));
        this.hitboxes.add(new HitBoxCircle(14, 50, 10));
    }
    update() {
        const base = 300;
        if(this.position.y > base) {
            this.setVelocity(0, 0);
            this.setAcceleration(0, 0);
            this.setPosition(this.position.x, base);
        }
        this.move();
        this.draw();
    }
    isLanding() {
        return this.velocity.y == 0;
    }
    jump() {
        if (this.isLanding()) {
            this.setVelocity(0, -13);
            this.setGravity();
        }
    }
}

class EnemySpowner {
    enemies = [];
    spownThreshold = 300;
    interval_timer = 0;

    constructor(ctx) {
        this.ctx = ctx;
    }

    spown() {
        this.enemies.push(
            Math.random() < 0.3 ?
            new Ax(this.ctx) :
            new Avocado(this.ctx)
        );
    }
    sortEnemies() {
        this.enemies = this.enemies.filter(e => e.position.x >= -e.scale.x);
    }
    update() {
        this.spownThreshold--;

        this.sortEnemies();
        if(this.interval_timer-- <= 0 & Math.random() < 1/this.spownThreshold) {
            this.spown();
            this.spownThreshold = game.level.ENEMY_SPOWN_THRESHOLD;
            this.interval_timer = game.level.ENEMY_SPOWN_INTERVAL;
        }

        this.enemies.forEach(e => {
            e.update();
        })
    }

}

class Avocado extends Object {
    constructor(ctx) {
        super(ctx, 650, 300, 64, 64);
        this.setVelocity(game.level.ENEMY_SPEED, 0);
        this.setImage('./images/avocado01.png');
        this.setImage('./images/avocado02.png');
        this.image.changeInterval(250);
        this.hitboxes.add(new HitBoxCircle(28, 40, 20));
        this.hitboxes.add(new HitBoxCircle(40, 20, 12));
    }
    update() {
        this.move();
        this.draw();
    }
}

class Ax extends Object {
    constructor(ctx) {
        super(ctx, 650, 300 - Math.random() * 256, 64, 64);
        this.setVelocity(game.level.ENEMY_SPEED + (Math.random() - 0.5) * 2, 0);
        this.setImage('./images/ax01.png');
        this.setImage('./images/ax02.png');
        this.setImage('./images/ax03.png');
        this.setImage('./images/ax04.png');
        this.setImage('./images/ax05.png');
        this.setImage('./images/ax06.png');
        this.setImage('./images/ax07.png');
        this.setImage('./images/ax08.png');
        this.hitboxes.add(new HitBoxCircle(32, 32, 32));
    }
    update() {
        this.move();
        this.draw();
    }
}

class BackgroundSky extends Object {
    constructor(ctx, x, y) {
        super(ctx, x, y, 64, 64);
        this.setImage('./images/sky01.png');
    }
}

class BackgroundWave extends Object {
    constructor(ctx, x) {
        super(ctx, x, 300, 64, 64);
        this.setImage('./images/wave01.png');
        this.setImage('./images/wave02.png');
        this.setImage('./images/wave03.png');
        this.image.changeInterval(500);
    }
}

class BackgroundSea extends Object {
    constructor(ctx, x, y) {
        super(ctx, x, y, 64, 64);
        this.setImage('./images/sea01.png');
        this.setImage('./images/sea02.png');
        this.setImage('./images/sea03.png');
        this.image.changeInterval(500);
    }
}

class BackgroundSplash extends Object {
    constructor(ctx) {
        super(ctx, 16, 288, 64, 64);
        this.setImage('./images/splash01.png');
        this.setImage('./images/splash02.png');
        this.image.changeInterval(500);
    }
}

class CloudSpowner {
    clouds = [];
    spownThresholdBase = 500;
    spownThreshold = 50;
    intervalBase = 5;
    interval_timer = 0;

    constructor(ctx) {
        this.ctx = ctx;
    }

    spown() {
        this.clouds.push(
            Math.random() < 0.1 ?
            new BackgroundCloudDolphin(this.ctx, Math.random() * 128) :
            new BackgroundCloud(this.ctx, Math.random() * 128)
        );
    }
    sortClouds() {
        this.clouds = this.clouds.filter(e => e.position.x >= -e.scale.x);
    }
    update() {
        this.spownThreshold--;

        this.sortClouds();
        if(this.interval_timer-- <= 0 & Math.random() < 1/this.spownThreshold) {
            this.spown();
            this.spownThreshold = this.spownThresholdBase;
            this.interval_timer = this.intervalBase;
        }

        this.clouds.forEach(e => {
            e.update();
        })
    }
}

class BackgroundCloud extends Object {
    constructor(ctx, y) {
        super(ctx, 640, y, 64, 64);
        this.setImage('./images/cloud01.png');
        this.setVelocity(-1, 0);
    }
    update() {
        this.move();
        this.draw();
    }
}

class BackgroundCloudDolphin extends Object {
    constructor(ctx, y) {
        super(ctx, 640, y, 64, 64);
        this.setImage('./images/cloud_dolphin01.png');
        this.setVelocity(-1, 0);
    }
    update() {
        this.move();
        this.draw();
    }
}

class ScoreBoard extends TextBox {
    score = 0

    constructor(ctx, x, y, w, h, text) {
        super(ctx, x, y, w, h, text);
        this.pretext = text;
    }

    draw() {
        this.text = this.pretext + ': ' + this.score;
        super.draw();
    }
    reset() {
        this.score = 0;
    }
    increase() {
        return ++this.score;
    }
    update(value) {
        if(this.score < value) {
            this.score = value;
        }
    }
}