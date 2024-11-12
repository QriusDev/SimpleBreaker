var canvas = document.getElementById('AnimationCanvas');
var context = canvas.getContext('2d');
let raf;
let running = false;

var lives = 3;
var score = 0;
var globalSpeed = 1;

const ball = {
    x: canvas.clientWidth / 2 - 15,
    y: canvas.clientHeight * 0.60,
    vx: 5,
    vy: 10,
    radius: 15,
    color: 'blue',
    held: false,
    hitPaddleRecently: false,
    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        context.closePath();
        context.fillStyle = this.color;
        context.fill();
    },
    restart() {
        this.x = canvas.clientWidth / 2 - 15;
        this.y = canvas.clientHeight * 0.60;
    }
};

const paddle = {
    x: canvas.clientWidth / 2,
    y: canvas.height * 0.75,
    hSpeed: 10,
    width: 100,
    height: 25,
    color: 'red',
    direction: 0,
    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    },
    restart() {
        this.x = canvas.clientWidth / 2 - 50;
    }
}

class Brick
{
    x = undefined;
    y = undefined;
    dead = false;
    width = 50;
    height = 25;
    color = 'orange';
    value = 80;
    hp = 1;
    scoreText;
    constructor(x, y, width, height)
    {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || this.width;
        this.height = height || this.height;

        this.scoreText = new HitScoreText(this.x, this.y);
    }

    draw()
    {
        context.save()
        context.fillStyle = this.color;
        context.strokeStyle = 'black';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.restore();
    }
}

class HitScoreText
{
    x = undefined;
    y = undefined;

    cX = undefined;
    cY = undefined;
    
    hSpeed = 1;
    ySpeed = 4;
    maxHMove = 20;
    scoreText = '';

    constructor(x, y)
    {
        this.cX = this.x = x;
        this.cY = this.y = y;
    }

    draw()
    {
        context.save()
        context.font = '20px sans-serif'
        context.strokeStyle = 'black';
        context.fillStyle = 'yellow';
        context.fillText(this.scoreText, this.x, this.y);
        context.strokeText(this.scoreText, this.x, this.y);
        context.restore();
    }
}

function resetBoard(liveCount=3)
{
    brickList = [];
    buildLayout();

    ball.restart();
    paddle.restart();
    
    lives = liveCount;
    score = 0;
}

function clear() 
{
    context.save();
    context.fillStyle = 'white';
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.restore();
}

var brickList = [];
var padding = 2;

var defaultBlockSize = {width: 50, height: 20};
function buildLayout(rowCount=5, colCount=10)
{
    // build layout
    for (var i = 0; i < rowCount; ++i)
    {
        for (var j = 0; j < colCount; ++j)
        {
            block = new Brick(
                (canvas.clientWidth*0.5 - colCount*0.5*defaultBlockSize.width) + (defaultBlockSize.width + padding) * j,
                20 + (defaultBlockSize.height + padding + 6) * i,
                defaultBlockSize.width,
                defaultBlockSize.height
            );

            var randomizeType = Math.floor((Math.random() * 100)) % 3;
            switch(randomizeType)
            {
                case 0:
                case 1:
                {
                    block.color = 'yellow';
                    block.value = 80;
                    block.hp = 1;
                    break;
                }

                case 2:
                {
                    block.color = 'orange';
                    block.value = 140;
                    block.hp = 2;
                    break;
                }
                
            }
            brickList.push(block);
        }
    }
}
buildLayout();

