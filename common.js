class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(
            this.x + other.x,
            this.y + other.y
        )
    }
}
class Object {
    gravity = 0.4;
    image = new FlipImage();
    hitboxes = new HitBoxes();

    constructor(ctx, x, y, w, h) {
        this.ctx = ctx;
        this.position = new Vector2(x, y);
        this.scale = new Vector2(w, h);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
    }
    setPosition(p_x, p_y) {
        this.position = new Vector2(p_x, p_y);
    }
    setVelocity(v_x, v_y) {
        this.velocity = new Vector2(v_x, v_y);
    }
    setAcceleration(a_x, a_y) {
        this.acceleration = new Vector2(a_x, a_y);
    }
    setGravity() {
        this.setAcceleration(this.acceleration.x, this.gravity);
    }

    setImage(image_path) {
        this.image.add(image_path);
    }

    draw() {
        this.ctx.drawImage(this.image.getCurrent(), this.position.x, this.position.y, this.scale.x, this.scale.y);
    }
    move() {
        this.velocity = this.velocity.add(this.acceleration);
        this.position = this.position.add(this.velocity);
    }
    hitTest(other) {
        return HitTester.hitTest(this, other);
    }
}

class TextBox extends Object{
    constructor(ctx, x, y, w, h, text) {
        super(ctx, x, y, w, h);
        this.text = text;
        this.color = 'black';
        this.text_align = 'left';
    }

    draw() {
        this.ctx.font = '20px Meiryo';
        this.ctx.textAlign = this.text_align;
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(this.text, this.position.x, this.position.y);
    }
}

class FlipImage {
    flip_index = 0;

    constructor() {
        this.images = [];
        this.startupInterval(50);
    }

    add(path) {
        const image = new Image();
        image.src = path;
        this.images.push(image);
    }

    getCurrent() {
        return this.images[this.flip_index];
    }

    changeInterval(interval) {
        if(this.timer == null) return;
        this.stopInterval();
        this.startupInterval(interval);
    }

    startupInterval(interval) {
        this.timer = setInterval(() => {
            this.flip_index = (this.flip_index + 1) % this.images.length;
        }, interval);
    }

    stopInterval() {
        clearInterval(this.timer);
    }
}

class HitBoxes {
    hitboxlist = [];

    add(hitbox) {
        this.hitboxlist.push(hitbox);
    }
    show(ctx, parent) {
        this.hitboxlist.forEach(e => {
            ctx.beginPath();
            ctx.arc(parent.position.x + e.x, parent.position.y + e.y, e.r, 0, Math.PI * 2);
            ctx.strokeStyle = 'red';
            ctx.stroke();
            ctx.closePath();
        });
    }
}

class HitTester {
    static hitTest(object1, object2) {
        return object1.hitboxes.hitboxlist.some(e1 => {
            return object2.hitboxes.hitboxlist.some(e2 => {
                const dx = (object1.position.x + e1.x) - (object2.position.x + e2.x);
                const dy = (object1.position.y + e1.y) - (object2.position.y + e2.y);
                const dr = e1.r + e2.r;
                return dx * dx + dy * dy < dr * dr;
            });
        });
    }
}

class HitBoxCircle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
}