function draw()
{
    clear();

    // Handle ball
    ball.draw();
    ball.x += ball.vx * globalSpeed;
    ball.y += ball.vy * globalSpeed;

    var ballCenterX = ball.x + ball.width;

    // Draw the alive bricks
    for (var b of brickList)
    {
        if (!b.dead)
        {
            b.draw();
        }
        else
        {
            b.scoreText.scoreText = '+' + b.value;

            if (b.scoreText.x <= b.scoreText.cX + b.scoreText.maxHMove)
            {
                b.scoreText.x += b.scoreText.hSpeed * globalSpeed;
                b.scoreText.y += b.scoreText.ySpeed * globalSpeed;
                b.scoreText.draw();
            }
        }
    }

    if (ball.y + ball.vy > canvas.clientHeight - ball.radius)
    {
        lives -= 1;
        score -= 30 * (3 - lives);

        if (lives <= 0)
        {
            console.log('You have lost with the score: ' + score);

            resetBoard();
        }
        else
        {
            paddle.restart();
            ball.restart();
        }

        console.log(lives, score);
    }
    else if (globalSpeed > 0)
    {
        var paddleBounds = convertToBounds(paddle.x, paddle.y, paddle.width, paddle.height);
        var ballBounds = convertToBounds(ball.x, ball.y, ball.radius, ball.radius);
        if (
            ball.y + ball.vy < ball.radius
        )
        {
            ball.vy = -ball.vy;
            console.log('out')
        }
        else if (paddleBounds.collidesWith(ballBounds))
        {
            if (!ball.hitPaddleRecently)
            {
                ball.vy = -ball.vy;
                ball.hitPaddleRecently = true;
                setTimeout(() => {
                    ball.hitPaddleRecently = false;
                }, 100);
            }
        }
        else
        {
            for (var b of brickList)
            {
                if (!b.dead)
                {
                    var bBounds = convertToBounds(b.x, b.y, b.width, b.height);
                    if (bBounds.collidesWith(ballBounds))
                    {
                        if (ballCenterX < b.x || ballCenterX > b.x + b.width)
                        {
                            ball.vx = -ball.vx;
                        }
                        ball.vy = -ball.vy;
                        
                        b.hp -= 1;
                        if (b.hp <= 0)
                        {
                            b.dead = true;
                        }
                        else
                        {
                            b.color = 'orange';
                        }
                        
                        score += b.value;
                        console.log('hit brick for value ' + b.value);
                    }
                }
            }
        }
    
        if (
            ball.x + ball.vx > canvas.clientWidth - ball.radius ||
            ball.x + ball.vx < ball.radius 
        )
        {
            ball.vx = -ball.vx;
        }
    }


    // Handle Paddle
    paddle.draw();
    if (paddle.direction < 0)
    {
        paddle.x -= paddle.hSpeed * globalSpeed;
    }
    else if (paddle.direction > 0)
    {
        paddle.x += paddle.hSpeed * globalSpeed;
    }
    else
    {
        // Do nothing, we're not going in a direction.
    }

    if (globalSpeed == 0)
    {
        context.save();
        context.fillStyle = 'black';
        context.fillText('PAUSED', canvas.clientWidth / 2, canvas.clientHeight / 2);
        context.restore();
    }

    raf = window.requestAnimationFrame(draw);
}

function convertToBounds(x, y, width, height)
{
    var bounds = {};
    bounds.topleft = {x, y};
    bounds.topright = {x: x+width, y};
    bounds.bottomleft = {x, y: y+height};
    bounds.bottomright = {x: x+width, y: y+height};
    bounds.isOverlapping = function(x, y)
    {
        return (this.topleft.x <= x && this.topleft.y <= y) &&
                (this.bottomright.x >= x && this.bottomright.y >= y);
    }
    bounds.collidesWith = function(other)
    {
        return this.isOverlapping(other.topleft.x, other.topleft.y) ||
            this.isOverlapping(other.bottomright.x, other.bottomright.y) ||
            this.isOverlapping(other.topright.x, other.topright.y) ||
            this.isOverlapping(other.bottomleft.x, other.bottomleft.y);
    }

    return bounds;
}

function valueWithinBounds(val, low, hi)
{
    return val > low && val < hi;
}

canvas.addEventListener('click', (e) => {
    if (!running)
    {
        raf = window.requestAnimationFrame(draw);
        running = true;
    }
});

// canvas.addEventListener('mouseout', (e) => {
//     window.cancelAnimationFrame(raf);
//     running = false;
// });

document.addEventListener('keydown', (e) => {
    console.log(e.key);
    switch(e.key)
    {
        case 'ArrowLeft':
        case 'a':
        {
            paddle.direction = -1;
            break;
        }

        case 'ArrowRight':
        case 'd':
        {
            paddle.direction = 1;
            break;
        }

        case ' ':
        {
            if (globalSpeed > 0)
            {
                globalSpeed = 0;
            }
            else
            {
                globalSpeed = 1;
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key)
    {
        case 'ArrowLeft':
        case 'a':
        {
            if (paddle.direction < 0)
            {
                paddle.direction = 0;
            }
            break;
        }

        case 'ArrowRight':
        case 'd':
        {
            if (paddle.direction > 0)
            {
                paddle.direction = 0;
            }
            
            break;
        }
    }
});

ball.draw();
console.log('Hello World!');